import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    return next();
  } catch {
    return res.status(401).json({ message: '유효하지 않거나 만료된 로그인 정보입니다.' });
  }
};
