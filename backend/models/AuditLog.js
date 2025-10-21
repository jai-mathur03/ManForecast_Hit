const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
      'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['User', 'Department', 'Forecast', 'Report', 'Notification']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    changes: [String]
  },
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  duration: Number, // in milliseconds
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, resource: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
