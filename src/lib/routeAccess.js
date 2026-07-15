import { NAV_BY_ROLE, SUB_NAV_BY_ROLE } from "@/components/layout/RoleLayout";

// Routes that exist in App.jsx but aren't in any role's sidebar nav.
const EXTRA_ACCESS = {
  "/bus-fee-report": ["finance", "consultant"],
  "/student-receipt": ["finance", "consultant"],
};

function buildRouteAccess() {
  const map = {};

  const addPath = (path, role) => {
    if (!map[path]) map[path] = [];
    if (!map[path].includes(role)) map[path].push(role);
  };

  Object.entries(NAV_BY_ROLE).forEach(([role, items]) => {
    items.forEach(({ path }) => addPath(path, role));
  });

  Object.entries(SUB_NAV_BY_ROLE).forEach(([role, items]) => {
    items.forEach(({ path }) => addPath(path, role));
  });

  Object.entries(EXTRA_ACCESS).forEach(([path, roles]) => {
    roles.forEach((role) => addPath(path, role));
  });

  return map;
}

export const ROUTE_ACCESS = buildRouteAccess();

// The dashboard at "/" is always allowed for any logged-in non-student role;
// every other path must be explicitly granted, so an unmapped path is denied.
export function isRouteAllowed(pathname, role) {
  if (pathname === "/") return true;
  return Boolean(ROUTE_ACCESS[pathname]?.includes(role));
}
