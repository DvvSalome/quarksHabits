const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();
const users = prisma.user || prisma.User;

function signToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { subject: user.id, expiresIn: '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'name, email and password are required', status: 400 });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters', status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!users) throw new Error('Prisma user model not available. Run: npm install && npx prisma generate');
    const exists = await users.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ error: 'email already in use', status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.create({
      data: { email: normalizedEmail, passwordHash, name: String(name).trim() },
    });
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required', status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!users) throw new Error('Prisma user model not available. Run: npm install && npx prisma generate');
    const user = await users.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials', status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'invalid credentials', status: 401 });
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
