// middleware/activityLogger.js
const ActivityLog = require('../models/activityLog');

const activityLogger = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function (data) {
    if (req.user && req.logActivity) {
      const log = new ActivityLog({
        userId: req.user.id,
        action: req.logActivity.action,
        details: req.logActivity.details,
        documentId: req.logActivity.documentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      log.save().catch(error => {
        console.error('Error saving activity log:', error);
      });
    }
    
    originalSend.apply(res, arguments);
  };
  
  next();
};

// Helper function to set activity details
const setActivity = (action, details = '', documentId = null) => {
  return (req, res, next) => {
    req.logActivity = {
      action,
      details: typeof details === 'function' ? details(req) : details,
      documentId: typeof documentId === 'function' ? documentId(req) : documentId
    };
    next();
  };
};

module.exports = { activityLogger, setActivity };