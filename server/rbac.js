// Production Role-Based Access Control (RBAC) Permission Matrix

export const ROLES = {
  RESIDENT: 'Resident',
  SECURITY_GUARD: 'Security Guard',
  MAINTENANCE_TECH: 'Maintenance Tech',
  FACILITY_ADMIN: 'Facility Admin',
  SUPER_ADMIN: 'Super Admin'
};

export const PERMISSIONS = {
  // Resident Scope
  PROFILE_VIEW: 'profile:view',
  PROFILE_UPDATE_OWN: 'profile:update_own',
  VISITOR_CREATE: 'visitor:create',
  VISITOR_VIEW_OWN: 'visitor:view_own',
  COMPLAINT_CREATE: 'complaint:create',
  COMPLAINT_VIEW_OWN: 'complaint:view_own',
  VEHICLE_MANAGE_OWN: 'vehicle:manage_own',
  BOOKING_CREATE: 'booking:create',
  BOOKING_VIEW_OWN: 'booking:view_own',
  NOTIFICATION_VIEW_OWN: 'notification:view_own',

  // Security Guard Scope
  VISITOR_VERIFY: 'visitor:verify',
  VISITOR_GATE_ENTRY: 'visitor:gate_entry',
  EMERGENCY_ACKNOWLEDGE: 'emergency:acknowledge',
  PARKING_MONITOR: 'parking:monitor',

  // Maintenance Tech Scope
  COMPLAINT_UPDATE_ASSIGNED: 'complaint:update_assigned',
  COMPLAINT_VIEW_ALL: 'complaint:view_all',
  EQUIPMENT_VIEW: 'equipment:view',

  // Facility Admin Scope
  USERS_MANAGE: 'users:manage',
  SOCIETY_SETTINGS: 'society:settings',
  STAFF_MANAGE: 'staff:manage',
  REPORTS_VIEW: 'reports:view',
  OPERATIONAL_CONTROLS: 'operational:controls',
  EQUIPMENT_CONTROL: 'equipment:control',
  EMERGENCY_CONTROL: 'emergency:control',
  AUDIT_VIEW: 'audit:view',
  PARKING_OVERRIDE: 'parking:override',

  // Super Admin
  ALL: '*'
};

export const ROLE_PERMISSIONS = {
  [ROLES.RESIDENT]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE_OWN,
    PERMISSIONS.VISITOR_CREATE,
    PERMISSIONS.VISITOR_VIEW_OWN,
    PERMISSIONS.COMPLAINT_CREATE,
    PERMISSIONS.COMPLAINT_VIEW_OWN,
    PERMISSIONS.VEHICLE_MANAGE_OWN,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.NOTIFICATION_VIEW_OWN
  ],
  [ROLES.SECURITY_GUARD]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.VISITOR_VERIFY,
    PERMISSIONS.VISITOR_GATE_ENTRY,
    PERMISSIONS.EMERGENCY_ACKNOWLEDGE,
    PERMISSIONS.PARKING_MONITOR
  ],
  [ROLES.MAINTENANCE_TECH]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.COMPLAINT_UPDATE_ASSIGNED,
    PERMISSIONS.COMPLAINT_VIEW_ALL,
    PERMISSIONS.EQUIPMENT_VIEW
  ],
  [ROLES.FACILITY_ADMIN]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SOCIETY_SETTINGS,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.OPERATIONAL_CONTROLS,
    PERMISSIONS.EQUIPMENT_CONTROL,
    PERMISSIONS.EMERGENCY_CONTROL,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.PARKING_OVERRIDE,
    PERMISSIONS.COMPLAINT_VIEW_ALL
  ],
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.ALL
  ]
};

export function hasPermission(userRole, requiredPermission) {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  const userPerms = ROLE_PERMISSIONS[userRole] || [];
  return userPerms.includes(PERMISSIONS.ALL) || userPerms.includes(requiredPermission);
}
