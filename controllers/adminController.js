const { Tenant, Student, Class, User, CardTemplate } = require('../models');

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

// Get Classes For Tenant (Admin)
exports.getTenantClasses = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('_id');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    const classes = await Class.find({ tenantId: tenant._id })
      .select('_id name section')
      .sort({ name: 1, section: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get tenant classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Latest Student For Tenant (Admin)
exports.getTenantLastStudent = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('_id schoolName');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    const student = await Student.findOne({ tenantId: tenant._id })
      .populate('classId', 'name section')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get tenant last student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Students For Tenant (Admin) - searchable
exports.getTenantStudents = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('_id');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    const { search = '', limit = 50 } = req.query;
    const query = { tenantId: tenant._id };

    if (search && search.trim()) {
      const pattern = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { firstName: pattern },
        { lastName: pattern },
        { rollNo: pattern }
      ];
    }

    const students = await Student.find(query)
      .populate('classId', 'name section')
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 50)));

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get tenant students error:', error);
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

// Get Card Templates (Admin)
exports.getCardTemplates = async (req, res) => {
  try {
    const templates = await CardTemplate.find()
      .populate('tenantId', 'schoolName')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get card templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Single Card Template (Admin)
exports.getCardTemplate = async (req, res) => {
  try {
    const template = await CardTemplate.findById(req.params.id).populate('tenantId', 'schoolName');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found.'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get card template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Create Card Template (Admin)
exports.createCardTemplate = async (req, res) => {
  try {
    const {
      name,
      tenantId,
      width,
      height,
      baseSvgMarkup = '',
      elements = [],
      groups = {}
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant is required.'
      });
    }

    const tenant = await Tenant.findById(tenantId).select('_id');
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight) || parsedWidth < 20 || parsedHeight < 20) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template size.'
      });
    }

    const template = await CardTemplate.create({
      name: (name || 'Untitled Template').trim(),
      tenantId,
      width: parsedWidth,
      height: parsedHeight,
      baseSvgMarkup,
      elements,
      groups
    });

    const populated = await CardTemplate.findById(template._id).populate('tenantId', 'schoolName');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('Create card template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update Card Template (Admin)
exports.updateCardTemplate = async (req, res) => {
  try {
    const template = await CardTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found.'
      });
    }

    const {
      name,
      width,
      height,
      baseSvgMarkup,
      elements,
      groups
    } = req.body;

    if (typeof name === 'string' && name.trim()) {
      template.name = name.trim();
    }
    if (width !== undefined) {
      const parsedWidth = Number(width);
      if (!Number.isFinite(parsedWidth) || parsedWidth < 20) {
        return res.status(400).json({
          success: false,
          message: 'Invalid width.'
        });
      }
      template.width = parsedWidth;
    }
    if (height !== undefined) {
      const parsedHeight = Number(height);
      if (!Number.isFinite(parsedHeight) || parsedHeight < 20) {
        return res.status(400).json({
          success: false,
          message: 'Invalid height.'
        });
      }
      template.height = parsedHeight;
    }
    if (typeof baseSvgMarkup === 'string') template.baseSvgMarkup = baseSvgMarkup;
    if (Array.isArray(elements)) template.elements = elements;
    if (groups && typeof groups === 'object') template.groups = groups;

    await template.save();
    const populated = await CardTemplate.findById(template._id).populate('tenantId', 'schoolName');

    res.json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('Update card template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Use Card Template for selected school (duplicates if school differs)
exports.useCardTemplate = async (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant is required.'
      });
    }

    const [template, tenant] = await Promise.all([
      CardTemplate.findById(req.params.id),
      Tenant.findById(tenantId).select('_id schoolName')
    ]);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found.'
      });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found.'
      });
    }

    if (String(template.tenantId) === String(tenantId)) {
      const populated = await CardTemplate.findById(template._id).populate('tenantId', 'schoolName');
      return res.json({
        success: true,
        duplicated: false,
        data: populated
      });
    }

    const duplicatedTemplate = await CardTemplate.create({
      name: `${template.name} (${tenant.schoolName})`,
      tenantId,
      width: template.width,
      height: template.height,
      baseSvgMarkup: template.baseSvgMarkup || '',
      elements: template.elements || [],
      groups: template.groups || {}
    });

    const populated = await CardTemplate.findById(duplicatedTemplate._id).populate('tenantId', 'schoolName');

    res.status(201).json({
      success: true,
      duplicated: true,
      data: populated
    });
  } catch (error) {
    console.error('Use card template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
