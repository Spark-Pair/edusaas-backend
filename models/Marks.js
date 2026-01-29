const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  marks: [{
    type: Number,
    default: 0
  }],
  total: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

marksSchema.index({ tenantId: 1, examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
