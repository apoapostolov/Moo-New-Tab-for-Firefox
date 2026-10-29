import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import Modal from 'react-modal';
import CountdownForm from './CountdownForm';

export default function CountdownModal({ initial, onSave, onClose }) {
  useTranslationVersion();
  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      contentLabel={initial?.id ? uiText('countdown_edit') : uiText('countdown_add')}
      className="featureDialog"
      overlayClassName="Overlay"
      ariaHideApp
    >
      <h2>{initial?.id ? uiText('countdown_edit') : uiText('countdown_add')}</h2>
      <CountdownForm initial={initial} onSave={onSave} onCancel={onClose} />
    </Modal>
  );
}
