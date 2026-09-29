import { actor, audit, db, mockRequest, requirePermission } from '@/shared/lib/mock';
import type { AppSettings } from '@/shared/types';

export type SettingsSection = keyof AppSettings;

// GET /api/settings  (readable by every authenticated user — needed for task rules)
export const getSettings = () =>
  mockRequest(() => {
    actor();
    return db.settings;
  }, 200);

// PUT /api/settings/:section
export const updateSettings = <S extends SettingsSection>(section: S, values: AppSettings[S]) =>
  mockRequest(() => {
    const me = requirePermission('settings.manage');
    const old = db.settings[section];
    db.settings = { ...db.settings, [section]: { ...old, ...values } };
    audit({
      actorId: me.id,
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: section,
      entityLabel: `${section[0].toUpperCase()}${section.slice(1)} settings`,
      oldValue: { ...old },
      newValue: { ...db.settings[section] },
    });
    return db.settings;
  });
