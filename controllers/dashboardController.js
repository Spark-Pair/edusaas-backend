const { Student, Class, Exam, Attendance } = require('../models');

// Get Tenant Dashboard Stats
exports.getStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const totalStudents = await Student.countDocuments({ 
      tenantId, 
      status: 'active' 
    });
    
    const totalClasses = await Class.countDocuments({ tenantId });
    const totalExams = await Exam.countDocuments({ tenantId });

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({ 
      tenantId, 
      date: today 
    });
    
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const totalMarked = todayAttendance.length;
    const attendancePercent = totalMarked > 0 
      ? Math.round((presentToday / totalMarked) * 100) 
      : 0;

    // Recent students
    const recentStudents = await Student.find({ tenantId })
      .populate('classId', 'name section')
      .sort({ createdAt: -1 })
      .limit(5);

    // Class-wise student distribution
    const classes = await Class.find({ tenantId });
    const classDistribution = await Promise.all(
      classes.map(async (cls) => {
        const count = await Student.countDocuments({ 
          classId: cls._id, 
          status: 'active' 
        });
        return {
          classId: cls._id,
          className: `${cls.name} ${cls.section || ''}`.trim(),
          studentCount: count
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        totalExams,
        attendancePercent,
        recentStudents,
        classDistribution
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
