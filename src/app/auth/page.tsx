'use client';

import { useAuth } from './_hooks/useAuth';
import { AuthForm } from './_components/AuthForm';
import { GoogleSignInButton } from './_components/GoogleSignInButton';
import { toast } from 'react-hot-toast';

export default function AuthPage() {
  const {
    mode,
    credentials,
    error,
    loading,
    emailError,
    setCredentials,
    handleSubmit,
    resetForm,
    validateEmail
  } = useAuth();

  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[min(100%,20rem)] space-y-3 md:space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-foreground">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-2 rounded-md text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <GoogleSignInButton 
          onClick={() => toast.success('Coming Soon!')}
          loading={false}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or continue with email</span>
          </div>
        </div>

        <AuthForm
          mode={mode}
          credentials={credentials}
          error={error}
          emailError={emailError}
          loading={loading}
          onSubmit={handleSubmit}
          onEmailChange={(email) => setCredentials({ ...credentials, email })}
          onPasswordChange={(password) => setCredentials({ ...credentials, password })}
          onConfirmPasswordChange={(confirmPassword) => 
            setCredentials({ ...credentials, confirmPassword })
          }
          validateEmail={validateEmail}
        />

        <button
          type="button"
          onClick={resetForm}
          className="w-full text-center text-foreground hover:text-muted-foreground text-sm py-1 font-medium"
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}