import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { MdEdit, MdDelete } from 'react-icons/md';
import { isBrandIcon } from 'utils/brandIcons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from './DragHandle';

export const SortableItem = ({ value, enabled, startEditLink, deleteLink }) => {
  useTranslationVersion();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: value.key,
    disabled: !enabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIconUrl = (item) => {
    return (
      item.icon ||
      'https://icon.horse/icon/' + item.url.replace('https://', '').replace('http://', '')
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`quicklink-item ${!enabled ? 'disabled' : ''}`}
      role="listitem"
    >
      <DragHandle />
      <div className="quicklink-icon">
        <img
          src={getIconUrl(value)}
          alt={value.name}
          className={isBrandIcon(value.icon) ? 'brandIcon' : undefined}
          draggable={false}
        />
      </div>
      <div className="quicklink-content">
        <div className="quicklink-name">{value.name}</div>
        <div className="quicklink-url">{value.url}</div>
      </div>
      <div className="quicklink-actions">
        <button
          className="quicklink-action-btn"
          onClick={(e) => {
            if (!enabled) return;
            e.stopPropagation();
            startEditLink(value);
          }}
          title={uiText('edit_530164')}
          disabled={!enabled}
          aria-disabled={!enabled}
        >
          <MdEdit />
          <span>{uiText('edit_530164')}</span>
        </button>
        <button
          className="quicklink-action-btn quicklink-remove-btn"
          onClick={(e) => {
            if (!enabled) return;
            e.stopPropagation();
            deleteLink(value.key, e);
          }}
          title={uiText('remove_e96390')}
          disabled={!enabled}
          aria-disabled={!enabled}
        >
          <MdDelete />
          <span>{uiText('remove_e96390')}</span>
        </button>
      </div>
    </div>
  );
};
