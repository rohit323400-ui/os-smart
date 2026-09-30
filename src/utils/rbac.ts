import { type ModuleTab } from '../components/ModuleNavigation';

export type UserRole = 'Resident' | 'Facility Admin' | 'Security Guard' | 'Maintenance Tech';

export interface RolePermission {
  allowedTabs: ModuleTab[];
  defaultTab: ModuleTab;
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  'Resident': {
    allowedTabs: [
      'home',
      'architecture',
      'parking',
      'water',
      'water-leakage',
      'lighting',
      'security',
      'maintenance',
      'noise',
      'resource',
      'trust',
      'guest-parking',
      'privacy',
      'notifications'
    ],
    defaultTab: 'home',
    description: 'Resident View: Flat water, EV parking, visitor passes, noise alerts, resource sharing & community trust.'
  },
  'Facility Admin': {
    allowedTabs: [
      'home',
      'architecture',
      'parking',
      'water',
      'water-leakage',
      'lighting',
      'fire',
      'lift',
      'security',
      'waste',
      'maintenance',
      'noise',
      'resource',
      'trust',
      'guest-parking',
      'actionlog',
      'privacy',
      'notifications'
    ],
    defaultTab: 'home',
    description: 'Facility Admin: Complete society Command Center, IoT sensors, emergency overrides & AI logs.'
  },
  'Security Guard': {
    allowedTabs: [
      'home',
      'security',
      'fire',
      'lift',
      'guest-parking',
      'actionlog',
      'notifications'
    ],
    defaultTab: 'security',
    description: 'Security Desk: Gate visitor pass verification, guest parking, fire emergency & lift SOS alerts.'
  },
  'Maintenance Tech': {
    allowedTabs: [
      'home',
      'maintenance',
      'water',
      'water-leakage',
      'lighting',
      'lift',
      'waste',
      'notifications'
    ],
    defaultTab: 'maintenance',
    description: 'Maintenance Desk: Resolve tickets, inspect valve V-102, streetlight poles, lift ARD status & waste bins.'
  }
};

export function isTabAllowed(role: UserRole, tab: ModuleTab): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return true;
  return permissions.allowedTabs.includes(tab);
}
