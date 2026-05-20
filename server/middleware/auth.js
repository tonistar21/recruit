import jwt from 'jsonwebtoken';

export function authContext(req, _res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  let jwtPayload = null;
  if (token) {
    try {
      jwtPayload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_secret');
    } catch (_error) {
      jwtPayload = null;
    }
  }

  req.auth = {
    userId: jwtPayload?.userId || null,
    userName: req.headers['x-user-name'] || jwtPayload?.userName || null,
    userEmail: req.headers['x-user-email'] || jwtPayload?.userEmail || null,
    userRole: req.headers['x-user-role'] || jwtPayload?.userRole || null,
  };

  next();
}
