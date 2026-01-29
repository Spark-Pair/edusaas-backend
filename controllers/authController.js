const { User, Tenant } = require('../models');
const { generateToken } = require('../middleware/auth');

// Unified Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password.'
      });
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact admin.'
      });
    }

    // For tenant users, check tenant status and validity
    let tenantData = null;
    if (user.role === 'tenant' && user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found.'
        });
      }

      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your school account is inactive. Please contact admin.'
        });
      }

      if (new Date(tenant.validityDate) < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please contact admin.'
        });
      }

      tenantData = {
        id: tenant._id,
        schoolName: tenant.schoolName,
        validityDate: tenant.validityDate
      };
    }

    // Generate token
    const tokenPayload = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    if (user.tenantId) {
      tokenPayload.tenantId = user.tenantId;
    }

    const token = generateToken(tokenPayload);

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        ...(tenantData && { 
          tenantId: tenantData.id,
          schoolName: tenantData.schoolName,
          validityDate: tenantData.validityDate
        })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Verify Token
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    let responseData = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    // For tenant users, get tenant data
    if (user.role === 'tenant' && user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (tenant) {
        responseData.tenantId = tenant._id;
        responseData.schoolName = tenant.schoolName;
        responseData.validityDate = tenant.validityDate;
      }
    }

    return res.json({
      success: true,
      user: responseData
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
