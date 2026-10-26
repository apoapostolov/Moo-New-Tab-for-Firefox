import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';

import { useState, memo } from 'react';
import { MdAddLink, MdClose } from 'react-icons/md';
import { Tooltip } from 'components/Elements';
import { Button } from 'components/Elements';
import { brandIconFor } from 'utils/brandIcons';

/** Add and edit a quick link. Fields carry their own labels, and their styling lives in
 * quicklinks.scss: the settings `.text-field-input` is scoped elsewhere. */
function AddModal({ urlError, iconError, addLink, closeModal, edit, editData, editLink }) {
  useTranslationVersion();
  const [name, setName] = useState(edit ? editData.name : '');
  const [url, setUrl] = useState(edit ? editData.url : '');
  const [icon, setIcon] = useState(edit ? editData.icon : '');
  // The value this dialog wrote itself. Anything else in the field was typed, and
  // typing an icon means the person wants that one, not the one we would suggest.
  const [suggested, setSuggested] = useState('');

  const stripNewlines = (value) => value.replaceAll('\n', '').replaceAll('\r', '');

  // Known sites carry their own mark, so the field arrives filled in. Editing the
  // address of an existing link does not overwrite an icon someone chose.
  const changeUrl = (value) => {
    const next = stripNewlines(value);
    setUrl(next);

    if (icon && icon !== suggested) return;

    const found = brandIconFor(next);

    setIcon(found);
    setSuggested(found);
  };

  // A link without a name or URL cannot be saved, so the button says so before an error line does.
  const incomplete = !name.trim() || !url.trim();

  const submit = (event) => {
    event.preventDefault();

    if (edit) editLink(editData, name, url, icon);
    else addLink(name, url, icon);
  };

  return (
    <form className="addLinkModal" onSubmit={submit}>
      <div className="shareHeader">
        <span className="title">
          {edit
            ? variables.getMessage('widgets.quicklinks.edit')
            : variables.getMessage('widgets.quicklinks.new')}
        </span>
        <Tooltip title={variables.getMessage('modals.welcome.buttons.close')}>
          <div className="close" onClick={() => closeModal()}>
            <MdClose />
          </div>
        </Tooltip>
      </div>

      <div className="linkFields">
        <label className="linkField">
          <span>{variables.getMessage('widgets.quicklinks.name')}</span>
          <input
            type="text"
            autoFocus
            placeholder={uiText('sofia_news_a79eb0')}
            value={name}
            onChange={(e) => setName(stripNewlines(e.target.value))}
          />
        </label>

        <label className="linkField">
          <span>{variables.getMessage('widgets.quicklinks.url')}</span>
          <input
            type="text"
            inputMode="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => changeUrl(e.target.value)}
          />
        </label>

        <label className="linkField">
          <span>{variables.getMessage('widgets.quicklinks.icon')}</span>
          <input
            type="text"
            inputMode="url"
            placeholder="https://example.com/icon.png"
            value={icon}
            onChange={(e) => {
              setIcon(stripNewlines(e.target.value));
              setSuggested('');
            }}
          />
          <small>{variables.getMessage('widgets.quicklinks.icon_hint')}</small>
        </label>
      </div>

      {(urlError || iconError) && (
        <p className="linkError">{[iconError, urlError].filter(Boolean).join(' ')}</p>
      )}

      <div className="addFooter">
        <button type="button" className="linkSecondary" onClick={() => closeModal()}>
          {variables.getMessage('modals.main.settings.buttons.cancel')}
        </button>
        <Button
          type="settings"
          onClick={submit}
          disabled={incomplete}
          icon={<MdAddLink />}
          label={
            edit
              ? variables.getMessage('modals.main.settings.sections.quicklinks.edit')
              : variables.getMessage('widgets.quicklinks.add')
          }
        />
      </div>
    </form>
  );
}

const MemoizedAddModal = memo(AddModal);
export { MemoizedAddModal as default, MemoizedAddModal as AddModal };
