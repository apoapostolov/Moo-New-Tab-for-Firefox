import defaults from '../data/default_settings.json';
import { prepareBackup } from './backupSchema';
import { changeProfile } from './profile';
export async function importSettings(source) {
  const backup = prepareBackup(source);
  await changeProfile(
    (previous) => ({
      ...Object.fromEntries(defaults.map(({ name, value }) => [name, String(value)])),
      ...previous,
      ...backup.settings,
      firstRun: 'true',
      ...(backup.backgrounds !== undefined
        ? {
            customBackgroundMigrated: 'true',
            customBackgroundCount: String(backup.backgrounds.length),
          }
        : {}),
    }),
    backup.backgrounds,
    backup.scratchImages,
  );
  return backup;
}
