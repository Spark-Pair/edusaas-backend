const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    required: true
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: String,
    required: true,
    index: true
  },
  isDayOff: {
    type: Boolean,
    default: false
  },
  dayOffReason: {
    type: String,
    default: ''
  },
  records: [attendanceRecordSchema]
}, {
  timestamps: true
});

attendanceSchema.index({ tenantId: 1, classId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
