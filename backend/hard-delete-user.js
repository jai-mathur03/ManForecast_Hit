const mongoose = require('mongoose');
const User = require('./models/User');
const Forecast = require('./models/Forecast');
require('dotenv').config();

const hardDeleteUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node hard-delete-user.js user@example.com');
      return;
    }
    
    console.log(`🔍 Searching for user: ${email}`);
    
    // Find user by email first
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }
    
    console.log(`📋 Found user: ${user.name} (ID: ${user._id})`);
    console.log(`🗑️ Hard deleting user: ${email}`);
    
    // Delete all forecasts by this user first
    const deletedForecasts = await Forecast.deleteMany({ submittedBy: user._id });
    console.log(`📋 Deleted ${deletedForecasts.deletedCount} forecasts`);
    
    // Hard delete the user
    const deletedUser = await User.findByIdAndDelete(user._id);
    
    if (deletedUser) {
      console.log(`✅ Successfully deleted user: ${deletedUser.name} (${deletedUser.email})`);
    } else {
      console.log(`❌ Error deleting user`);
    }
    
    // Verify deletion
    const checkUser = await User.findOne({ email });
    console.log(`🔍 Verification - User exists: ${checkUser ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Hard delete error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Get email from command line argument
const emailToDelete = process.argv[2];
hardDeleteUser(emailToDelete);
