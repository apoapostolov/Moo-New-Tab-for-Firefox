import { useId } from 'react';
import './Settings/Text/Text.scss';

/** Controlled fields share the same surface, sizing and focus styles as settings Text. */
export default function Field({ label, multiline, children, className = '', ...props }) {
  const id = useId();
  return (
    <div className={`text-field-container text-field-wide ${className}`}>
      <div className="text-field">
        <label className="text-field-label" htmlFor={id}>
          {label}
        </label>
        {children ? (
          <select id={id} className="text-field-input" {...props}>
            {children}
          </select>
        ) : multiline ? (
          <textarea id={id} className="text-field-textarea" {...props} />
        ) : (
          <input type="text" id={id} className="text-field-input" {...props} />
        )}
      </div>
    </div>
  );
}
