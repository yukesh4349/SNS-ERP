export const APP_ROLES = [
  'admin',
  'leader',
  'teacher',
  'parent',
  'superadmin',
] as const;

export type AppRole = (typeof APP_ROLES)[number];
