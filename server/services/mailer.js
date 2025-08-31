const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send email with image URL
const sendEmail = async (imageUrl, temperature, humidity, gas) => {
  const to = process.env.EMAIL_RECEIVER;
  if (!to) {
    console.error('EMAIL_RECEIVER not defined in .env');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_HOST,
      to,
      subject: '🔥 ALERT! Fire has been detected 🔥',
      html: `
        <h2>Fire Detected!</h2>
        <p><strong>Location:</strong> Location 1</p>
        <p><strong>Temperature:</strong> ${temperature}°C</p>
        <p><strong>Humidity:</strong> ${humidity}°C</p>
        <p><strong>Smoke Level:</strong> ${gas}</p>
        <p><a href="${imageUrl}">View Full Image</a></p>
        <hr/>
        <small>Sent automatically by Forest Fire Detection System</small>
      `
    });

    console.log('Email sent:', info.response);
  } catch (err) {
    console.error('Error sending email:', err.message);
  }
};



module.exports = sendEmail;

