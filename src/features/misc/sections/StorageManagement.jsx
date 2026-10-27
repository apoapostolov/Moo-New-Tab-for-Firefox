import { withProfileLock } from 'utils/settings/profile';
import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useEffect, useState } from 'react';
import { readScratchAssets, patchScratchAssets } from 'utils/customBackgroundDB';
import { Button } from 'components/Elements';
export default function StorageManagement() {
  useTranslationVersion();
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    readScratchAssets()
      .then((value) => {
        if (active) setImages(value);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    navigator.storage
      ?.estimate?.()
      .then((value) => {
        if (active) setEstimate(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function remove() {
    setBusy(true);
    try {
      setImages(await withProfileLock(() => patchScratchAssets({ removed: selected })));
      setSelected([]);
      window.location.reload();
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  const mb = (value) => `${(value / 1024 / 1024).toFixed(1)} MB`;
  return (
    <details>
      <summary>{uiText('manage_saved_pictures_f4518f')}</summary>
      {estimate && (
        <p>
          {uiText('storage_used_sentence', { used: mb(estimate.usage), total: mb(estimate.quota) })}
        </p>
      )}
      <p>{uiText('scratch_pictures_stay_until_you_remove_them_b_77cf6e')}</p>
      <div className="storedPictures">
        {images.map((image) => (
          <label key={image.id}>
            <input
              type="checkbox"
              checked={selected.includes(image.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, image.id]
                    : current.filter((id) => id !== image.id),
                )
              }
            />
            <img src={image.src} alt="Scratch picture" />
          </label>
        ))}
      </div>
      <Button
        label={`Remove ${selected.length} selected pictures`}
        disabled={busy || !selected.length}
        onClick={remove}
      />
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
