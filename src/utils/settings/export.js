import { pendingDrafts } from '../durableWriter';
import { saveFile } from 'utils/saveFile';
import {
  getAllBackgroundsWithMetadata,
  readScratchAssets,
  migrateScratchAssets,
} from '../customBackgroundDB';
import { BACKUP_FORMAT, BACKUP_VERSION, validateSettings } from './backupSchema';
export async function createBackup(includeImages = false) {
  await migrateScratchAssets();
  const source = Object.fromEntries(
    Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]),
  );
  Object.assign(source, pendingDrafts());
  if (!includeImages) {
    delete source.scratchImagesData;
    if (source.favourite?.includes('data:')) delete source.favourite;
  }
  const { settings } = validateSettings(source);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    settings,
    ...(includeImages
      ? {
          assets: {
            backgrounds: await getAllBackgroundsWithMetadata(),
            scratchImages: await readScratchAssets(),
          },
        }
      : {}),
  };
}
export async function exportSettings(includeImages = false) {
  const backup = await createBackup(includeImages);
  saveFile(backup, `moo-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
}
