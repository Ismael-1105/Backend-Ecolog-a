const { requireAdmin } = require('./rbac');

/**
 * Admin Middleware
 * Ensures user has Administrador or SuperAdmin role
 * This is a wrapper around the RBAC requireAdmin middleware
 */
module.exports = requireAdmin;
