import { Icon } from '@iconify/react';

type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  // Number check
  if (/\d/.test(password)) score++;
  
  // Uppercase and lowercase check
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  
  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  };

  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full'
  };

  return (
    <div className="mt-3 md:mt-2">
      <div className="h-2 md:h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strengthColors[strength]} ${strengthWidth[strength]} transition-all duration-300`}
        />
      </div>
      <p className={`text-sm md:text-xs mt-2 text-black`}>
        {strength === 'weak' && (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="text-red-500" />
            Add numbers, special characters, and mix cases
          </span>
        )}
        {strength === 'medium' && (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:shield-half-full" className="text-yellow-500" />
            Add more complexity for a stronger password
          </span>
        )}
        {strength === 'strong' && (
          <span className="flex items-center gap-1">
            <Icon icon="mdi:shield-check" className="text-green-500" />
            Strong password!
          </span>
        )}
      </p>
    </div>
  );
};

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
  placeholder = "Password",
  showPassword,
  onTogglePassword,
  showStrength = false,
}: PasswordInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-black w-full p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-base"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 
            text-gray-500 hover:text-black active:text-black
            transition-colors duration-200
            touch-manipulation"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon 
            icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
            className="text-2xl md:text-xl"
            aria-hidden="true"
          />
        </button>
      </div>
      {showStrength && value && (
        <PasswordStrengthIndicator password={value} />
      )}
    </div>
  );
} 