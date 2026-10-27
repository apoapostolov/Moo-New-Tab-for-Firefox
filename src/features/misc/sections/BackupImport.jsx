import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useRef, useState } from 'react';
import { importSettings } from 'utils/settings';
import { prepareBackup, MAX_BACKUP_BYTES } from 'utils/settings/backupSchema';
import { Button } from 'components/Elements';

export default function BackupImport({ onImported = () => window.location.reload() }) {
  useTranslationVersion();
  const input = useRef(null);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setSelection(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error(uiText('backup_too_large'));
      const source = await file.text();
      setSelection({ source, preview: prepareBackup(source) });
    } catch (error) {
      setError(error.message);
    }
  }
  async function apply() {
    setBusy(true);
    setError('');
    try {
      const backup = await importSettings(selection.source);
      onImported(backup);
      setSelection(null);
    } catch (error) {
      setError(uiText('backup_none_imported', { error: error.message }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="backupImport">
      <input ref={input} type="file" accept="application/json,.json" hidden onChange={choose} />
      <Button
        label={uiText('choose_a_backup_2fbfb0')}
        disabled={busy}
        onClick={() => input.current.click()}
      />
      {selection && (
        <section aria-label={uiText('backup_preview_2c8a58')}>
          <p>
            {selection.preview.summary.notes === null
              ? uiText('backup_settings_ready', { settings: selection.preview.summary.settings })
              : uiText('backup_settings_notes_ready', {
                  settings: selection.preview.summary.settings,
                  notes: selection.preview.summary.notes,
                })}
          </p>
          {selection.preview.summary.scratchImages !== null && (
            <p>
              {uiText('backup_scratch_count', { count: selection.preview.summary.scratchImages })}
            </p>
          )}
          <p>
            {selection.preview.summary.backgrounds === null
              ? uiText('backup_backgrounds_unchanged')
              : uiText('backup_backgrounds_count', {
                  count: selection.preview.summary.backgrounds,
                })}{' '}
            {uiText('settings_included_in_the_file_replace_their_c_887b24')}
          </p>
          {selection.preview.skipped.length > 0 && (
            <p>{uiText('backup_skipped_count', { count: selection.preview.skipped.length })}</p>
          )}
          <div className="resetDataButtonsLayout">
            <Button
              label={busy ? uiText('backup_importing') : uiText('backup_import_action')}
              disabled={busy}
              onClick={apply}
            />
            <Button
              label={uiText('cancel_77dfd2')}
              disabled={busy}
              onClick={() => setSelection(null)}
            />
          </div>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
