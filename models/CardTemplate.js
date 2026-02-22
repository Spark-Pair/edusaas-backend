const mongoose = require('mongoose');

const cardTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    width: {
      type: Number,
      required: true,
      min: 20
    },
    height: {
      type: Number,
      required: true,
      min: 20
    },
    borderRadius: {
      type: Number,
      default: 12,
      min: 0
    },
    borderWidth: {
      type: Number,
      default: 2,
      min: 0
    },
    borderColor: {
      type: String,
      default: '#94a3b8',
      trim: true
    },
    baseSvgMarkup: {
      type: String,
      default: ''
    },
    elements: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    groups: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

cardTemplateSchema.index({ tenantId: 1, updatedAt: -1 });
cardTemplateSchema.index({ name: 1 });

module.exports = mongoose.model('CardTemplate', cardTemplateSchema);
