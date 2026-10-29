import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState, useEffect, useRef } from 'react';
import { MdAddLink, MdLinkOff } from 'react-icons/md';
import { arrayMove } from '@dnd-kit/sortable';
import { Row, Content, Action } from 'components/Layout/Settings';

import { Button } from 'components/Elements';
import Modal from 'react-modal';

import { AddModal } from 'components/Elements/AddModal';

import { SortableList } from './components';
import { readQuicklinks } from './utils/quicklinksUtils';

import EventBus from 'utils/eventbus';
import { getTitleFromUrl, isValidUrl } from 'utils/links';

const QuickLinksListEditor = ({ storageKey = 'quicklinks', title }) => {
  useTranslationVersion();
  const [items, setItems] = useState(readQuicklinks(storageKey));
  const [showAddModal, setShowAddModal] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [iconError, setIconError] = useState('');
  const [edit, setEdit] = useState(false);
  const [editData, setEditData] = useState('');
  const enabled = true;
  const profileRevision = useRef(localStorage.getItem('profileRevision'));

  const deleteLink = (key, event) => {
    event.preventDefault();

    const stored = readQuicklinks(storageKey);
    const data = stored.filter((i) => i.key !== key);
    localStorage.setItem(storageKey, JSON.stringify(data));
    setItems(data);
    variables.stats.postEvent('feature', 'Quicklink delete');
    EventBus.emit('refresh', 'quicklinks');
  };

  const addLink = async (name, url, icon) => {
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (url.length <= 0 || isValidUrl(url) === false) {
      setUrlError(variables.getMessage('widgets.quicklinks.url_error'));
      return;
    }

    if (icon.length > 0 && isValidUrl(icon) === false) {
      setIconError(variables.getMessage('widgets.quicklinks.url_error'));
      return;
    }

    const newItem = {
      name: name || (await getTitleFromUrl(url)),
      url,
      icon: icon || '',
      key: Date.now().toString() + Math.random().toString(36).substring(2),
    };

    if (profileRevision.current !== localStorage.getItem('profileRevision')) return;
    const data = [...readQuicklinks(storageKey), newItem];

    localStorage.setItem(storageKey, JSON.stringify(data));
    setItems(data);
    setShowAddModal(false);
    setUrlError('');
    setIconError('');
    variables.stats.postEvent('feature', 'Quicklink add');
    EventBus.emit('refresh', 'quicklinks');
  };

  const startEditLink = (data) => {
    setEdit(true);
    setEditData(data);
    setShowAddModal(true);
  };

  const editLink = async (og, name, url, icon) => {
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!isValidUrl(url)) return setUrlError(variables.getMessage('widgets.quicklinks.url_error'));
    if (icon && !isValidUrl(icon))
      return setIconError(variables.getMessage('widgets.quicklinks.url_error'));
    const resolvedName = name || (await getTitleFromUrl(url));
    if (profileRevision.current !== localStorage.getItem('profileRevision')) return;
    const data = readQuicklinks(storageKey);
    const dataobj = data.find((i) => i.key === og.key);
    if (!dataobj) return;

    dataobj.name = resolvedName;
    dataobj.url = url;
    dataobj.icon = icon || '';

    localStorage.setItem(storageKey, JSON.stringify(data));
    setItems(data);
    setShowAddModal(false);
    setEdit(false);
    EventBus.emit('refresh', 'quicklinks');
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || !enabled) return;
    if (active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.key === active.id);
    const newIndex = items.findIndex((item) => item.key === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);

    setItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
    EventBus.emit('refresh', 'quicklinks');
  };

  useEffect(() => {
    const sync = () => setItems(readQuicklinks(storageKey));
    EventBus.on('refresh', sync);
    window.addEventListener('storage', sync);
    return () => {
      EventBus.off('refresh', sync);
      window.removeEventListener('storage', sync);
    };
  }, [storageKey]);
  const QUICKLINKS_SECTION = 'modals.main.settings.sections.quicklinks';

  const AddLink = () => (
    <Row final={true}>
      <Content title={title} />
      <Action>
        <Button
          type="settings"
          onClick={() => {
            setEdit(false);
            setEditData('');
            setShowAddModal(true);
          }}
          icon={<MdAddLink />}
          label={variables.getMessage(`${QUICKLINKS_SECTION}.add_link`)}
          disabled={!enabled}
        />
      </Action>
    </Row>
  );

  return (
    <section className="quicklinksListEditor" aria-label={title}>
      {AddLink()}

      {items.length === 0 && (
        <div className="photosEmpty">
          <div className="emptyNewMessage">
            <MdLinkOff />
            <span className="title">
              {variables.getMessage(`${QUICKLINKS_SECTION}.no_quicklinks`)}
            </span>
            <span className="subtitle">
              {variables.getMessage('modals.main.settings.sections.message.add_some')}
            </span>
            <Button
              type="settings"
              onClick={() => setShowAddModal(true)}
              icon={<MdAddLink />}
              label={variables.getMessage(`${QUICKLINKS_SECTION}.add_link`)}
            />
          </div>
        </div>
      )}

      <div className="quicklinks-container">
        <div className={`messagesContainer ${!enabled ? 'disabled' : ''}`}>
          <SortableList
            items={items}
            enabled={enabled}
            onDragEnd={handleDragEnd}
            startEditLink={(data) => startEditLink(data)}
            deleteLink={(key, e) => deleteLink(key, e)}
          />
        </div>
      </div>

      <Modal
        closeTimeoutMS={100}
        onRequestClose={() => {
          setShowAddModal(false);
          setEdit(false);
          setUrlError('');
          setIconError('');
        }}
        isOpen={showAddModal}
        className="Modal resetmodal mainModal"
        overlayClassName="Overlay resetoverlay"
        ariaHideApp={true}
      >
        <AddModal
          urlError={urlError}
          iconError={iconError}
          addLink={(name, url, icon) => addLink(name, url, icon)}
          editLink={(og, name, url, icon) => editLink(og, name, url, icon)}
          edit={edit}
          editData={editData}
          closeModal={() => {
            setShowAddModal(false);
            setUrlError('');
            setIconError('');
            setEdit(false);
          }}
        />
      </Modal>
    </section>
  );
};

export default QuickLinksListEditor;
