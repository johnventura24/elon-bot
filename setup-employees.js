require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { WebClient } = require('@slack/web-api');
const mongoose = require('mongoose');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Please create a .env file first with your Slack credentials');
  process.exit(1);
}

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Employee schema (similar to index.js)
let employeeModel;
const employees = [];

// Connect to MongoDB if URI is provided, otherwise use in-memory storage
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Proceeding with in-memory storage');
    });
  
  const EmployeeSchema = new mongoose.Schema({
    slackId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    department: String,
    active: { type: Boolean, default: true }
  });

  employeeModel = mongoose.model('Employee', EmployeeSchema);
}

// Helper function to add employee
async function addEmployee(employee) {
  try {
    if (employeeModel) {
      // Check if employee already exists
      const existing = await employeeModel.findOne({ slackId: employee.slackId });
      if (existing) {
        console.log(`Employee with Slack ID ${employee.slackId} already exists`);
        return existing;
      }
      return await employeeModel.create(employee);
    } else {
      // Check in memory array
      const existingIndex = employees.findIndex(e => e.slackId === employee.slackId);
      if (existingIndex >= 0) {
        console.log(`Employee with Slack ID ${employee.slackId} already exists`);
        return employees[existingIndex];
      }
      employees.push(employee);
      
      // Save to a JSON file as a backup
      fs.writeFileSync(
        path.join(__dirname, 'employees.json'), 
        JSON.stringify(employees, null, 2)
      );
      
      return employee;
    }
  } catch (error) {
    console.error('Error adding employee:', error);
    return null;
  }
}

// Main menu
async function mainMenu() {
  console.log('\n===== Employee Management =====');
  console.log('1. List all Slack users');
  console.log('2. Add employee by Slack ID');
  console.log('3. Add employee by email lookup');
  console.log('4. List current employees');
  console.log('5. Import employees from JSON file');
  console.log('6. Exit');
  
  rl.question('\nSelect an option: ', async (answer) => {
    switch (answer) {
      case '1':
        await listSlackUsers();
        break;
      case '2':
        await addEmployeeById();
        break;
      case '3':
        await addEmployeeByEmail();
        break;
      case '4':
        await listEmployees();
        break;
      case '5':
        await importEmployees();
        break;
      case '6':
        console.log('Exiting...');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option, please try again');
        mainMenu();
    }
  });
}

// List Slack users
async function listSlackUsers() {
  try {
    console.log('Fetching users from Slack...');
    const result = await slack.users.list();
    
    if (result.ok) {
      const users = result.members.filter(user => 
        !user.is_bot && 
        !user.deleted &&
        user.name !== 'slackbot'
      );
      
      console.log(`\nFound ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.real_name || user.name} (${user.id}) - ${user.profile.email || 'No email'}`);
      });
    } else {
      console.error('Error fetching users:', result.error);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
  
  // Return to main menu
  rl.question('\nPress Enter to continue...', () => {
    mainMenu();
  });
}

// Add employee by Slack ID
async function addEmployeeById() {
  rl.question('Enter Slack ID: ', async (slackId) => {
    try {
      // Get user info from Slack
      const result = await slack.users.info({ user: slackId });
      
      if (result.ok) {
        const user = result.user;
        
        console.log(`\nUser found: ${user.real_name || user.name} (${user.profile.email || 'No email'})`);
        
        rl.question('Enter department: ', async (department) => {
          const employee = {
            slackId: user.id,
            name: user.real_name || user.name,
            email: user.profile.email,
            department,
            active: true
          };
          
          const added = await addEmployee(employee);
          if (added) {
            console.log('Employee added successfully!');
          }
          
          mainMenu();
        });
      } else {
        console.error('Error fetching user:', result.error);
        mainMenu();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      mainMenu();
    }
  });
}

// Add employee by email
async function addEmployeeByEmail() {
  rl.question('Enter email address: ', async (email) => {
    try {
      console.log('Fetching users from Slack...');
      const result = await slack.users.list();
      
      if (result.ok) {
        const user = result.members.find(u => 
          u.profile.email && 
          u.profile.email.toLowerCase() === email.toLowerCase()
        );
        
        if (user) {
          console.log(`\nUser found: ${user.real_name || user.name} (${user.id})`);
          
          rl.question('Enter department: ', async (department) => {
            const employee = {
              slackId: user.id,
              name: user.real_name || user.name,
              email: user.profile.email,
              department,
              active: true
            };
            
            const added = await addEmployee(employee);
            if (added) {
              console.log('Employee added successfully!');
            }
            
            mainMenu();
          });
        } else {
          console.log('No user found with that email address');
          mainMenu();
        }
      } else {
        console.error('Error fetching users:', result.error);
        mainMenu();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      mainMenu();
    }
  });
}

// List employees
async function listEmployees() {
  try {
    let employees = [];
    
    if (employeeModel) {
      employees = await employeeModel.find();
    } else if (fs.existsSync(path.join(__dirname, 'employees.json'))) {
      const data = fs.readFileSync(path.join(__dirname, 'employees.json'));
      employees = JSON.parse(data);
    }
    
    if (employees.length === 0) {
      console.log('No employees found');
    } else {
      console.log(`\nFound ${employees.length} employees:`);
      employees.forEach((employee, index) => {
        console.log(`${index + 1}. ${employee.name} (${employee.slackId}) - ${employee.department || 'No department'}`);
      });
    }
  } catch (error) {
    console.error('Error listing employees:', error);
  }
  
  // Return to main menu
  rl.question('\nPress Enter to continue...', () => {
    mainMenu();
  });
}

// Import employees from JSON file
async function importEmployees() {
  rl.question('Enter path to JSON file: ', async (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error('File not found');
        mainMenu();
        return;
      }
      
      const data = fs.readFileSync(filePath);
      const importedEmployees = JSON.parse(data);
      
      if (!Array.isArray(importedEmployees)) {
        console.error('Invalid file format. Expected an array of employees');
        mainMenu();
        return;
      }
      
      console.log(`Found ${importedEmployees.length} employees to import`);
      
      for (const employee of importedEmployees) {
        if (!employee.slackId || !employee.name) {
          console.log(`Skipping invalid employee: ${JSON.stringify(employee)}`);
          continue;
        }
        
        await addEmployee(employee);
        console.log(`Imported: ${employee.name}`);
      }
      
      console.log('Import completed');
    } catch (error) {
      console.error('Error importing employees:', error);
    }
    
    mainMenu();
  });
}

// Start the application
console.log('=== Employee Setup Utility ===');
console.log('This utility helps you add employees to the EOD reporting system');

mainMenu(); 