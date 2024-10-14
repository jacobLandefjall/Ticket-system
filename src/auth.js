const express = require('express');
const { requiresAuth } = require('express-openid-connect');
require('dotenv').config();

const router = express.Router();

const checkRole = (...roles) => (req, res, next) => {
  const userRoles = req.oidc.user[`https://ticketsystem.com/roles`] || [];
  const hasRequiredRole = roles.some(role => userRoles.includes(role));
  if (hasRequiredRole) {
      return next(); // User has one of the required roles.
  }
  return res.status(403).render('accessDenied'); // User does not have the required access.
};

// Route for login (handled by express-openid-connect)
router.get('/login', (req, res) => {
  res.oidc.login({ returnTo: '/proj/home' });
});

// Route for logout
router.get('/logout', (req, res) => {
  res.oidc.logout({ returnTo: 'http://localhost:1337' });
});

// Protected route
router.get('/protected', requiresAuth(), (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.send(`This is a protected page. Logged in as: ${req.oidc.user.name}`);
  } else {
    res.redirect('/login');
  }
});

module.exports = {
  authRoutes: router,
  checkRole: checkRole
};
