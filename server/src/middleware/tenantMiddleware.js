// Middleware to enforce multi-tenant isolation
exports.enforceTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for tenant verification'
    });
  }

  // Super Admin is not constrained by a single company
  if (req.user.role === 'super_admin') {
    // Super admin can filter by companyId if supplied in query, or see everything
    req.tenantFilter = req.query.companyId ? { companyId: req.query.companyId } : {};
    return next();
  }

  // Ensure other users are associated with a company
  if (!req.user.companyId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: User is not associated with any company tenant'
    });
  }

  // Set the tenant filter for queries
  req.tenantFilter = { companyId: req.user.companyId };

  // For write operations, inject/force the correct companyId into body to prevent tenant spoofing
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body.companyId = req.user.companyId.toString();
  }

  next();
};
