// middleware/auth.js
const jwt = require("jsonwebtoken");

// ✅ Middleware to check if user is authenticated
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.sendStatus(401); // Unauthorized if no token

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden if invalid token
    req.user = user;
    next();
  });
}

// ✅ Middleware to check if user has one of the allowed roles
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
