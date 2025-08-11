const mongoose = require('mongoose');
const User = require('./models/User');
const Forecast = require('./models/Forecast');
const Department = require('./models/Department');  // ← ADD THIS LINE
require('dotenv').config();

const debugQuarterLogic = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🔍 DEBUGGING QUARTER LOGIC...\n');
    
    // Check what the system thinks current quarter is
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentQuarter = Math.ceil(currentMonth / 3);
    const currentYear = now.getFullYear();
    
    console.log(`📅 Today's Date: ${now.toDateString()}`);
    console.log(`📅 Current Month: ${currentMonth}`);
    console.log(`📅 Calculated Quarter: Q${currentQuarter}`);
    console.log(`📅 Current Year: ${currentYear}\n`);
    
    // Find all HODs
    const hods = await User.find({ role: 'hod' }).populate('department');
    console.log(`👥 Total HODs found: ${hods.length}`);
    
    for (const hod of hods) {
      console.log(`\n🔍 Checking HOD: ${hod.name} (${hod.email})`);
      console.log(`   Department: ${hod.department?.name || 'No department'}`);
      
      // Check if HOD has forecast for current quarter
      const existingForecast = await Forecast.findOne({
        submittedBy: hod._id,  // Note: using submittedBy
        'period.year': currentYear,
        'period.quarter': currentQuarter
      });
      
      console.log(`   Has Q${currentQuarter} ${currentYear} forecast: ${existingForecast ? 'YES' : 'NO'}`);
      console.log(`   Should get reminder: ${existingForecast ? 'NO' : 'YES'}`);
    }
    
    // Also check with different field names in case model structure is different
    console.log('\n🔍 Checking alternative forecast query...');
    const alternativeForecasts = await Forecast.find({
      year: currentYear,
      quarter: currentQuarter
    });
    console.log(`Alternative query found ${alternativeForecasts.length} forecasts for Q${currentQuarter} ${currentYear}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
};

debugQuarterLogic();
