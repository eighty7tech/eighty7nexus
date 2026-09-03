/**
 * RBAC (Role-Based Access Control) Utilities
 * Provides functions and middleware for permission checking
 */

import { USER_ROLES, type UserRole } from "@/config/app.config";
import { isStaffRole } from "@/lib/staff-role";
import {
  ADMIN_PERMISSIONS,
  VENDOR_PERMISSIONS,
  STAFF_PERMISSIONS,
  type AdminPermission,
  type VendorPermission,
  type StaffPermission,
} from "@/config/permissions.config";
import {
  readVendorPolicyFlags,
  type VendorPackPolicy,
} from "@/lib/vendor-permissions";
import { AdminProfile, type IAdminProfile } from "@/models/admin-profile.model";
import { StaffProfile, type IStaffProfile } from "@/models/staff-profile.model";
import type { IUser } from "@/types";

// ============================================
// Role Checking Utilities
// ============================================

type MinimalUser =
  | { id?: string; role?: UserRole; roles?: UserRole[] }
  | null
  | undefined;

/**
 * Check if user has a specific role
 */
export function hasRole(
  user: MinimalUser,
  role: UserRole,
): boolean {
  if (!user) return false;
  // Check both legacy 'role' field and new 'roles' array
  return user.roles?.includes(role) || user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  user: MinimalUser,
  roles: UserRole[],
): boolean {
  if (!user) return false;
  return roles.some((role) => hasRole(user, role));
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: MinimalUser): boolean {
  return hasRole(user, USER_ROLES.ADMIN);
}

/**
 * Check if user is a vendor
 */
export function isVendor(user: MinimalUser): boolean {
  return hasRole(user, USER_ROLES.VENDOR);
}

/**
 * Check if user is a customer
 */
export function isCustomer(user: MinimalUser): boolean {
  return hasRole(user, USER_ROLES.CUSTOMER);
}

// ============================================
// Permission Checking Utilities
// ============================================

/**
 * Get admin profile with permissions
 */
export async function getAdminProfile(
  userId: string,
): Promise<IAdminProfile | null> {
  try {
    const profile = await AdminProfile.findOne({ userId });
    return profile;
  } catch {
    return null;
  }
}

/**
 * Check if admin user has a specific permission
 */
export async function hasAdminPermission(
  userId: string,
  permission: AdminPermission,
): Promise<boolean> {
  const profile = await getAdminProfile(userId);
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  return profile.permissions.includes(permission);
}

/**
 * Check if admin user has any of the specified permissions
 */
export async function hasAnyAdminPermission(
  userId: string,
  permissions: AdminPermission[],
): Promise<boolean> {
  const profile = await getAdminProfile(userId);
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  return permissions.some((p) => profile.permissions.includes(p));
}

/**
 * Check if admin user has all of the specified permissions
 */
export async function hasAllAdminPermissions(
  userId: string,
  permissions: AdminPermission[],
): Promise<boolean> {
  const profile = await getAdminProfile(userId);
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  return permissions.every((p) => profile.permissions.includes(p));
}

// ============================================
// Route Guard Helpers (for API routes)
// ============================================

/**
 * Create a role requirement check for API routes
 * Usage: const check = requireRoles('admin', 'vendor'); if (!check(user)) return 403;
 */
export function requireRoles(...roles: UserRole[]) {
  return (user: IUser | null | undefined): boolean => {
    return hasAnyRole(user, roles);
  };
}

/**
 * Create a permission requirement check for API routes
 * Usage: const check = await requirePermission(userId, 'manage_users'); if (!check) return 403;
 */
export async function requirePermission(
  userId: string,
  permission: AdminPermission,
): Promise<boolean> {
  return hasAdminPermission(userId, permission);
}

// ============================================
// Vendor Permission Checking
// ============================================

/**
 * Check if user is a seller (staff role for POS)
 */
export function isSeller(user: MinimalUser): boolean {
  return isStaffRole(user?.role) || hasRole(user, USER_ROLES.SELLER);
}

/**
 * Check if user can access vendor features (vendor, admin, or seller)
 */
export function canAccessVendorFeatures(
  user: MinimalUser,
): boolean {
  return hasAnyRole(user, [
    USER_ROLES.VENDOR,
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.SELLER,
  ]);
}

/**
 * May this caller delete store media by storage key?
 *
 * Deletion takes an arbitrary key rather than a record the caller owns, so
 * holding *some* non-customer role is not enough — a staff account with an
 * empty permission list would otherwise be able to empty the bucket. Admins
 * qualify outright; vendors and staff need a product-management grant.
 */
export async function canManageStoreMedia(
  user: MinimalUser & { id?: string },
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (isVendor(user)) {
    return (
      (await hasVendorPermission(user, VENDOR_PERMISSIONS.MANAGE_PRODUCTS)) ||
      (await hasVendorPermission(user, VENDOR_PERMISSIONS.EDIT_PRODUCTS))
    );
  }

  if (isSeller(user) && user.id) {
    return hasAnyStaffPermission(user.id, [
      STAFF_PERMISSIONS.MANAGE_PRODUCTS,
      STAFF_PERMISSIONS.EDIT_PRODUCTS,
    ]);
  }

  return false;
}

