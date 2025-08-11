const cron = require('node-cron');
const User = require('../models/User');
const Department = require('../models/Department');
const Forecast = require('../models/Forecast'); // Move this to top for consistency
const { sendForecastReminderEmail, sendDeadlineWarningEmail } = require('./emailService');

class ReminderSystem {
  constructor() {
    this.jobs = new Map();
  }

  // Start all reminder jobs
  startReminderJobs() {
    console.log('🔔 Starting automated reminder system...');
    
    // Daily check at 9 AM for pending forecasts
    this.scheduleDailyReminders();
    
    // Weekly summary on Monday at 10 AM
    this.scheduleWeeklyReminders();
    
    // End of quarter urgent reminders
    this.scheduleUrgentReminders();
    
    console.log('✅ Reminder system started successfully');
  }

  // Daily reminders at 9 AM
  scheduleDailyReminders() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily forecast reminders...');
      await this.sendDailyReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });
    
    this.jobs.set('daily', job);
  }

  // Weekly reminders on Monday at 10 AM
  scheduleWeeklyReminders() {
    const job = cron.schedule('0 10 * * 1', async () => {
      console.log('📅 Running weekly forecast reminders...');
      await this.sendWeeklyReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });
    
    this.jobs.set('weekly', job);
  }

  // Urgent reminders - twice daily during last week of quarter
  scheduleUrgentReminders() {
    const job = cron.schedule('0 9,15 * * *', async () => {
      console.log('🚨 Checking for urgent deadline reminders...');
      await this.sendUrgentReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });
    
    this.jobs.set('urgent', job);
  }

  // Send daily reminders for pending forecasts
  async sendDailyReminders() {
    try {
      const currentQuarter = this.getCurrentQuarter();
      const currentYear = new Date().getFullYear();
      const quarterYear = `Q${currentQuarter} ${currentYear}`;

      // Find HODs who haven't submitted forecasts for current quarter
      const hodsWithoutForecasts = await this.getHODsWithoutForecasts(currentQuarter, currentYear);

      for (const hod of hodsWithoutForecasts) {
        try {
          await sendForecastReminderEmail(
            hod.email,
            hod.name,
            hod.departmentName,
            quarterYear
          );
          console.log(`✅ Daily reminder sent to ${hod.email}`);
        } catch (error) {
          console.error(`❌ Failed to send daily reminder to ${hod.email}:`, error);
        }
      }

      console.log(`📊 Daily reminders sent to ${hodsWithoutForecasts.length} HODs`);
    } catch (error) {
      console.error('❌ Error in daily reminders:', error);
    }
  }

  // Send weekly summary reminders
  async sendWeeklyReminders() {
    try {
      const currentQuarter = this.getCurrentQuarter();
      const currentYear = new Date().getFullYear();
      const quarterYear = `Q${currentQuarter} ${currentYear}`;

      // Get HODs with pending forecasts
      const hodsWithoutForecasts = await this.getHODsWithoutForecasts(currentQuarter, currentYear);

      // Send weekly reminders with more emphasis
      for (const hod of hodsWithoutForecasts) {
        try {
          await sendForecastReminderEmail(
            hod.email,
            hod.name,
            hod.departmentName,
            quarterYear
          );
          console.log(`✅ Weekly reminder sent to ${hod.email}`);
        } catch (error) {
          console.error(`❌ Failed to send weekly reminder to ${hod.email}:`, error);
        }
      }

      console.log(`📅 Weekly reminders sent to ${hodsWithoutForecasts.length} HODs`);
    } catch (error) {
      console.error('❌ Error in weekly reminders:', error);
    }
  }

  // Send urgent deadline warnings
  async sendUrgentReminders() {
    try {
      const currentQuarter = this.getCurrentQuarter();
      const currentYear = new Date().getFullYear();
      const quarterYear = `Q${currentQuarter} ${currentYear}`;
      const daysUntilDeadline = this.getDaysUntilQuarterEnd();

      // Send urgent reminders if within 7 days of quarter end
      if (daysUntilDeadline <= 7) {
        const hodsWithoutForecasts = await this.getHODsWithoutForecasts(currentQuarter, currentYear);

        for (const hod of hodsWithoutForecasts) {
          try {
            await sendDeadlineWarningEmail(
              hod.email,
              hod.name,
              hod.departmentName,
              quarterYear,
              daysUntilDeadline
            );
            console.log(`🚨 Urgent reminder sent to ${hod.email} (${daysUntilDeadline} days left)`);
          } catch (error) {
            console.error(`❌ Failed to send urgent reminder to ${hod.email}:`, error);
          }
        }

        console.log(`🚨 Urgent reminders sent to ${hodsWithoutForecasts.length} HODs`);
      }
    } catch (error) {
      console.error('❌ Error in urgent reminders:', error);
    }
  }

  // Get current quarter (1-4)
  getCurrentQuarter() {
    const month = new Date().getMonth() + 1;
    return Math.ceil(month / 3);
  }

  // Calculate days until end of current quarter
  getDaysUntilQuarterEnd() {
    const now = new Date();
    const currentQuarter = this.getCurrentQuarter();
    const currentYear = now.getFullYear();
    
    // Last day of each quarter
    const quarterEndDates = {
      1: new Date(currentYear, 2, 31), // March 31
      2: new Date(currentYear, 5, 30), // June 30
      3: new Date(currentYear, 8, 30), // September 30
      4: new Date(currentYear, 11, 31) // December 31
    };
    
    const quarterEnd = quarterEndDates[currentQuarter];
    const timeDiff = quarterEnd.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // FIXED: Get HODs who haven't submitted forecasts for the current quarter
  async getHODsWithoutForecasts(quarter, year) {
    try {
      // Get all HODs - FIXED: Use lowercase 'hod' instead of 'HOD'
      const hods = await User.find({ role: 'hod' }).populate('department');
      
      console.log(`🔍 Found ${hods.length} HODs in database`);
      
      // Check which HODs haven't submitted forecasts
      const hodsWithoutForecasts = [];
      
      for (const hod of hods) {
        // FIXED: Use correct field names that match your Forecast model
        const existingForecast = await Forecast.findOne({
          submittedBy: hod._id,      // FIXED: was 'user', now 'submittedBy'
          'period.year': year,       // FIXED: was 'year', now 'period.year'
          'period.quarter': quarter  // FIXED: was 'quarter', now 'period.quarter'
        });

        console.log(`🔍 Checking ${hod.name}: ${existingForecast ? 'HAS forecast' : 'NO forecast'} for Q${quarter} ${year}`);

        if (!existingForecast && hod.department) { // Also ensure department exists
          hodsWithoutForecasts.push({
            email: hod.email,
            name: hod.name,
            departmentName: hod.department?.name || 'Unknown Department',
            userId: hod._id
          });
          console.log(`✅ Added ${hod.name} to reminder list`);
        }
      }

      console.log(`📋 Total HODs without forecasts: ${hodsWithoutForecasts.length}`);
      return hodsWithoutForecasts;
    } catch (error) {
      console.error('❌ Error getting HODs without forecasts:', error);
      return [];
    }
  }

  // Stop all reminder jobs
  stopReminderJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped ${name} reminder job`);
    });
    this.jobs.clear();
    console.log('🛑 All reminder jobs stopped');
  }

  // Get status of all jobs
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = job.running;
    });
    return status;
  }

  // Manual trigger for testing
  async triggerManualReminder(type = 'daily') {
    console.log(`🔧 Manually triggering ${type} reminders...`);
    
    switch (type) {
      case 'daily':
        await this.sendDailyReminders();
        break;
      case 'weekly':
        await this.sendWeeklyReminders();
        break;
      case 'urgent':
        await this.sendUrgentReminders();
        break;
      default:
        console.error('❌ Invalid reminder type');
    }
  }
}

module.exports = new ReminderSystem();
