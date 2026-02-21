const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  schoolLogo: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  validityDate: {
    type: Date,
    required: [true, 'Validity date is required']
  }
}, {
  timestamps: true
});

tenantSchema.methods.isValid = function() {
  return this.status === 'active' && new Date(this.validityDate) > new Date();
};

module.exports = mongoose.model('Tenant', tenantSchema);