/**
 * May this caller move money back to a shopper?
 *
 * The answer is who the merchant of record is, not who holds a grant. Eighty7Nexus
 * collects on the platform's OWN gateway credentials — `lib/order-refund.ts`
 * reads `settings.payment.*` and never a vendor's — so a refund a vendor issues
 * spends the platform's money, and a refund they merely RECORD (`manual: true`)
 * flips an order to `refunded` while no money moves at all. Neither is theirs to
 * decide.
 *
 * This is the single enforcement point for `ADMIN_PERMISSIONS.MANAGE_REFUNDS`,
 * and it is deliberately narrower than a permission check: the capability is
 * scoped to the admin ROLE, so no vendor grant, staff grant or per-admin
 * permission list can widen or narrow it. Everything else in the return
 * workflow — approve, reject, receive, inspect, restock — stays with whoever
 * owns the items.
 *
 * Synchronous and role-only on purpose. Every refund path calls it before
 * touching a gateway, and a guard that can fail open on a database read is not
 * a guard.
 */
export function canIssueRefunds(
  // Widened past `MinimalUser` so a route can hand its session straight in:
  // the auth session types `role` as a bare string. The cast is safe because
  // `hasRole` compares strings, and going through `isAdmin` rather than
  // re-testing the role here keeps one implementation of what "admin" means.
  user: { role?: string | null; roles?: readonly string[] | null } | null | undefined,
): boolean {
  return isAdmin(user as MinimalUser);
}

/**
 * Marketplace-wide vendor policy: one boolean per capability pack.
 *
 * Kept as a named export because callers outside the permission path read it
 * for display. The authority for "does this flag gate this permission" is
 * `lib/vendor-permissions.ts` — this only loads the flags.
 */
export async function getVendorPermissions(): Promise<VendorPackPolicy> {
  try {
    const { getSettings } = await import("@/models/settings.model");
    return readVendorPolicyFlags(await getSettings());
  } catch {
    // Settings unreadable: fall back to the schema defaults, which are all
    // true. A store must not lock every vendor out because a read failed.
    return readVendorPolicyFlags(null);
  }
}

/**
 * Check if a vendor holds a permission.
 *
 * Thin by design: the four layers, the implication table and the policy mapping
 * all live in `lib/vendor-permissions.ts`, so this and the admin Access tab
 * cannot drift apart the way the two hand-kept alias maps did.
 *
 * Admins bypass it entirely.
 */
export async function hasVendorPermission(
  user: MinimalUser,
  permission: VendorPermission,
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!isVendor(user) || !user.id) return false;

  const { loadVendorAccess } = await import("@/lib/vendor-permissions");
  const access = await loadVendorAccess(user.id);
  return access ? access.has(permission) : false;
}

/**
 * Check if user can access POS (based on role and settings)
 */
export async function canAccessPOS(
  user: MinimalUser,
): Promise<boolean> {
  if (!user) return false;

  try {
    const { getSettings } = await import("@/models/settings.model");
    const settings = await getSettings();

    if (!settings.pos?.enabled) return false;

    if (isAdmin(user) && (settings.pos.allowAdminSales ?? true)) return true;
    if (isVendor(user) && (settings.pos.allowVendorSales ?? true)) return true;
    if (isSeller(user) && settings.pos.allowSellerSales) {
      if (!user.id) return false;
      const profile = await getStaffProfile(user.id);
      if (!profile?.isActive) return false;
      return profile.permissions.includes(STAFF_PERMISSIONS.ACCESS_POS);
    }

    return false;
  } catch {
    return false;
  }
}

// ============================================
// Staff Permission Checking
// ============================================

/**
 * Get staff profile with permissions
 */
export async function getStaffProfile(
  userId: string,
): Promise<IStaffProfile | null> {
  try {
    const profile = await StaffProfile.findOne({ userId });
    return profile;
  } catch {
    return null;
  }
}

/**
 * Check if staff user has a specific permission
 */
export async function hasStaffPermission(
  userId: string,
  permission: StaffPermission,
): Promise<boolean> {
  // Admins have all staff permissions
  const profile = await getStaffProfile(userId);
  if (!profile || !profile.isActive) return false;
  return profile.permissions.includes(permission);
}

/**
 * Check if staff user has any of the specified permissions
 */
export async function hasAnyStaffPermission(
  userId: string,
  permissions: StaffPermission[],
): Promise<boolean> {
  const profile = await getStaffProfile(userId);
  if (!profile || !profile.isActive) return false;
  return permissions.some((p) => profile.permissions.includes(p));
}

// ============================================
// Exports for convenience
// ============================================

export { ADMIN_PERMISSIONS, VENDOR_PERMISSIONS, STAFF_PERMISSIONS };
export type { AdminPermission, VendorPermission, StaffPermission };
