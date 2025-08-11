// Create check-user.js in your backend directory
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'jaiaditya.mathur@gmail.com';
    
    // Check for ANY user with this email (including inactive)
    const anyUser = await User.findOne({ email });
    console.log(`Any user with ${email}:`, anyUser ? 'EXISTS' : 'NOT FOUND');
    
    if (anyUser) {
      console.log('User details:', {
        id: anyUser._id,
        name: anyUser.name,
        email: anyUser.email,
        role: anyUser.role,
        isActive: anyUser.isActive
      });
    }
    
    // Check active users only
    const activeUser = await User.findOne({ email, isActive: true });
    console.log(`Active user with ${email}:`, activeUser ? 'EXISTS' : 'NOT FOUND');
    
  } catch (error) {
    console.error('Check error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkUser();
