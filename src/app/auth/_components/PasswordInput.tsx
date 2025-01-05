import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  showStrength?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  showPassword,
  onTogglePassword,
  showStrength = false,
}: PasswordInputProps) {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (showStrength) {
      let newStrength = 0;
      if (value.length >= 8) newStrength++;
      if (/[A-Z]/.test(value)) newStrength++;
      if (/[a-z]/.test(value)) newStrength++;
      if (/[0-9]/.test(value)) newStrength++;
      if (/[^A-Za-z0-9]/.test(value)) newStrength++;
      setStrength(newStrength);
    }
  }, [value, showStrength]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          title={placeholder}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground text-base"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <Icon
            icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'}
            className="text-xl"
          />
        </button>
      </div>

      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength
                    ? strength <= 2
                      ? 'bg-red-500 dark:bg-red-400'
                      : strength <= 3
                      ? 'bg-yellow-500 dark:bg-yellow-400'
                      : 'bg-green-500 dark:bg-green-400'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {strength <= 2
              ? 'Weak password'
              : strength <= 3
              ? 'Medium password'
              : 'Strong password'}
          </p>
        </div>
      )}
    </div>
  );
} 