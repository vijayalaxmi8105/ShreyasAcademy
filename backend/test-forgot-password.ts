import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import User from './models/User';
import express from 'express';

const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
app.use(express.json());

// 1. Forgot Password Endpoint
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  // Create token (you can use crypto)
  const resetToken = randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await resend.emails.send({
      from: 'Shreyas Academy <onboarding@resend.dev>',
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset it.</p>`
    });
    res.json({ message: "Email sent successfully", resetLink: resetUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 2. Simple Email Test Endpoint
app.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    const data = await resend.emails.send({
      from: 'Shreyas Academy <onboarding@resend.dev>',
      to: email,
      subject: 'Test Email',
      text: 'Resend is working correctly!'
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});