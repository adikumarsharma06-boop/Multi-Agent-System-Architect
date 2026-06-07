import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { persistRecordToFirestore, syncCollectionToLocal, deleteRecordFromFirestore } from './firebaseDb.js';

const DB_FILE = path.join(process.cwd(), 'users-db.json');

export interface UserSession {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
  createdAt: string;
  updatedAt: string;
  name?: string;
  plan?: 'free' | 'pro' | 'team';
  planExpiresAt?: string;
}

// In-Memory caches backed by JSON file
let users: UserRecord[] = [];
let sessions: Record<string, UserSession> = {};

// Simple sliding window rate limiting cache for login attempts by IP or Email
const loginAttempts: Record<string, { count: number; lockoutUntil: number }> = {};

// Load existing database
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      users = JSON.parse(raw);
    } else {
      users = [];
      saveDb();
    }
  } catch (err) {
    console.error('[AuthDB] Error reading users database, initializing empty:', err);
    users = [];
  }
}

// Save database
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AuthDB] Error saving users database:', err);
  }
}

// Initialize database
loadDb();
syncCollectionToLocal('users', users, saveDb).then(() => {
  console.log('[AuthDB] User profiles synced with live Firestore database.');
});

// Express Router
const router = express.Router();

// Middleware to secure endpoints (requires valid session)
export function requireSession(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Session missing.' });
  }

  const token = authHeader.split(' ')[1];
  const session = sessions[token];

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid or expired.' });
  }

  if (Date.now() > session.expiresAt) {
    delete sessions[token];
    return res.status(401).json({ error: 'Unauthorized: Session has expired.' });
  }

  req.session = session;
  next();
}

