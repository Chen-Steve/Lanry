import { PasswordInput } from './PasswordInput';
import { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

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
  onSubmit: (e: React.FormEvent, captchaToken?: string) => Promise<void>;
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
  const [captchaToken, setCaptchaToken] = useState<string>();
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup' && !captchaToken) {
      // Execute hCaptcha when the form is submitted without a token
      captchaRef.current?.execute();
      return;
    }

    await onSubmit(e, captchaToken);
    
    // Reset the captcha after submission
    if (mode === 'signup') {
      setCaptchaToken(undefined);
      captchaRef.current?.resetCaptcha();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <input
          title="Email"
          type="email"
          value={credentials.email}
          onChange={(e) => {
            onEmailChange(e.target.value);
            validateEmail(e.target.value);
          }}
          className={`w-full p-4 bg-background border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground text-base
            ${emailError ? 'border-red-500 dark:border-red-400' : 'border-border'}`}
          placeholder="Email"
          required
        />
        {emailError && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">{emailError}</p>
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
        <>
          <PasswordInput
            value={credentials.confirmPassword}
            onChange={onConfirmPasswordChange}
            placeholder="Confirm Password"
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          
          <div className="flex justify-center">
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_SUPABASE_HCAPTCHA_SITE_KEY || ''}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(undefined)}
              size="invisible"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 
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