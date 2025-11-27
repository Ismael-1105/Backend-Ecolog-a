const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides flexible permission checking based on user roles
 */

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
    Estudiante: 1,
    Docente: 2,
    Administrador: 3,
    SuperAdmin: 4,
};

// Define permissions for each role
const ROLE_PERMISSIONS = {
    Estudiante: [
        'video:read',
        'video:comment',
        'video:rate',
        'comment:create',
        'comment:read',
        'comment:delete:own',
        'rating:create',
        'rating:read',
        'user:read:own',
        'user:update:own',
    ],
    Docente: [
        'video:read',
        'video:create',
        'video:update:own',
        'video:delete:own',
        'video:comment',
        'video:rate',
        'comment:create',
        'comment:read',
        'comment:delete:own',
        'rating:create',
        'rating:read',
        'user:read:own',
        'user:update:own',
    ],
    Administrador: [
        'video:read',
        'video:create',
        'video:update:any',
        'video:delete:any',
        'video:approve',
        'video:comment',
        'video:rate',
        'comment:create',
        'comment:read',
        'comment:delete:any',
        'rating:create',
        'rating:read',
        'user:read:any',
        'user:update:any',
        'user:delete:any',
    ],
    SuperAdmin: [
        '*', // All permissions
    ],
};

/**
 * Check if user has required role (exact match or higher in hierarchy)
 * @param {Array<string>} allowedRoles - Array of role names that are allowed
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ErrorResponse.unauthorized('Authentication required'));
        }

        const userRole = req.user.role;

        // Check if user's role is in the allowed roles list
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        // Check if user has a higher role in hierarchy
        const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
        const hasHigherRole = allowedRoles.some((role) => {
            const requiredLevel = ROLE_HIERARCHY[role] || 0;
            return userRoleLevel >= requiredLevel;
        });

        if (hasHigherRole) {
            return next();
        }

        return next(
            ErrorResponse.forbidden(
                `Access denied. Required role: ${allowedRoles.join(' or ')}`
            )
        );
    };
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission string (e.g., 'video:create')
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ErrorResponse.unauthorized('Authentication required'));
        }

        const userRole = req.user.role;
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];

        // SuperAdmin has all permissions
        if (userPermissions.includes('*')) {
            return next();
        }

        // Check if user has the specific permission
        if (userPermissions.includes(permission)) {
            return next();
        }

        return next(
            ErrorResponse.forbidden(
                `Access denied. Required permission: ${permission}`
            )
        );
    };
};

/**
 * Check if user can access resource (either owns it or has admin role)
 * @param {Function} getResourceOwnerId - Function that returns the owner ID of the resource
 */
const requireOwnershipOrAdmin = (getResourceOwnerId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(ErrorResponse.unauthorized('Authentication required'));
        }

        const userRole = req.user.role;
        const userId = req.user.id;

        // Admins and SuperAdmins can access any resource
        if (userRole === 'Administrador' || userRole === 'SuperAdmin') {
            return next();
        }

        try {
            // Get the owner ID of the resource
            const ownerId = await getResourceOwnerId(req);

            // Check if user owns the resource
            if (ownerId && ownerId.toString() === userId.toString()) {
                return next();
            }

            return next(
                ErrorResponse.forbidden(
                    'Access denied. You can only access your own resources'
                )
            );
        } catch (error) {
            return next(error);
        }
    };
};

/**
 * Shorthand middleware for admin-only routes
 */
const requireAdmin = requireRole(['Administrador', 'SuperAdmin']);

/**
 * Shorthand middleware for super admin-only routes
 */
const requireSuperAdmin = requireRole(['SuperAdmin']);

/**
 * Shorthand middleware for docente and above
 */
const requireDocente = requireRole(['Docente', 'Administrador', 'SuperAdmin']);

module.exports = {
    requireRole,
    requirePermission,
    requireOwnershipOrAdmin,
    requireAdmin,
    requireSuperAdmin,
    requireDocente,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
};
