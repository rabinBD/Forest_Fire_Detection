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
const sendEmail = async (imageUrl) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_HOST,
      to: process.env.EMAIL_RECEIVER,
      subject: 'ALERT! Fire has been detected',
      html: `
        <h2>Fire Detected!</h2>
        <p>There has been a fire alert in location1. Act quickly as far as possible.
        Thankyou!</p>
        <img src="${imageUrl}" alt="Fire Image" style="max-width:100%; border-radius:6px;" />
        <p><a href="${imageUrl}">View full image</a></p>
        <hr/>
        <small>Sent automatically by Forest Fire Detection System</small>
      `
    })
    console.log('Email sent: ' + info.response);
  } catch (err) {
    console.log("Error sending email: ", err.message);
  }
}

module.exports = sendEmail;