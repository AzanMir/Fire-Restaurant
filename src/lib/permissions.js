export const ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/orders",
  "/admin/inventory",
  "/admin/menu",
  "/admin/categories",
  "/admin/staff",
  "/admin/suppliers",
  "/admin/reports",
  "/admin/sales",
  "/admin/settings",
  "/admin/profile",
];

export const STAFF_ROUTES = [
  "/staff/dashboard",
  "/staff/orders",
  "/staff/profile",
  "/staff/settings",
];

export function canAccess(role, path) {
  if (role === "admin") return true;
  if (role === "staff") {
    return STAFF_ROUTES.some((r) => path.startsWith(r));
  }
  return false;
}
