// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // you can change to outlook, yahoo, or SMTP
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password (not normal password)
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"CapitalTradePoint" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending error:", error.message);
  }
}

module.exports = sendEmail;
