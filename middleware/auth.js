const jwt = require('jsonwebtoken');
const { Admin, Tenant } = require('../models');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

// Admin Only Access
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin only.' 
    });
  }
  next();
};

// Tenant Only Access
const tenantOnly = (req, res, next) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Tenant only.' 
    });
  }
  next();
};

// Check Tenant Validity
const checkTenantValidity = async (req, res, next) => {
  try {
    if (req.user.role !== 'tenant') return next();
    
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tenant not found.' 
      });
    }

    if (!tenant.isValid()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your subscription has expired or account is inactive.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error.' 
    });
  }
};

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  verifyToken,
  adminOnly,
  tenantOnly,
  checkTenantValidity,
  generateToken
};
