const cron = require('cron');
const User = require('../models/User');
const Forecast = require('../models/Forecast');
const { sendReminderEmail } = require('./emailService');

const startCronJobs = () => {
  // Send reminder emails every Monday at 9 AM
  const reminderJob = new cron.CronJob('0 9 * * 1', async () => {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);

      // Find HODs who haven't submitted forecasts for current quarter
      const hods = await User.find({ role: 'hod', isActive: true }).populate('department');
      
      for (const hod of hods) {
        const existingForecast = await Forecast.findOne({
          department: hod.department._id,
          'period.year': currentYear,
          'period.quarter': currentQuarter,
          status: { $in: ['submitted', 'reviewed', 'approved'] }
        });

        if (!existingForecast) {
          await sendReminderEmail(hod.email, hod.name, hod.department.name);
        }
      }
    } catch (error) {
      console.error('Reminder job failed:', error);
    }
  });

  reminderJob.start();
  console.log('Cron jobs started');
};

module.exports = { startCronJobs };
