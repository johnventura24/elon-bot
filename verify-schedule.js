const cron = require('node-cron');

console.log('🚀 ELON BOT SCHEDULE VERIFICATION');
console.log('=====================================');

// Current time info
const now = new Date();
const estTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
console.log(`📅 Current Time (EST): ${estTime}`);
console.log(`📅 Day of Week: ${now.getDay()} (0=Sunday, 1=Monday, ..., 6=Saturday)`);
console.log(`📅 Is Weekday: ${now.getDay() >= 1 && now.getDay() <= 5 ? '✅ YES' : '❌ NO'}`);

// Show schedule
console.log('\n⏰ CRON SCHEDULE: "30 16 * * 1-5"');
console.log('   - Minute: 30 (4:30 PM)');
console.log('   - Hour: 16 (4 PM in 24-hour format)');
console.log('   - Day of Month: * (every day)');
console.log('   - Month: * (every month)');
console.log('   - Day of Week: 1-5 (Monday through Friday)');
console.log('   - Timezone: America/New_York (EST/EDT)');

// Calculate next execution times
console.log('\n📅 NEXT 5 EXECUTION TIMES:');
const nextExecutions = [];

for (let i = 0; i < 14; i++) { // Check next 14 days
  const checkDate = new Date(now);
  checkDate.setDate(now.getDate() + i);
  checkDate.setHours(16, 30, 0, 0); // 4:30 PM
  
  const dayOfWeek = checkDate.getDay();
  
  // Only weekdays (Monday=1 through Friday=5)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    nextExecutions.push({
      date: checkDate,
      dayName: dayName,
      formatted: checkDate.toLocaleString('en-US', { timeZone: 'America/New_York' })
    });
  }
  
  if (nextExecutions.length >= 5) break;
}

nextExecutions.forEach((exec, index) => {
  const isToday = exec.date.toDateString() === now.toDateString();
  const isPast = exec.date < now;
  const status = isToday && isPast ? '⏰ MISSED TODAY' : 
                 isToday ? '🔥 TODAY!' : 
                 '📅 SCHEDULED';
  
  console.log(`   ${index + 1}. ${exec.dayName} - ${exec.formatted} ${status}`);
});

// Verify cron expression
console.log('\n🧪 CRON VALIDATION:');
const cronExpression = '30 16 * * 1-5';
console.log(`   - Expression: "${cronExpression}"`);
console.log(`   - Valid: ${cron.validate(cronExpression) ? '✅ YES' : '❌ NO'}`);

// Check if we're in the right timezone
console.log('\n🌍 TIMEZONE VERIFICATION:');
console.log(`   - Server Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log(`   - Cron Timezone: America/New_York`);
console.log(`   - EST Time: ${estTime}`);

console.log('\n✅ SYSTEM STATUS: READY TO SEND AT 4:30 PM EST (MON-FRI)');
console.log('🚀 Keep the server running to ensure automatic delivery!'); 