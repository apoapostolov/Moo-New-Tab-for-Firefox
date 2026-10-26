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
      if (file.size > MAX_BACKUP_BYTES) throw new Error('This backup is too large to open.');
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
      setError(`Nothing was imported. ${error.message}`);
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
            {selection.preview.summary.settings} {uiText('settings_3cc1d5')}
            {selection.preview.summary.notes !== null
              ? ` and ${selection.preview.summary.notes} notes`
              : ''}{' '}
            {uiText('are_ready_to_import_f985c4')}
          </p>
          {selection.preview.summary.scratchImages !== null && (
            <p>
              {uiText('the_backup_will_replace_your_scratch_pictures_a36392')}{' '}
              {selection.preview.summary.scratchImages} {uiText('pictures_938a09')}
            </p>
          )}
          <p>
            {selection.preview.summary.backgrounds === null
              ? 'Your picture collection will stay as it is.'
              : `The backup will replace your picture collection with ${selection.preview.summary.backgrounds} pictures.`}{' '}
            {uiText('settings_included_in_the_file_replace_their_c_887b24')}
          </p>
          {selection.preview.skipped.length > 0 && (
            <p>
              {selection.preview.skipped.length}{' '}
              {uiText('private_temporary_or_unrecognised_entries_wil_b7da06')}
            </p>
          )}
          <div className="resetDataButtonsLayout">
            <Button
              label={busy ? 'Importing…' : 'Import this backup'}
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
