const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const examSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  subjects: [subjectSchema]
}, {
  timestamps: true
});

examSchema.index({ tenantId: 1, classId: 1 });

module.exports = mongoose.model('Exam', examSchema);
