import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import supabase from '@/lib/supabaseClient';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AuthError {
  message: string;
  status?: number;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError(null);
      onSuccess?.();
      onClose();
    },
    onError: (error: AuthError) => {
      setPasswordError(error.message || 'Failed to change password');
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-background rounded-lg shadow-lg overflow-y-auto"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Change Password</h2>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-md"
                    aria-label="Close modal"
                  >
                    <Icon icon="ph:x-bold" className="w-5 h-5" />
                  </button>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      setPasswordError('New passwords do not match');
                      return;
                    }
                    if (passwordForm.newPassword.length < 6) {
                      setPasswordError('Password must be at least 6 characters long');
                      return;
                    }
                    try {
                      await passwordMutation.mutateAsync({
                        newPassword: passwordForm.newPassword
                      });
                    } catch {
                      // Error is handled by the mutation
                    }
                  }}
                >
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium block">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background text-base"
                      required
                      minLength={6}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium block">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background text-base"
                      required
                      placeholder="Confirm new password"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive mt-2">{passwordError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="w-full px-4 py-2.5 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {passwordMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Icon icon="ph:circle-notch" className="w-4 h-4 animate-spin" />
                        Changing Password...
                      </span>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
} 