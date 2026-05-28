
import passport from 'passport';
export const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Unauthorized' });
    req.logIn(user, (err2) => {
      if (err2) return next(err2);
     
      res.json(user);
    });
  })(req, res, next);
};

export const current = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json(req.user); // { id, username, coins }
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

export const logout = (req, res) => {

  req.logout(() => res.status(204).end());
};
