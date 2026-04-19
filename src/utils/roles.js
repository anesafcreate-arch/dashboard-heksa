export const normalizeRole = (role) => String(role || '').toLowerCase().trim();

export const isManagerRole = (role) => normalizeRole(role).startsWith('manager');

export const roleMatches = (role, allowedRole) => {
  const roleKey = normalizeRole(role);
  const allowedKey = normalizeRole(allowedRole);

  if (allowedKey === 'manager') {
    return isManagerRole(roleKey);
  }

  return roleKey === allowedKey;
};

export const isRoleAllowed = (role, allowedRoles = []) =>
  Array.isArray(allowedRoles) && allowedRoles.some((allowedRole) => roleMatches(role, allowedRole));

export const getRoleGroup = (role) => {
  const roleKey = normalizeRole(role);
  return isManagerRole(roleKey) ? 'manager' : roleKey;
};
