require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Banking Transaction System" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Banking Transaction System!';
    const text = `Hi ${name},\n\nThank you for registering with our Banking Transaction System. We're excited to have you on board!\n\nBest regards,\nBanking Transaction System Team`;
    const html = `<p>Hi ${name},</p><p>Thank you for registering with our <b>Banking Transaction System</b>. We're excited to have you on board!</p><p>Best regards,<br/>Banking Transaction System Team</p>`;
    
    await sendEmail(userEmail, subject, text, html); 
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = `Transaction Alert: $${amount} transferred to account ${toAccount}`;
  const text = `Hi ${name},\n\nYou have successfully transferred $${amount} to account ${toAccount}. If you did not authorize this transaction, please contact our support team immediately.\n\nBest regards,\nBanking Transaction System Team`;
  const html = `<p>Hi ${name},</p><p>You have successfully transferred <b>$${amount}</b> to account <b>${toAccount}</b>. If you did not authorize this transaction, please contact our support team immediately.</p><p>Best regards,<br/>Banking Transaction System Team</p>`;
  
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = `Transaction Failed: $${amount} transfer to account ${toAccount}`;
  const text = `Hi ${name},\n\nWe regret to inform you that your attempt to transfer $${amount} to account ${toAccount} has failed. Please check your account balance and try again. If you continue to experience issues, please contact our support team.\n\nBest regards,\nBanking Transaction System Team`;
  const html = `<p>Hi ${name},</p><p>We regret to inform you that your attempt to transfer <b>$${amount}</b> to account <b>${toAccount}</b> has failed. Please check your account balance and try again. If you continue to experience issues, please contact our support team.</p><p>Best regards,<br/>Banking Transaction System Team</p>`;
  
  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};