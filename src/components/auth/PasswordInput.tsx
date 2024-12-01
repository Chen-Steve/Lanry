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
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strengthColors[strength]} ${strengthWidth[strength]} transition-all duration-300`}
        />
      </div>
      <p className={`text-xs mt-1 text-black`}>
        {strength === 'weak' && 'Weak - Add numbers, special characters, and mix cases'}
        {strength === 'medium' && 'Medium - Add more complexity for a stronger password'}
        {strength === 'strong' && 'Strong password!'}
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

export const PasswordInput = ({
  value,
  onChange,
  placeholder = "Password",
  showPassword,
  onTogglePassword,
  showStrength = false
}: PasswordInputProps) => (
  <div>
    <div className="relative">
      <input
        title={placeholder}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-black w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
        placeholder={placeholder}
        required
        minLength={6}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="wabsolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-700"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        <Icon 
          icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
          className="text-xl"
          aria-hidden="true"
        />
      </button>
    </div>
    {showStrength && value && (
      <PasswordStrengthIndicator password={value} />
    )}
  </div>
); 