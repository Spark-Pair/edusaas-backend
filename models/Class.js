const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  section: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

classSchema.index({ tenantId: 1, name: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
