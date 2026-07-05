const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options = {}) => {
  const { to, subject, html, attachments = [] } = options;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL,
    to,
    subject,
    html,
    attachments,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
