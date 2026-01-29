const { Tenant, Student, Class, User } = require('../models');

// Get Dashboard Stats
exports.getStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const totalStudents = await Student.countDocuments();
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = await Tenant.countDocuments({
      validityDate: { 
        $gte: new Date(), 
        $lte: sevenDaysFromNow 
      },
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        totalStudents,
        expiringSoon
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get All Tenants
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .select('-__v')
      .sort({ createdAt: -1 });

    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const studentCount = await Student.countDocuments({ tenantId: tenant._id });
        const classCount = await Class.countDocuments({ tenantId: tenant._id });
        
        // Get user info
        const user = await User.findOne({ tenantId: tenant._id }).select('username');
        
        return {
          ...tenant.toObject(),
          studentCount,
          classCount,
          username: user?.username || ''
        };
      })
    );

    res.json({
      success: true,
      data: tenantsWithStats
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Single Tenant
exports.getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    const user = await User.findOne({ tenantId: tenant._id }).select('username');

    res.json({
      success: true,
      data: {
        ...tenant.toObject(),
        username: user?.username || ''
      }
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Create Tenant
exports.createTenant = async (req, res) => {
  try {
    const { schoolName, username, password, validityDate } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists.'
      });
    }

    // Create tenant
    const tenant = await Tenant.create({
      schoolName,
      status: 'active',
      validityDate: new Date(validityDate)
    });

    // Create user for tenant
    await User.create({
      username: username.toLowerCase(),
      password,
      name: schoolName,
      role: 'tenant',
      tenantId: tenant._id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully.',
      data: {
        id: tenant._id,
        schoolName: tenant.schoolName,
        username: username.toLowerCase(),
        status: tenant.status,
        validityDate: tenant.validityDate
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update Tenant
exports.updateTenant = async (req, res) => {
  try {
    const { schoolName, username, password, validityDate } = req.body;

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    // Find the user for this tenant
    const user = await User.findOne({ tenantId: tenant._id });

    // Check if new username already exists (for different user)
    if (username && user) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists.'
        });
      }
    }

    // Update tenant
    if (schoolName) tenant.schoolName = schoolName;
    if (validityDate) tenant.validityDate = new Date(validityDate);
    await tenant.save();

    // Update user
    if (user) {
      if (username) user.username = username.toLowerCase();
      if (schoolName) user.name = schoolName;
      if (password && password.trim() !== '') {
        user.password = password;
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Tenant updated successfully.',
      data: {
        id: tenant._id,
        schoolName: tenant.schoolName,
        username: user?.username || '',
        status: tenant.status,
        validityDate: tenant.validityDate
      }
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Toggle Tenant Status
exports.toggleStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    tenant.status = tenant.status === 'active' ? 'inactive' : 'active';
    await tenant.save();

    // Also toggle user status
    await User.updateOne(
      { tenantId: tenant._id },
      { isActive: tenant.status === 'active' }
    );

    res.json({
      success: true,
      message: `Tenant ${tenant.status === 'active' ? 'activated' : 'deactivated'} successfully.`,
      data: {
        id: tenant._id,
        status: tenant.status
      }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Delete Tenant (Soft delete - just deactivate)
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    tenant.status = 'inactive';
    await tenant.save();

    // Deactivate user
    await User.updateOne(
      { tenantId: tenant._id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Tenant deactivated successfully.'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
