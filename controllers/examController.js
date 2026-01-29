const { Exam, Marks, Student, Class } = require('../models');

// Get All Exams
exports.getExams = async (req, res) => {
  try {
    const { classId } = req.query;
    
    const query = { tenantId: req.user.tenantId };
    if (classId) query.classId = classId;

    const exams = await Exam.find(query)
      .populate('classId', 'name section')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Single Exam
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).populate('classId', 'name section');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.'
      });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Create Exam
exports.createExam = async (req, res) => {
  try {
    const { name, classId, date, subjects } = req.body;

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

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one subject.'
      });
    }

    const exam = await Exam.create({
      tenantId: req.user.tenantId,
      classId,
      name,
      date,
      subjects
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate('classId', 'name section');

    res.status(201).json({
      success: true,
      message: 'Exam created successfully.',
      data: populatedExam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Update Exam
exports.updateExam = async (req, res) => {
  try {
    const { name, date, subjects } = req.body;

    const exam = await Exam.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.'
      });
    }

    if (name) exam.name = name;
    if (date) exam.date = date;
    if (subjects) exam.subjects = subjects;

    await exam.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('classId', 'name section');

    res.json({
      success: true,
      message: 'Exam updated successfully.',
      data: populatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Delete Exam
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.'
      });
    }

    // Delete associated marks
    await Marks.deleteMany({ examId: exam._id });
    await Exam.deleteOne({ _id: exam._id });

    res.json({
      success: true,
      message: 'Exam deleted successfully.'
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Marks for Exam
exports.getMarks = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findOne({
      _id: examId,
      tenantId: req.user.tenantId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.'
      });
    }

    // Get all active students in the class
    const students = await Student.find({
      tenantId: req.user.tenantId,
      classId: exam.classId,
      status: 'active'
    }).sort({ rollNo: 1 });

    // Get existing marks
    const existingMarks = await Marks.find({
      tenantId: req.user.tenantId,
      examId
    });

    // Map marks to students
    const marksMap = {};
    existingMarks.forEach(m => {
      marksMap[m.studentId.toString()] = m;
    });

    const marksData = students.map(student => {
      const studentMarks = marksMap[student._id.toString()];
      return {
        studentId: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        marks: studentMarks?.marks || exam.subjects.map(() => 0),
        total: studentMarks?.total || 0,
        percentage: studentMarks?.percentage || 0
      };
    });

    res.json({
      success: true,
      data: {
        exam,
        marks: marksData
      }
    });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Save Marks
exports.saveMarks = async (req, res) => {
  try {
    const { examId, records } = req.body;

    const exam = await Exam.findOne({
      _id: examId,
      tenantId: req.user.tenantId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.'
      });
    }

    const maxTotal = exam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);

    // Delete existing marks
    await Marks.deleteMany({
      tenantId: req.user.tenantId,
      examId
    });

    // Create new marks
    const marksRecords = records.map(record => {
      const total = record.marks.reduce((sum, m) => sum + (m || 0), 0);
      const percentage = Math.round((total / maxTotal) * 100);

      return {
        tenantId: req.user.tenantId,
        examId,
        studentId: record.studentId,
        marks: record.marks,
        total,
        percentage
      };
    });

    await Marks.insertMany(marksRecords);

    res.json({
      success: true,
      message: 'Marks saved successfully.'
    });
  } catch (error) {
    console.error('Save marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};

// Get Student Report Card
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({
      _id: studentId,
      tenantId: req.user.tenantId
    }).populate('classId', 'name section');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Get all exams for student's class
    const exams = await Exam.find({
      tenantId: req.user.tenantId,
      classId: student.classId._id
    }).sort({ date: -1 });

    // Get marks for each exam
    const marks = await Marks.find({
      tenantId: req.user.tenantId,
      studentId
    }).populate('examId');

    const report = exams.map(exam => {
      const examMarks = marks.find(m => m.examId._id.toString() === exam._id.toString());
      return {
        exam: {
          id: exam._id,
          name: exam.name,
          date: exam.date,
          subjects: exam.subjects
        },
        marks: examMarks?.marks || [],
        total: examMarks?.total || 0,
        percentage: examMarks?.percentage || 0
      };
    });

    res.json({
      success: true,
      data: {
        student,
        report
      }
    });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
