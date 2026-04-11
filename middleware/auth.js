export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  console.error('[requireAuth] no session — url:', req.originalUrl, '| sessionID:', req.sessionID, '| userId:', req.session?.userId);
  if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ error: 'Non connecté' });
  res.redirect('/coulisses');
}
