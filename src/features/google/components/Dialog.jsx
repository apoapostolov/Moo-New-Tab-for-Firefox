import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shell for the widget forms. A real `<dialog>` opened with showModal() so it lands in the top
 * layer: the cards' backdrop-filter paints over any fixed overlay. Rendered into the body because
 * a filtered ancestor becomes the containing block.
 */

const Dialog = ({ title, onClose, children, footer, actions }) => {
  useTranslationVersion();
  const panel = useRef(null);

  useEffect(() => {
    const node = panel.current;

    if (!node) return undefined;

    if (!node.open) {
      // showModal is what moves it to the top layer; the attribute is only a fallback for a
      // browser that refuses it.
      if (typeof node.showModal === 'function') node.showModal();
      else node.setAttribute('open', '');
      node
        .querySelector('.gwDialogBody input:not(:disabled), .gwDialogBody textarea:not(:disabled)')
        ?.focus();
    }

    return () => {
      if (node.open) node.close();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <dialog
      ref={panel}
      className="gwDialog"
      aria-label={title}
      onCancel={(event) => {
        // Escape is handled above, so the native close would race it.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === panel.current) onClose();
      }}
    >
      <header className="gwDialogHead">
        <h3>{title}</h3>
        {actions}
        <button
          type="button"
          className="gwIconButton"
          onClick={onClose}
          aria-label={uiText('close_bbfa77')}
        >
          ×
        </button>
      </header>
      <div className="gwDialogBody">{children}</div>
      {footer && <footer className="gwDialogFoot">{footer}</footer>}
    </dialog>,
    document.body,
  );
};

export default Dialog;
