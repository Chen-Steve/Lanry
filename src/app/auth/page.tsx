'use client';

import { useAuth } from './_hooks/useAuth';
import { AuthForm } from './_components/AuthForm';

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
    <div className="fixed inset-0 md:static h-[100dvh] md:h-[calc(100vh-28rem)] flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-[min(100%,24rem)] -mt-12 md:mt-0 space-y-4 md:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-black">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-2 rounded-md text-sm animate-fadeIn">
            {error}
          </div>
        )}

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
          className="w-full text-center text-black hover:text-gray-600 text-sm sm:text-base py-1 md:py-2 font-medium"
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}