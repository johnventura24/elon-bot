require('dotenv').config();
const express = require('express');
const { WebClient } = require('@slack/web-api');
const cron = require('node-cron');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Check if .env file exists, if not create one with instructions
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Slack configuration
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=

# Application settings
PORT=3000
MONGODB_URI=mongodb://localhost:27017/eod-reports

# Reporting time (24-hour format)
REPORT_HOUR=16
REPORT_MINUTE=30

# Timezone (default: America/New_York)
TIMEZONE=America/New_York`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('Created .env file with placeholder values. Please update with your actual credentials.');
}

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

// Connect to MongoDB if URI is provided, otherwise use in-memory storage
let employeeModel, reportModel;
const employees = [];
const reports = [];

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
  
  // Define MongoDB schemas
  const EmployeeSchema = new mongoose.Schema({
    slackId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    department: String,
    active: { type: Boolean, default: true }
  });

  const ReportSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    slackId: String,
    date: { type: Date, default: Date.now },
    accomplishments: String,
    submitted: { type: Boolean, default: false }
  });

  employeeModel = mongoose.model('Employee', EmployeeSchema);
  reportModel = mongoose.model('Report', ReportSchema);
}

// Employee data management
const employeeService = {
  async getAll() {
    if (employeeModel) {
      return await employeeModel.find({ active: true });
    }
    return employees.filter(e => e.active);
  },
  
  async findById(slackId) {
    if (employeeModel) {
      return await employeeModel.findOne({ slackId });
    }
    return employees.find(e => e.slackId === slackId);
  },
  
  async add(employee) {
    if (employeeModel) {
      return await employeeModel.create(employee);
    }
    employees.push(employee);
    return employee;
  },
  
  async update(slackId, data) {
    if (employeeModel) {
      return await employeeModel.findOneAndUpdate({ slackId }, data, { new: true });
    }
    const index = employees.findIndex(e => e.slackId === slackId);
    if (index >= 0) {
      employees[index] = { ...employees[index], ...data };
      return employees[index];
    }
    return null;
  }
};

// Report data management
const reportService = {
  async create(data) {
    if (reportModel) {
      return await reportModel.create(data);
    }
    reports.push(data);
    return data;
  },
  
  async update(id, data) {
    if (reportModel) {
      return await reportModel.findByIdAndUpdate(id, data, { new: true });
    }
    const index = reports.findIndex(r => r.id === id);
    if (index >= 0) {
      reports[index] = { ...reports[index], ...data };
      return reports[index];
    }
    return null;
  },
  
  async getByDate(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    if (reportModel) {
      return await reportModel.find({
        date: { $gte: start, $lte: end }
      }).populate('employee');
    }
    
    return reports.filter(r => {
      const reportDate = new Date(r.date);
      return reportDate >= start && reportDate <= end;
    });
  }
};

// Send EOD message to an employee
async function sendEodMessage(employee) {
  try {
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hi ${employee.name}! :wave: Time to wrap up for the day!`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Please share what you've accomplished today:"
        }
      },
      {
        type: "input",
        block_id: "accomplishments_block",
        element: {
          type: "plain_text_input",
          action_id: "accomplishments_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "List your accomplishments here..."
          }
        },
        label: {
          type: "plain_text",
          text: "Today's Accomplishments"
        }
      },
      {
        type: "actions",
        block_id: "submit_block",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Submit"
            },
            style: "primary",
            action_id: "submit_accomplishments"
          }
        ]
      }
    ];

    const result = await slack.chat.postMessage({
      channel: employee.slackId,
      blocks,
      text: "Time to submit your end-of-day accomplishments!"
    });

    // Create a new report entry
    await reportService.create({
      employee: employee._id || null,
      slackId: employee.slackId,
      date: new Date(),
      accomplishments: "",
      submitted: false
    });

    return result;
  } catch (error) {
    console.error(`Error sending message to ${employee.name}:`, error);
    return null;
  }
}

// Schedule the EOD message to be sent at the specified time
const scheduledHour = process.env.REPORT_HOUR || 16;
const scheduledMinute = process.env.REPORT_MINUTE || 30;
const timezone = process.env.TIMEZONE || 'America/New_York';

cron.schedule(`${scheduledMinute} ${scheduledHour} * * 1-5`, async () => {
  console.log('Sending EOD messages...');
  const employees = await employeeService.getAll();
  
  for (const employee of employees) {
    await sendEodMessage(employee);
  }
}, {
  timezone
});

// API Routes
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await employeeService.getAll();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = await employeeService.add(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reports/:date?', async (req, res) => {
  try {
    const date = req.params.date ? new Date(req.params.date) : new Date();
    const reports = await reportService.getByDate(date);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slack interaction endpoint
app.post('/slack/events', async (req, res) => {
  const { type, payload } = req.body;

  if (type === 'interactive' && payload.actions?.[0]?.action_id === 'submit_accomplishments') {
    const { user, blocks } = payload;
    const accomplishmentsBlock = blocks.find(block => block.block_id === 'accomplishments_block');
    const accomplishments = accomplishmentsBlock.element.value;
    
    // Update the employee's report
    const employee = await employeeService.findById(user.id);
    if (employee) {
      // Find today's report for this employee
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reports = await reportService.getByDate(today);
      const report = reports.find(r => r.slackId === user.id);
      
      if (report) {
        await reportService.update(report._id || report.id, { 
          accomplishments, 
          submitted: true 
        });
      }
      
      // Send confirmation message
      await slack.chat.postMessage({
        channel: user.id,
        text: "Thanks for submitting your accomplishments for today!"
      });
    }
    
    res.status(200).send();
  } else {
    res.status(404).send();
  }
});

// Generate daily report
app.get('/api/generate-report/:date?', async (req, res) => {
  try {
    const date = req.params.date ? new Date(req.params.date) : new Date();
    const reports = await reportService.getByDate(date);
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let reportText = `# Team Accomplishments - ${formattedDate}\n\n`;
    
    if (reports.length === 0) {
      reportText += "No accomplishments reported for this date.";
    } else {
      for (const report of reports) {
        const employeeName = report.employee?.name || 'Unknown Employee';
        reportText += `## ${employeeName}\n\n`;
        
        if (report.submitted) {
          reportText += report.accomplishments + "\n\n";
        } else {
          reportText += "No response submitted.\n\n";
        }
      }
    }
    
    res.json({ 
      date: formattedDate,
      reportText,
      rawReports: reports
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`EOD messages scheduled for ${scheduledHour}:${scheduledMinute} ${timezone}`);
}); 