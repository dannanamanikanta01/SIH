const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const demoUsers = [
  { id: 'demo-admin', name: 'System Administrator', email: 'admin@sih.local', password: 'admin123', role: 'admin' },
  { id: 'demo-inspector', name: 'Compliance Inspector', email: 'inspector@sih.local', password: 'inspector123', role: 'inspector' },
  { id: 'demo-user', name: 'Product User', email: 'user@sih.local', password: 'user123', role: 'user' }
];

async function ensureDefaultUsers() {
  for (const demoUser of demoUsers) {
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    await User.updateOne(
      { email: demoUser.email },
      { $setOnInsert: { name: demoUser.name, email: demoUser.email, passwordHash, role: demoUser.role, isActive: true } },
      { upsert: true }
    );
  }
}

function publicUser(user) {
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false
  };
}

function issueToken(user) {
  return jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: '8h' });
}

async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  let user = null;
  if (mongoose.connection.readyState === 1) {
    user = await User.findOne({ email, isActive: true });
    if (user && !(await bcrypt.compare(password, user.passwordHash))) user = null;
  } else {
    user = demoUsers.find(item => item.email === email && item.password === password) || null;
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  return res.json({ success: true, token: issueToken(user), user: publicUser(user) });
}

async function listUsers(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, users: demoUsers.map(publicUser) });
  }
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  return res.json({ success: true, users: users.map(publicUser) });
}

async function getStats(req, res) {
  const Verification = require('../models/Verification');
  const query = mongoose.connection.readyState === 1 ? await Verification.find().lean() : [];
  return res.json({
    success: true,
    stats: {
      totalVerifications: query.length,
      compliant: query.filter(item => item.status === 'COMPLIANT').length,
      nonCompliant: query.filter(item => item.status === 'NON_COMPLIANT').length
    }
  });
}

async function createUser(req, res) {
  const { name, email, password, role = 'user' } = req.body;
  if (!name || !email || !password || !['admin', 'inspector', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and a valid role are required.' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'User management requires MongoDB.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }
  const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role });
  return res.status(201).json({ success: true, user: publicUser(user) });
}

async function updateUser(req, res) {
  const { name, email, role, isActive, password } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user id.' });
  }
  if (req.params.id === req.user.id && isActive === false) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
  }
  const update = {};
  if (name) update.name = String(name).trim();
  if (email) update.email = String(email).trim().toLowerCase();
  if (role && ['admin', 'inspector', 'user'].includes(role)) update.role = role;
  if (typeof isActive === 'boolean') update.isActive = isActive;
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash').lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, user: publicUser(user) });
}

module.exports = { login, listUsers, getStats, createUser, updateUser, ensureDefaultUsers };