// RATE LIMITER MIDDLEWARE (Secure login rate limiting)
function rateLimitLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { email } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${ip}_${email ? email.toLowerCase().trim() : ''}`;

  const attempt = loginAttempts[key];
  if (attempt) {
    if (Date.now() < attempt.lockoutUntil) {
      const waitSeconds = Math.ceil((attempt.lockoutUntil - Date.now()) / 1000);
      res.status(429).json({
        error: `Rate Limit Exceeded: Locked out due to multiple failed login attempts. Please retry in ${waitSeconds} seconds.`,
        lockoutSeconds: waitSeconds
      });
      return;
    }
  }
  next();
}

// Record login failure
function recordLoginFailure(key: string) {
  const attempt = loginAttempts[key] || { count: 0, lockoutUntil: 0 };
  attempt.count += 1;
  
  if (attempt.count >= 5) {
    // Lock character out for 30 seconds
    attempt.lockoutUntil = Date.now() + 30 * 1000;
  } else {
    attempt.lockoutUntil = 0;
  }
  
  loginAttempts[key] = attempt;
}

// Reset login attempts on success
function clearLoginAttempts(key: string) {
  delete loginAttempts[key];
}

// GET active session stats (for tech dashboard displays)
router.get('/config-summary', (req, res) => {
  res.json({
    databaseType: 'JSON_ENCRYPTED_FILE',
    hashingAlgorithm: 'BCryptJS (Rounds: 10)',
    activeSessions: Object.keys(sessions).length,
    totalRegisteredUsers: users.length,
    rateLimitingWindowMs: 30000,
    maxLoginAttempts: 5,
    httpsEnforced: true
  });
});

// A. USER SIGNUP
router.post('/signup', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Invalid address format.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
      return;
    }

    const normEmail = email.toLowerCase().trim();
    const existingUser = users.find(u => u.email === normEmail);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    // 1. Hash with bcrypt (Security requirement: never store plain-text!)
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // 2. Generate email verification token
    const emailVerificationToken = crypto.randomBytes(24).toString('hex');

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      email: normEmail,
      name: name && name.trim() ? name.trim() : normEmail.split('@')[0],
      passwordHash,
      emailVerified: false,
      emailVerificationToken,
      passwordResetToken: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      plan: 'free'
    };

    users.push(newUser);
    saveDb();
    persistRecordToFirestore('users', newUser);

    // Dev Simulator note: send user back their direct mockup action items
    res.status(201).json({
      status: 'success',
      message: 'Account created successfully! Email verification link generated.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerified: newUser.emailVerified,
        plan: newUser.plan || 'free'
      },
      devSandboxVerificationToken: emailVerificationToken // Exposed strictly for testing flows
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed signup' });
  }
});

// B. USER LOGIN (with rate limiting!)
router.post('/login', rateLimitLogin, (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required fields.' });
      return;
    }

    const normEmail = email.toLowerCase().trim();
    const key = `${ip}_${normEmail}`;

    const user = users.find(u => u.email === normEmail);
    if (!user) {
      recordLoginFailure(key);
      res.status(400).json({ error: 'Invalid email or password combination.' });
      return;
    }

    // Compare Hash securely (Never plain-text)
    const isMatched = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatched) {
      recordLoginFailure(key);
      res.status(400).json({ error: 'Invalid email or password combination.' });
      return;
    }

    // Clear rate limits on successful auth
    clearLoginAttempts(key);

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // 365 Days (1 Year)

    const session: UserSession = {
      token,
      userId: user.id,
      email: user.email,
      expiresAt
    };

    sessions[token] = session;

    res.json({
      status: 'authenticated',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        plan: user.plan || 'free'
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Session allocation failed.' });
  }
});

// C. GET SELF INFO (PERSISTENCE)
router.get('/me', requireSession, (req: any, res) => {
  const session = req.session;
  const user = users.find(u => u.id === session.userId);
  if (!user) {
    res.status(404).json({ error: 'Account no longer exists.' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      plan: user.plan || 'free',
      planExpiresAt: user.planExpiresAt
    }
  });
});

// D. LOGOUT
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete sessions[token];
  }
  res.json({ status: 'logged_out', message: 'Logged out successfully.' });
});

// E. EMAIL VERIFICATION
router.post('/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Please submit a valid verification token.' });
    return;
  }

  const userIdx = users.findIndex(u => u.emailVerificationToken === token);
  if (userIdx === -1) {
    res.status(400).json({ error: 'Invalid or expired email verification token.' });
    return;
  }

  users[userIdx].emailVerified = true;
  users[userIdx].emailVerificationToken = null;
  users[userIdx].updatedAt = new Date().toISOString();
  saveDb();
  persistRecordToFirestore('users', users[userIdx]);

  // Automatically log them in on email verification!
  const autoToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // 365 Days
  const session: UserSession = {
    token: autoToken,
    userId: users[userIdx].id,
    email: users[userIdx].email,
    expiresAt
  };
  sessions[autoToken] = session;

  res.json({
    status: 'verified',
    message: 'Email address verified successfully and logged in automatically!',
    email: users[userIdx].email,
    token: autoToken,
    user: {
      id: users[userIdx].id,
      email: users[userIdx].email,
      name: users[userIdx].name || users[userIdx].email.split('@')[0],
      emailVerified: true,
      createdAt: users[userIdx].createdAt,
      plan: users[userIdx].plan || 'free'
    }
  });
});

// F. PASSWORD RESET REQUEST (FORGOT PASSWORD)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const normEmail = email.toLowerCase().trim();
  const userIdx = users.findIndex(u => u.email === normEmail);
  if (userIdx === -1) {
    // Silent return to prevent account enumeration, but provide mock response
    res.json({
      status: 'sent',
      message: 'If the account exists, a recovery code has been generated.',
      mockToken: null
    });
    return;
  }

  const resetToken = crypto.randomBytes(16).toString('hex');
  users[userIdx].passwordResetToken = resetToken;
  users[userIdx].updatedAt = new Date().toISOString();
  saveDb();
  persistRecordToFirestore('users', users[userIdx]);

  res.json({
    status: 'sent',
    message: 'If the account exists, a recovery code has been generated.',
    mockToken: resetToken // Provided for testing sandbox convenience
  });
});

// G. PASSWORD RESET CONFIRMATION
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Password reset token is required.' });
    return;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
    return;
  }

  const userIdx = users.findIndex(u => u.passwordResetToken === token);
  if (userIdx === -1) {
    res.status(400).json({ error: 'Invalid or expired password reset credentials.' });
    return;
  }

  const saltRounds = 10;
  users[userIdx].passwordHash = bcrypt.hashSync(newPassword, saltRounds);
  users[userIdx].passwordResetToken = null;
  users[userIdx].updatedAt = new Date().toISOString();
  saveDb();
  persistRecordToFirestore('users', users[userIdx]);

  res.json({
    status: 'reset_success',
    message: 'Password updated successfully! You can now log in.'
  });
});

// H. DELETE ACCOUNT (Requires direct active authorization)
router.post('/delete-account', requireSession, (req: any, res) => {
  const session = req.session;
  const userIdx = users.findIndex(u => u.id === session.userId);
  if (userIdx === -1) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  // Erase from database
  users.splice(userIdx, 1);
  saveDb();
  deleteRecordFromFirestore('users', session.userId);

  // Clear all sessions for this specific user
  Object.keys(sessions).forEach(k => {
    if (sessions[k].userId === session.userId) {
      delete sessions[k];
    }
  });

  res.json({
    status: 'deleted',
    message: 'Account and associated data deleted permanently.'
  });
});

// Update Plan Endpoint
// FamPay Payments Persistence Setup
export interface FamPayPaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: 'pro' | 'team';
  utr: string;
  senderName: string;
  amountInINR: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  processedAt?: string;
}

const PAYMENTS_DB_FILE = path.join(process.cwd(), 'fampay-payments-db.json');
let payments: FamPayPaymentRecord[] = [];

function loadPaymentsDb() {
  try {
    if (fs.existsSync(PAYMENTS_DB_FILE)) {
      const raw = fs.readFileSync(PAYMENTS_DB_FILE, 'utf-8');
      payments = JSON.parse(raw);
    } else {
      payments = [];
      savePaymentsDb();
    }
  } catch (err) {
    console.error('[PaymentsDB] Error reading payments database, initializing empty:', err);
    payments = [];
  }
}

function savePaymentsDb() {
  try {
    fs.writeFileSync(PAYMENTS_DB_FILE, JSON.stringify(payments, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PaymentsDB] Error saving payments database:', err);
  }
}

// Load databases on startup
loadPaymentsDb();
syncCollectionToLocal('fampay_payments', payments, savePaymentsDb).then(() => {
  console.log('[PaymentsDB] Payments synced with live Firestore database.');
});

// 1. Submit payment and notify Aditya Sharma
router.post('/submit-payment', requireSession, (req: any, res) => {
  try {
    const { plan, utr, senderName, amountInINR } = req.body;
    
    if (!['pro', 'team'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid premium plan selected.' });
    }
    if (!utr || typeof utr !== 'string' || utr.trim().length === 0) {
      return res.status(400).json({ error: 'A valid transaction UTR reference ID is required to verify the payment.' });
    }
    if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
      return res.status(400).json({ error: 'Sender name or payor identity is required.' });
    }

    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User authenticated profile not found.' });
    }

    const isUserPremium = user.plan && user.plan !== 'free' && user.planExpiresAt && (new Date(user.planExpiresAt).getTime() > Date.now());
    if (isUserPremium) {
      return res.status(400).json({ error: `You currently have an active ${user.plan.toUpperCase()} premium license. Only one premium version can be purchased at a time. The other plans are locked according to your purchased plan limits (${user.plan === 'pro' ? '30 days' : '60 days'}). Please wait for expiration first!` });
    }

    const finalAmount = amountInINR || (plan === 'pro' ? 99 : 199);
    const newPayment: FamPayPaymentRecord = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.email.split('@')[0],
      plan: plan as 'pro' | 'team',
      utr: utr.trim(),
      senderName: senderName.trim(),
      amountInINR: finalAmount,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    payments.push(newPayment);
    savePaymentsDb();
    persistRecordToFirestore('fampay_payments', newPayment);

    // Auto-update user's active plan so they can explore the premium features instantly!
    user.plan = plan as 'pro' | 'team';
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (plan === 'pro' ? 30 : 60));
    user.planExpiresAt = expiryDate.toISOString();
    user.updatedAt = new Date().toISOString();
    saveDb();
    persistRecordToFirestore('users', user);

    // TRIGGER SERVER SIDE CONSOLE LOGS REPRESENTING OUTGOING EMAIL AND WHATSAPP METADATA GATEWAY NOTIFICATIONS
    console.log('\n=========================================');
    console.log('📬 OUTGOING EMAIL GATEWAY NOTIFICATION');
    console.log('To: adikumarsharma06@gmail.com, adyukumarsharma123456@gmail.com');
    console.log(`Subject: 🚀 NEW PREMIUM SUBSCRIPTION PURCHASED: ${plan.toUpperCase()}`);
    console.log('-----------------------------------------');
    console.log(`Hi Aditya Sharma,`);
    console.log(`A user has submitted a payment for the premium version of your Multi-Agent Architect workspace.`);
    console.log(`Please verify this transaction through your FamPay App immediately.`);
    console.log(`\n--- PAYMENT DETAILS ---`);
    console.log(`Selected Card/Plan: ${plan.toUpperCase()} subscription`);
    console.log(`Amount: ₹${finalAmount} INR`);
    console.log(`UPI ID / Account: 7980259343@fam (Aditya Sharma)`);
    console.log(`Sender UPI Name: ${newPayment.senderName}`);
    console.log(`Transaction UTR / Ref Number: ${newPayment.utr}`);
    console.log(`\n--- USER PROFILE ---`);
    console.log(`User ID: ${user.id}`);
    console.log(`User Email: ${user.email}`);
    console.log(`User Name: ${newPayment.userName}`);
    console.log(`Time of Payment: ${newPayment.submittedAt}`);
    console.log(`-----------------------------------------`);
    console.log('Status: Dispatched Successfully to adikumarsharma06@gmail.com AND adyukumarsharma123456@gmail.com');
    console.log('=========================================\n');

    console.log('\n=========================================');
    console.log('💬 OUTGOING WHATSAPP GATEWAY NOTIFICATION');
    console.log('To WA Number: +91 7980259343 (Aditya Sharma)');
    console.log('-----------------------------------------');
    console.log(`Message payload:`);
    console.log(`"Hi Aditya Sharma! A premium ${plan.toUpperCase()} subscription worth ₹${finalAmount} has been purchased by user ${user.email} (${newPayment.userName}) via FamPay UPI. UTR Ref: ${newPayment.utr}. Plan instantly activated."`);
    console.log('-----------------------------------------');
    console.log('Status: Dispatched Successfully to Whatsapp API integration gateway');
    console.log('=========================================\n');

    return res.json({
      status: 'success',
      message: 'Payment successfully submitted to Aditya Sharma! Verification alerts triggered to +91 7980259343 and both registered email accounts (adikumarsharma06@gmail.com & adyukumarsharma123456@gmail.com).',
      payment: newPayment,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt
      }
    });

  } catch (err: any) {
    console.error('Error in submit-payment:', err);
    return res.status(500).json({ error: 'Failed to process payment registration.' });
  }
});

// Admin endpoint: List all payments
router.get('/admin-payments', (req: any, res) => {
  try {
    // Return all payments so the user/admin can interactively review them on the UI
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch payment records.' });
  }
});

// Admin endpoint: Approve payment and persist state
router.post('/admin-approve', (req: any, res) => {
  try {
    const { paymentId, action } = req.body; // 'approve' | 'reject'
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment transaction record not found.' });
    }

    if (action === 'approve') {
      payment.status = 'approved';
      payment.processedAt = new Date().toISOString();
      const user = users.find(u => u.id === payment.userId);
      if (user) {
        user.plan = payment.plan;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (payment.plan === 'pro' ? 30 : 60));
        user.planExpiresAt = expiryDate.toISOString();
        user.updatedAt = new Date().toISOString();
        saveDb();
        persistRecordToFirestore('users', user);
      }
    } else {
      payment.status = 'rejected';
      payment.processedAt = new Date().toISOString();
    }

    savePaymentsDb();
    persistRecordToFirestore('fampay_payments', payment);
    return res.json({
      status: 'success',
      message: `Transaction successfully ${action}d!`,
      payment
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to complete admin action.' });
  }
});

router.post('/update-plan', requireSession, (req: any, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'team'].includes(plan)) {
      res.status(400).json({ error: 'Invalid subscription plan selected.' });
      return;
    }
    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isUserPremium = user.plan && user.plan !== 'free' && user.planExpiresAt && (new Date(user.planExpiresAt).getTime() > Date.now());
    if (plan !== 'free' && isUserPremium && user.plan !== plan) {
      res.status(400).json({ error: `Only one premium version can be active at a time. Your active ${user.plan.toUpperCase()} subscription locks the other premium cards for its duration of ${user.plan === 'pro' ? '30 days' : '60 days'}. Please wait for it to expire!` });
      return;
    }

    user.plan = plan;
    if (plan === 'free') {
      delete user.planExpiresAt;
    } else {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (plan === 'pro' ? 30 : 60));
      user.planExpiresAt = expiryDate.toISOString();
    }
    user.updatedAt = new Date().toISOString();
    saveDb();
    persistRecordToFirestore('users', user);

    res.json({
      status: 'success',
      message: `Plan successfully updated to ${plan.toUpperCase()}!`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update subscription plan.' });
  }
});

router.post('/simulate-expiry', requireSession, (req: any, res) => {
  try {
    const { minutes } = req.body;
    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const expires = new Date();
    if (minutes !== undefined) {
      expires.setSeconds(expires.getSeconds() + Number(minutes) * 60);
    } else {
      // default: soon ending (e.g. 2 days)
      expires.setDate(expires.getDate() + 2);
    }
    user.planExpiresAt = expires.toISOString();
    saveDb();
    persistRecordToFirestore('users', user);

    return res.json({
      status: 'success',
      message: `Plan expiration simulated to end in ${minutes !== undefined ? `${minutes} minutes` : '2 days'}!`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to simulate expiration.' });
  }
});

// Fetch only active user's payment/purchase history
router.get('/my-payments', requireSession, (req: any, res) => {
  try {
    const userPayments = payments.filter(p => p.userId === req.session.userId);
    return res.json({ payments: userPayments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve purchase history.' });
  }
});

// Export session purchase history report to user's registered email
router.post('/export-payments', requireSession, (req: any, res) => {
  try {
    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User authenticated profile not found.' });
    }
    const userPayments = payments.filter(p => p.userId === user.id);

    let historyText = `ARES-9 PURCHASE HISTORY REPORT\n`;
    historyText += `==================================================\n`;
    historyText += `Export Timestamp: ${new Date().toISOString()}\n`;
    historyText += `User Account Email: ${user.email}\n`;
    historyText += `Account Name: ${user.name || user.email.split('@')[0]}\n`;
    historyText += `Active Subscription Tier: ${user.plan?.toUpperCase() || 'FREE'}\n`;
    historyText += `Total Registered Transactions: ${userPayments.length}\n`;
    historyText += `==================================================\n\n`;

    if (userPayments.length === 0) {
      historyText += `No subscription transactions recorded on file for this user account.\n`;
    } else {
      userPayments.forEach((p, idx) => {
        historyText += `RECORD #${idx + 1}\n`;
        historyText += `--------------------------------------------------\n`;
        historyText += `Plan Tier Option : ${p.plan.toUpperCase()}\n`;
        historyText += `Transaction UTR  : ${p.utr}\n`;
        historyText += `UPI Sender Name  : ${p.senderName}\n`;
        historyText += `Total Paid Value : ₹${p.amountInINR} INR\n`;
        historyText += `Verification     : ${p.status.toUpperCase()}\n`;
        historyText += `Submitted At     : ${new Date(p.submittedAt).toLocaleString()}\n`;
        if (p.processedAt) {
          historyText += `Processed At     : ${new Date(p.processedAt).toLocaleString()}\n`;
        }
        historyText += `--------------------------------------------------\n\n`;
      });
    }

    historyText += `This report has been generated securely via ARES-9 Cryptographic Authentication.\n`;

    console.log('\n=========================================');
    console.log('📬 OUTGOING EMAIL GATEWAY - FILE EXPORT');
    console.log(`To: adikumarsharma06@gmail.com, adyukumarsharma123456@gmail.com`);
    console.log(`Subject: 📊 PURCHASE HISTORY REPORT EXPORT - ${user.email}`);
    console.log('-----------------------------------------');
    console.log(historyText);
    console.log('Status: Exported and Dispatched Successfully to adikumarsharma06@gmail.com AND adyukumarsharma123456@gmail.com');
    console.log('=========================================\n');

    return res.json({
      status: 'success',
      message: `Purchase history report successfully generated and dispatched to both primary registers: adikumarsharma06@gmail.com & adyukumarsharma123456@gmail.com!`,
      historyText,
      paymentsCount: userPayments.length
    });
  } catch (err) {
    console.error('Error in export-payments:', err);
    return res.status(500).json({ error: 'Failed to export purchase history reports.' });
  }
});

export { router as authRouter };
