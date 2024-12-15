import { PasswordInput } from './PasswordInput';
import { useState } from 'react';

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
);

interface AuthFormProps {
  mode: 'signin' | 'signup';
  credentials: {
    email: string;
    password: string;
    confirmPassword: string;
  };
  error: string;
  emailError: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  validateEmail: (email: string) => boolean;
}

export function AuthForm({
  mode,
  credentials,
  emailError,
  loading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  validateEmail
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <input
          title="Email"
          type="email"
          value={credentials.email}
          onChange={(e) => {
            onEmailChange(e.target.value);
            validateEmail(e.target.value);
          }}
          className={`text-black w-full p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-base
            ${emailError ? 'border-red-500' : ''}`}
          placeholder="Email"
          required
        />
        {emailError && (
          <p className="text-red-500 text-xs mt-1">{emailError}</p>
        )}
      </div>

      <PasswordInput
        value={credentials.password}
        onChange={onPasswordChange}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        showStrength={mode === 'signup'}
      />

      {mode === 'signup' && (
        <PasswordInput
          value={credentials.confirmPassword}
          onChange={onConfirmPasswordChange}
          placeholder="Confirm Password"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full p-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 
          disabled:cursor-not-allowed text-base font-medium flex items-center justify-center gap-2 
          active:transform active:scale-[0.98] transition-transform"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span>Loading...</span>
          </>
        ) : (
          mode === 'signin' ? 'Sign In' : 'Sign Up'
        )}
      </button>
    </form>
  );
} 