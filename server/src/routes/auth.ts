import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { EmailService } from '../services/EmailService';
import { SMSService } from '../services/SMSService';

const router = express.Router();
const prisma = new PrismaClient();

// REGISTER
router.post('/register', async (req, res) => {
  const { phone, name, password, role, village, district, email } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // HW and ADMIN need super-administrator approval before they can sign in
    const approved = role !== 'HW' && role !== 'ADMIN';

    // Generate the OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await prisma.user.create({
      data: {
        phone,
        name,
        email,
        password: hashedPassword,
        role: role || 'HW',
        village,
        district,
        approved,
        otpCode: otp,
        otpExpires,
      }
    });

    // Trigger real or simulated delivery
    if (email) {
      await EmailService.sendOTP(email, otp, name);
    }
    if (phone) {
      await SMSService.sendSMS(phone, `Your HealthGuard Uganda verification code is: ${otp}`);
    }

    // If registering as ADMIN, alert the super-admin owner by email
    if (role === 'ADMIN') {
      EmailService.sendAdminRegistrationAlert({ name, phone, email, district }).catch((err) =>
        console.error('[auth] Failed to send admin registration alert:', err)
      );
    }

    // Do NOT return the otp code back to the client!
    res.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Phone number already registered' });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'phone and code are required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.otpCode || user.otpCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // OTP is valid! Clear it
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpires: null,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// SEND OTP EMAIL (client calls this to deliver OTP to real inbox)
router.post('/send-otp-email', async (req, res) => {
  const { email, code, name } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'email and code are required' });
  }
  try {
    const sent = await EmailService.sendOTP(email, code, name || 'User');
    if (sent) {
      res.json({ success: true, message: `OTP sent to ${email}` });
    } else {
      res.status(500).json({ error: 'Failed to send email. Check SMTP configuration.' });
    }
  } catch (error: any) {
    console.error('Send OTP email error:', error);
    res.status(500).json({ error: error.message || 'Email delivery failed' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    // Block HW and ADMIN if not yet approved by the super-administrator
    if ((user.role === 'HW' || user.role === 'ADMIN') && !user.approved) {
      return res.status(403).json({ error: 'Your account is pending super-administrator approval. You will be notified once it is activated.' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'healthguard_secret_key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village,
        district: user.district,
        approved: user.approved
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL USERS (Admin only)
router.get('/users', authenticateToken, async (req: any, res) => {
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        village: true,
        district: true,
        approved: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// APPROVE USER (Admin only)
router.put('/users/:phone/approve', authenticateToken, async (req: any, res) => {
  const { phone } = req.params;
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    const updatedUser = await prisma.user.update({
      where: { phone },
      data: { approved: true },
    });

    res.json({ success: true, user: { phone: updatedUser.phone, approved: updatedUser.approved } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { method, value } = req.body;
  try {
    const user = method === 'email'
      ? await prisma.user.findFirst({ where: { email: value } })
      : await prisma.user.findUnique({ where: { phone: value } });

    if (!user) {
      return res.status(404).json({ error: 'User with this detail not found' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: code,
        resetTokenExpires: expires,
      }
    });

    // Trigger real or simulated delivery
    if (method === 'email' && user.email) {
      await EmailService.sendPasswordReset(user.email, code, user.name);
    } else if (method === 'phone' && user.phone) {
      await SMSService.sendSMS(user.phone, `Your HealthGuard password reset code is: ${code}. It expires in 15 minutes.`);
    }

    res.json({ success: true, code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { method, value, code, newPassword } = req.body;
  try {
    const user = method === 'email'
      ? await prisma.user.findFirst({ where: { email: value } })
      : await prisma.user.findUnique({ where: { phone: value } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.resetToken || user.resetToken !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
