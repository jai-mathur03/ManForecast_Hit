const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

// Template for forecast submission reminders
const sendForecastReminderEmail = async (userEmail, userName, departmentName, quarterYear) => {
  const subject = `🔔 Manpower Forecast Submission Reminder - ${quarterYear}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">📊 Forecast Reminder</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f8f9fa;">
        <h2 style="color: #333;">Hello ${userName},</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          This is a friendly reminder that your <strong>${departmentName}</strong> department's manpower forecast 
          for <strong>${quarterYear}</strong> is pending submission.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3 style="color: #667eea; margin: 0 0 10px 0;">⏰ Action Required</h3>
          <p style="margin: 0; color: #666;">Please log in to the Manpower Forecast System to complete and submit your forecast.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/forecasts" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access System
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; margin-top: 30px;">
          If you have any questions, please contact the system administrator.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">Manpower Forecast System - Automated Reminder</p>
      </div>
    </div>
  `;
  
  const text = `
    Hello ${userName},
    
    This is a friendly reminder that your ${departmentName} department's manpower forecast for ${quarterYear} is pending submission.
    
    Please log in to the Manpower Forecast System to complete and submit your forecast.
    
    System URL: ${process.env.FRONTEND_URL}/forecasts
    
    If you have any questions, please contact the system administrator.
    
    Manpower Forecast System - Automated Reminder
  `;
  
  return await sendEmail(userEmail, subject, html, text);
};

// Template for deadline warnings
const sendDeadlineWarningEmail = async (userEmail, userName, departmentName, quarterYear, daysLeft) => {
  const subject = `⚠️ URGENT: Forecast Deadline Approaching - ${daysLeft} Day(s) Left`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">⚠️ DEADLINE WARNING</h1>
      </div>
      
      <div style="padding: 30px; background-color: #fff5f5;">
        <h2 style="color: #333;">Urgent: ${userName}</h2>
        
        <div style="background: #ff6b6b; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; font-size: 24px;">⏰ ${daysLeft} Day(s) Left</h3>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Your <strong>${departmentName}</strong> department's manpower forecast for <strong>${quarterYear}</strong> 
          is due in <strong>${daysLeft} day(s)</strong>.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #ff6b6b; margin: 20px 0;">
          <h3 style="color: #ff6b6b; margin: 0 0 10px 0;">🚨 Immediate Action Required</h3>
          <p style="margin: 0; color: #666;">Please submit your forecast immediately to avoid delays in the planning process.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/forecasts" 
             style="background: #ff6b6b; color: white; padding: 15px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            SUBMIT NOW
          </a>
        </div>
      </div>
    </div>
  `;
  
  const text = `
    URGENT: ${userName}
    
    Your ${departmentName} department's manpower forecast for ${quarterYear} is due in ${daysLeft} day(s).
    
    Please submit your forecast immediately to avoid delays in the planning process.
    
    System URL: ${process.env.FRONTEND_URL}/forecasts
    
    Manpower Forecast System - Deadline Warning
  `;
  
  return await sendEmail(userEmail, subject, html, text);
};

// Template for approval notifications
const sendApprovalNotificationEmail = async (userEmail, userName, departmentName, quarterYear, status, comments) => {
  const isApproved = status === 'approved';
  const subject = `${isApproved ? '✅' : '❌'} Forecast ${isApproved ? 'Approved' : 'Rejected'} - ${quarterYear}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${isApproved ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)' : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">${isApproved ? '✅ Forecast Approved' : '❌ Forecast Rejected'}</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f8f9fa;">
        <h2 style="color: #333;">Hello ${userName},</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Your <strong>${departmentName}</strong> department's manpower forecast for <strong>${quarterYear}</strong> 
          has been <strong style="color: ${isApproved ? '#51cf66' : '#ff6b6b'}">${status.toUpperCase()}</strong>.
        </p>
        
        ${comments ? `
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${isApproved ? '#51cf66' : '#ff6b6b'}; margin: 20px 0;">
          <h3 style="color: ${isApproved ? '#51cf66' : '#ff6b6b'}; margin: 0 0 10px 0;">💬 Reviewer Comments</h3>
          <p style="margin: 0; color: #666; font-style: italic;">${comments}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/forecasts" 
             style="background: ${isApproved ? '#51cf66' : '#ff6b6b'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Details
          </a>
        </div>
      </div>
    </div>
  `;
  
  const text = `
    Hello ${userName},
    
    Your ${departmentName} department's manpower forecast for ${quarterYear} has been ${status.toUpperCase()}.
    
    ${comments ? `Reviewer Comments: ${comments}` : ''}
    
    System URL: ${process.env.FRONTEND_URL}/forecasts
    
    Manpower Forecast System
  `;
  
  return await sendEmail(userEmail, subject, html, text);
};

module.exports = {
  sendEmail,
  sendForecastReminderEmail,
  sendDeadlineWarningEmail,
  sendApprovalNotificationEmail
};
