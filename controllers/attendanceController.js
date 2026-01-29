const { Attendance, Student, Class } = require('../models');

// Get Attendance for a Class on a Date
exports.getClassAttendance = async (req, res) => {
  try {
    const { classId, date } = req.params;

    // Get all active students in the class
    const students = await Student.find({
      tenantId: req.user.tenantId,
      classId,
      status: 'active'
    }).sort({ rollNo: 1 });

    // Get existing attendance for this date
    const existingAttendance = await Attendance.findOne({
      tenantId: req.user.tenantId,
      classId,
      date
    });

    // Map attendance to students
    let attendanceData = [];
    let isDayOff = false;
    let dayOffReason = '';

    if (existingAttendance) {
      isDayOff = existingAttendance.isDayOff;
      dayOffReason = existingAttendance.dayOffReason || '';
      
      const recordMap = {};
      existingAttendance.records.forEach(record => {
        recordMap[record.studentId.toString()] = record.status;
      });

      attendanceData = students.map(student => ({
        studentId: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        status: recordMap[student._id.toString()] || 'present'
      }));
    } else {
      attendanceData = students.map(student => ({
        studentId: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        status: 'present'
      }));
    }

    res.json({
      success: true,
      data: {
        records: attendanceData,
        isDayOff,
        dayOffReason,
        exists: !!existingAttendance
      }
    });
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Save or Update Attendance
exports.saveAttendance = async (req, res) => {
  try {
    const { classId, date, records, isDayOff, dayOffReason } = req.body;

    if (!classId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId and date.'
      });
    }

    // Verify class belongs to tenant
    const cls = await Class.findOne({
      _id: classId,
      tenantId: req.user.tenantId
    });

    if (!cls) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class.'
      });
    }

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      tenantId: req.user.tenantId,
      classId,
      date
    });

    if (attendance) {
      // Update existing attendance
      attendance.isDayOff = isDayOff || false;
      attendance.dayOffReason = dayOffReason || '';
      
      if (!isDayOff && records && Array.isArray(records)) {
        attendance.records = records.map(record => ({
          studentId: record.studentId,
          status: record.status
        }));
      } else if (isDayOff) {
        attendance.records = [];
      }
      
      await attendance.save();
    } else {
      // Create new attendance
      const attendanceData = {
        tenantId: req.user.tenantId,
        classId,
        date,
        isDayOff: isDayOff || false,
        dayOffReason: dayOffReason || '',
        records: []
      };

      if (!isDayOff && records && Array.isArray(records)) {
        attendanceData.records = records.map(record => ({
          studentId: record.studentId,
          status: record.status
        }));
      }

      attendance = await Attendance.create(attendanceData);
    }

    res.json({
      success: true,
      message: 'Attendance saved successfully.'
    });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Attendance Report
exports.getAttendanceReport = async (req, res) => {
  try {
    const { classId, month, year } = req.query;

    if (!classId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId, month, and year.'
      });
    }

    const paddedMonth = month.toString().padStart(2, '0');
    const startDate = `${year}-${paddedMonth}-01`;
    const endDate = `${year}-${paddedMonth}-31`;

    // Get all students in the class
    const students = await Student.find({
      tenantId: req.user.tenantId,
      classId,
      status: 'active'
    }).sort({ rollNo: 1 });

    // Get attendance for the month
    const attendances = await Attendance.find({
      tenantId: req.user.tenantId,
      classId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate stats for each student
    const report = students.map(student => {
      let present = 0;
      let absent = 0;
      let leave = 0;

      attendances.forEach(att => {
        if (att.isDayOff) return;
        
        const record = att.records.find(
          r => r.studentId.toString() === student._id.toString()
        );
        
        if (record) {
          if (record.status === 'present') present++;
          else if (record.status === 'absent') absent++;
          else if (record.status === 'leave') leave++;
        }
      });

      const total = present + absent + leave;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          rollNo: student.rollNo
        },
        present,
        absent,
        leave,
        total,
        percentage
      };
    });

    const daysOff = attendances.filter(a => a.isDayOff).length;

    res.json({
      success: true,
      data: {
        report,
        daysOff
      }
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Attendance Stats for Dashboard
exports.getAttendanceStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayAttendances = await Attendance.find({
      tenantId: req.user.tenantId,
      date: today,
      isDayOff: false
    });

    let totalPresent = 0;
    let totalStudents = 0;

    todayAttendances.forEach(att => {
      att.records.forEach(record => {
        totalStudents++;
        if (record.status === 'present') totalPresent++;
      });
    });

    const percentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    res.json({
      success: true,
      data: {
        percentage,
        totalPresent,
        totalStudents
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
