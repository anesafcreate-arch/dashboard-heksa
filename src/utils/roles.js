export const APP_ROLES = ['adminutama', 'direktur', 'manager', 'supervisor', 'admin', 'teknisi'];

export const ROLE_LABELS = {
  adminutama: 'AdminUtama',
  direktur: 'Direktur',
  manager: 'Manager',
  supervisor: 'Supervisor',
  admin: 'Admin',
  teknisi: 'Teknisi',
};

const LEGACY_ROLE_MAP = {
  superadmin: 'adminutama',
  adminutama: 'adminutama',
  direktur: 'direktur',
  manager: 'manager',
  managerkeuangan: 'manager',
  managerpemasaran: 'manager',
  managermutu: 'manager',
  supervisor: 'supervisor',
  admin: 'admin',
  teknisi: 'teknisi',
};

const LEGACY_USER_ROLE_MAP = {
  dian: 'direktur',
  fida: 'direktur',
  uko: 'manager',
  dena: 'supervisor',
  amel: 'admin',
  hilal: 'teknisi',
};

export const normalizeRole = (role) => String(role || '').toLowerCase().trim();

export const resolveRole = (role, email = '') => {
  const roleKey = normalizeRole(role);

  if (APP_ROLES.includes(roleKey)) return roleKey;

  const mappedRole = LEGACY_ROLE_MAP[roleKey];
  if (mappedRole) return mappedRole;

  const username = String(email || '').split('@')[0].toLowerCase().trim();
  return LEGACY_USER_ROLE_MAP[username] || 'teknisi';
};

export const toRoleLabel = (role) => ROLE_LABELS[resolveRole(role)] || 'Teknisi';

export const isSuperAdmin = (role) => resolveRole(role) === 'adminutama';

export const canAccessSettings = (role) => resolveRole(role) === 'adminutama';

export const canManageJadwalOnsite = (role) => {
  const finalRole = resolveRole(role);
  return finalRole === 'adminutama' || finalRole === 'direktur' || finalRole === 'manager';
};

export const roleMatches = (role, allowedRole) => resolveRole(role) === resolveRole(allowedRole);

export const isRoleAllowed = (role, allowedRoles = []) => {
  const finalRole = resolveRole(role);

  if (finalRole === 'adminutama') return true;

  return (
    Array.isArray(allowedRoles) &&
    allowedRoles.some((allowedRole) => roleMatches(finalRole, allowedRole))
  );
};

export const getRoleGroup = (role) => resolveRole(role);
