const express = require('express');
const { requiresAuth } = require('express-openid-connect');
require('dotenv').config();

const router = express.Router();

const checkRole = (...roles) => (req, res, next) => {
  // Kolla om användaren är autentiserad
  if (!req.oidc.isAuthenticated()) {
      return res.status(401).render('accessDenied'); // Om ej autentiserad, neka åtkomst
  }

  // 1. Kontrollera roller från Auth0 (om de finns)
  const userRolesFromAuth0 = req.oidc.user[`https://ticketsystem.com/roles`] || [];

  // 2. Kontrollera rollen från lokala databasen via res.locals.user
  const userRoleFromDb = res.locals.user ? res.locals.user.role : null;

  // 3. Kombinera roller från Auth0 och lokala databasen
  const combinedRoles = new Set([...userRolesFromAuth0, userRoleFromDb]);

  // 4. Kolla om någon av de tillåtna rollerna matchar
  const hasRequiredRole = roles.some(role => combinedRoles.has(role));

  if (hasRequiredRole) {
      return next(); // Användaren har en av de tillåtna rollerna
  }

  // Om användaren inte har rätt roll, neka åtkomst
  return res.status(403).render('accessDenied'); // Användaren har inte nödvändig roll
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
