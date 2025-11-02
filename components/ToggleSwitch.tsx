import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, description, id }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-4">
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-xs text-[var(--text-muted)] mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] ${
          checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
