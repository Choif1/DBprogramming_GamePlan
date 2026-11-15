import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

const createToken = (user) => jwt.sign(
  { id: user.id, username: user.username, nickname: user.nickname, email: user.email },
  process.env.JWT_SECRET || 'fallback_secret_key',
  { expiresIn: '7d' },
);

// 회원가입
// POST /api/users/signup
router.post('/signup', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const nickname = String(req.body.nickname || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!username || !nickname || !email || !password) {
    return res.status(400).json({ message: '아이디, 닉네임, 이메일, 비밀번호를 모두 입력해 주세요.' });
  }
  if (username.length > 50 || nickname.length > 30 || email.length > 100) {
    return res.status(400).json({ message: '입력한 값의 길이가 허용 범위를 넘었습니다.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: '올바른 이메일 주소를 입력해 주세요.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 8자 이상 입력해 주세요.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, password, nickname, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nickname, email],
    );
    const user = { id: result.insertId, username, nickname, email };

    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token: createToken(user),
      user,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }
    console.error('회원가입 오류:', error.message);
    return res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.' });
  }
});

// 아이디와 비밀번호로 로그인
// POST /api/users/login
router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해 주세요.' });
  }

  try {
    const [users] = await db.query(
      'SELECT id, username, password, nickname, email FROM users WHERE username = ? LIMIT 1',
      [username],
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const publicUser = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
    };
    return res.json({ message: '로그인되었습니다.', token: createToken(publicUser), user: publicUser });
  } catch (error) {
    console.error('로그인 오류:', error.message);
    return res.status(500).json({ message: '로그인 중 서버 오류가 발생했습니다.' });
  }
});

// 내 계정 정보 조회
// GET /api/users/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, nickname, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id],
    );
    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    return res.json(users[0]);
  } catch (error) {
    console.error('계정 조회 오류:', error.message);
    return res.status(500).json({ message: '계정 정보를 불러오지 못했습니다.' });
  }
});

// 내 계정 정보 수정
// PUT /api/users/me
router.put('/me', authenticateToken, async (req, res) => {
  const username = String(req.body.username || '').trim();
  const nickname = String(req.body.nickname || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const currentPassword = String(req.body.currentPassword || '');

  if (!username || !nickname || !email || !currentPassword) {
    return res.status(400).json({ message: '아이디, 닉네임, 이메일, 현재 비밀번호를 입력해 주세요.' });
  }
  if (username.length > 50 || nickname.length > 30 || email.length > 100) {
    return res.status(400).json({ message: '입력한 값의 길이가 허용 범위를 넘었습니다.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: '올바른 이메일 주소를 입력해 주세요.' });
  }

  try {
    const [users] = await db.query('SELECT password FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    if (!(await bcrypt.compare(currentPassword, users[0].password))) {
      return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    await db.query(
      'UPDATE users SET username = ?, nickname = ?, email = ? WHERE id = ?',
      [username, nickname, email, req.user.id],
    );
    return res.json({ message: '계정 정보가 수정되었습니다.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }
    console.error('계정 수정 오류:', error.message);
    return res.status(500).json({ message: '계정 정보 수정 중 서버 오류가 발생했습니다.' });
  }
});

// 회원 탈퇴
// DELETE /api/users/me
router.delete('/me', authenticateToken, async (req, res) => {
  const password = String(req.body.password || '');
  if (!password) {
    return res.status(400).json({ message: '비밀번호를 입력해 주세요.' });
  }

  try {
    const [users] = await db.query('SELECT password FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    if (!(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    return res.json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원 탈퇴 오류:', error.message);
    return res.status(500).json({ message: '회원 탈퇴 중 서버 오류가 발생했습니다.' });
  }
});

export default router;
