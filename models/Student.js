const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  guardian: {
    type: String,
    trim: true,
    default: ''
  },
  contact: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'left'],
    default: 'active'
  },
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

studentSchema.index({ tenantId: 1, rollNo: 1 }, { unique: true });

studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Student', studentSchema);
