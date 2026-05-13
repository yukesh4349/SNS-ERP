export const APP_ROLES = [
  'admin',
  'superadmin',
  'leader',
  'teacher',
  'parent',
] as const;

export type AppRole = (typeof APP_ROLES)[number];
