import { supabase } from '../supabaseClient';
import { normalizeRole, resolveRole, toStoredRole } from './roles';

const PROFILE_TABLES = ['profiles', 'Profile'];

let cachedProfileTable = null;

const getTableCandidates = (preferredTable) => [
  ...new Set([preferredTable, cachedProfileTable, ...PROFILE_TABLES].filter(Boolean)),
];

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeUsername = (value, email = '', id = '') => {
  const candidate = String(value || '').trim();
  if (candidate) return candidate;

  const emailPrefix = normalizeEmail(email).replace(/@.*/, '');
  if (emailPrefix) return emailPrefix;

  return String(id || '').slice(0, 8);
};

export const mapProfileRecord = (row) => {
  const email = normalizeEmail(row?.email);

  return {
    id: row?.id || null,
    email,
    role: resolveRole(row?.role, email),
    rawRole: row?.role ?? null,
    username: normalizeUsername(row?.username, email, row?.id),
    isActive: row?.is_active ?? true,
    createdAt: row?.created_at || null,
  };
};

async function resolveProfileTable(preferredTable) {
  const tableCandidates = getTableCandidates(preferredTable);
  let lastError = null;

  for (const table of tableCandidates) {
    const { error } = await supabase.from(table).select('id').limit(1);

    if (!error) {
      cachedProfileTable = table;
      return table;
    }

    lastError = error;
  }

  throw lastError || new Error('Tabel profil tidak ditemukan.');
}

export async function getProfileById(userId, preferredTable) {
  if (!userId) return { profile: null, table: preferredTable || cachedProfileTable || null };

  const tableCandidates = getTableCandidates(preferredTable);
  let fallbackTable = null;
  let lastError = null;

  for (const table of tableCandidates) {
    const { data, error } = await supabase.from(table).select('*').eq('id', userId).maybeSingle();

    if (!error && data) {
      cachedProfileTable = table;
      return { profile: mapProfileRecord(data), table };
    }

    if (!error) {
      fallbackTable = table;
      continue;
    }

    lastError = error;
  }

  return {
    profile: null,
    table: fallbackTable || cachedProfileTable || preferredTable || null,
    error: lastError,
  };
}

export async function listProfiles(preferredTable) {
  const tableCandidates = getTableCandidates(preferredTable);
  let fallbackResult = null;
  let lastError = null;

  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('email', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      cachedProfileTable = table;
      return { profiles: data.map(mapProfileRecord), table };
    }

    if (!error) {
      fallbackResult = { profiles: [], table };
      continue;
    }

    lastError = error;
  }

  if (fallbackResult) {
    cachedProfileTable = fallbackResult.table;
    return fallbackResult;
  }

  throw lastError || new Error('Gagal memuat data user.');
}

function buildProfilePayload(patch, table) {
  const payload = {};

  Object.entries(patch || {}).forEach(([key, value]) => {
    if (value === undefined) return;

    if (key === 'role') {
      payload.role = toStoredRole(value, table);
      return;
    }

    if (key === 'email') {
      payload.email = normalizeEmail(value);
      return;
    }

    if (key === 'username') {
      payload.username = normalizeRole(value).replace(/\s+/g, '');
      return;
    }

    payload[key] = value;
  });

  return payload;
}

export async function updateProfileRecord(id, patch, preferredTable) {
  const table = await resolveProfileTable(preferredTable);
  const payload = buildProfilePayload(patch, table);
  const { error } = await supabase.from(table).update(payload).eq('id', id);

  if (error) throw error;

  return { table };
}

export async function upsertProfileRecord(record, preferredTable) {
  const table = await resolveProfileTable(preferredTable);
  const payload = buildProfilePayload(record, table);
  const { error } = await supabase.from(table).upsert(payload);

  if (error) throw error;

  return { table };
}
