const { Class, Student } = require('../models');

// Get All Classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ tenantId: req.user.tenantId })
      .sort({ name: 1, section: 1 });

    // Get student count for each class
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({
          classId: cls._id,
          status: 'active'
        });
        return { ...cls.toObject(), studentCount };
      })
    );

    res.json({
      success: true,
      data: classesWithCount
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Single Class
exports.getClass = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    const studentCount = await Student.countDocuments({
      classId: cls._id,
      status: 'active'
    });

    res.json({
      success: true,
      data: { ...cls.toObject(), studentCount }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Create Class
exports.createClass = async (req, res) => {
  try {
    const { name, section } = req.body;

    // Check for duplicate
    const existingClass = await Class.findOne({
      tenantId: req.user.tenantId,
      name,
      section: section || ''
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class already exists.'
      });
    }

    const cls = await Class.create({
      tenantId: req.user.tenantId,
      name,
      section: section || ''
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      data: { ...cls.toObject(), studentCount: 0 }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update Class
exports.updateClass = async (req, res) => {
  try {
    const { name, section } = req.body;

    const cls = await Class.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check for duplicate if name/section changed
    if (name !== cls.name || section !== cls.section) {
      const existingClass = await Class.findOne({
        tenantId: req.user.tenantId,
        name,
        section: section || '',
        _id: { $ne: cls._id }
      });

      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: 'Class already exists.'
        });
      }
    }

    cls.name = name;
    cls.section = section || '';
    await cls.save();

    res.json({
      success: true,
      message: 'Class updated successfully.',
      data: cls
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Delete Class
exports.deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    // Check if class has students
    const studentCount = await Student.countDocuments({ classId: cls._id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with students. Please reassign or remove students first.'
      });
    }

    await Class.deleteOne({ _id: cls._id });

    res.json({
      success: true,
      message: 'Class deleted successfully.'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
