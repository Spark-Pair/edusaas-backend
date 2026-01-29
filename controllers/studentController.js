const { Student, Class, Tenant } = require('../models');
const QRCode = require('qrcode');

// Generate QR Code for Student
const generateQRCode = async (studentId) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const url = `${baseUrl}/student/${studentId}`;
    return await QRCode.toDataURL(url, { width: 300, margin: 2 });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Get All Students
exports.getStudents = async (req, res) => {
  try {
    const { classId, status, search, page = 1, limit = 50 } = req.query;
    
    const query = { tenantId: req.user.tenantId };
    
    if (classId) query.classId = classId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('classId', 'name section')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Get Single Student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).populate('classId', 'name section');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Create Student
exports.createStudent = async (req, res) => {
  try {
    const { firstName, lastName, rollNo, classId, dob, gender, guardian, contact, address } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !rollNo || !classId) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, roll number, and class are required.'
      });
    }

    // Check if roll number exists
    const existingStudent = await Student.findOne({
      tenantId: req.user.tenantId,
      rollNo
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists.'
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

    // Prepare student data - handle empty date
    const studentData = {
      tenantId: req.user.tenantId,
      classId,
      firstName,
      lastName,
      rollNo,
      gender: gender || 'male',
      guardian: guardian || '',
      contact: contact || '',
      address: address || ''
    };

    // Only add dob if it's a valid date string
    if (dob && dob.trim() !== '') {
      studentData.dob = new Date(dob);
    }

    const student = await Student.create(studentData);

    // Generate QR Code
    const qrCode = await generateQRCode(student._id);
    if (qrCode) {
      student.qrCode = qrCode;
      await student.save();
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('classId', 'name section');

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      data: populatedStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Update Student
exports.updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, rollNo, classId, dob, gender, guardian, contact, address, status } = req.body;

    const student = await Student.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Check if new roll number exists
    if (rollNo && rollNo !== student.rollNo) {
      const existingStudent = await Student.findOne({
        tenantId: req.user.tenantId,
        rollNo,
        _id: { $ne: student._id }
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Roll number already exists.'
        });
      }
    }

    // Verify class if changed
    if (classId && classId !== student.classId.toString()) {
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
    }

    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (rollNo) student.rollNo = rollNo;
    if (classId) student.classId = classId;
    if (dob && dob.trim() !== '') {
      student.dob = new Date(dob);
    }
    if (gender) student.gender = gender;
    if (guardian !== undefined) student.guardian = guardian;
    if (contact !== undefined) student.contact = contact;
    if (address !== undefined) student.address = address;
    if (status) student.status = status;

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('classId', 'name section');

    res.json({
      success: true,
      message: 'Student updated successfully.',
      data: populatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Get Student QR Code
exports.getQRCode = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Regenerate if not exists
    if (!student.qrCode) {
      student.qrCode = await generateQRCode(student._id);
      await student.save();
    }

    res.json({
      success: true,
      data: { qrCode: student.qrCode }
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Public Student View (for QR scan)
exports.getPublicStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('classId', 'name section')
      .populate('tenantId', 'schoolName')
      .select('firstName lastName rollNo classId tenantId status guardian');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Get attendance summary
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({
      tenantId: student.tenantId,
      'records.studentId': student._id,
      isDayOff: false
    });

    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    attendanceRecords.forEach(att => {
      const record = att.records.find(r => r.studentId.toString() === student._id.toString());
      if (record) {
        if (record.status === 'present') presentDays++;
        else if (record.status === 'absent') absentDays++;
        else if (record.status === 'leave') leaveDays++;
      }
    });

    const totalDays = presentDays + absentDays + leaveDays;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Get exam results
    const Exam = require('../models/Exam');
    const Marks = require('../models/Marks');

    const exams = await Exam.find({
      tenantId: student.tenantId,
      classId: student.classId
    }).sort({ date: -1 }).limit(5);

    const examResults = await Promise.all(exams.map(async (exam) => {
      const marks = await Marks.findOne({
        examId: exam._id,
        studentId: student._id
      });

      const maxTotal = exam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);

      return {
        examName: exam.name,
        date: exam.date,
        subjects: exam.subjects.map((s, i) => ({
          name: s.name,
          maxMarks: s.maxMarks,
          obtained: marks?.marks?.[i] || 0
        })),
        total: marks?.total || 0,
        maxTotal,
        percentage: marks?.percentage || 0
      };
    }));

    res.json({
      success: true,
      data: {
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        class: student.classId,
        school: student.tenantId?.schoolName,
        status: student.status,
        guardian: student.guardian,
        attendance: {
          presentDays,
          absentDays,
          leaveDays,
          totalDays,
          percentage: attendancePercentage
        },
        exams: examResults
      }
    });
  } catch (error) {
    console.error('Get public student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};
