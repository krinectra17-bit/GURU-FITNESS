import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-gym-muted">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        <div className="bg-gym-card border border-gym-border rounded-xl p-8 shadow-2xl">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-display font-bold text-xl text-white uppercase">
                Recovery Link Sent
              </h3>
              <p className="text-xs text-gray-300">
                If an account exists for <strong>{email}</strong>, a secure password reset link has been dispatched. You can also contact front desk support at 9828482505.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs text-gym-red hover:underline font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gym-muted absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. member@gurufitness.com"
                    className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-gym-red/25 transition flex items-center justify-center space-x-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-gym-muted hover:text-white transition"
                >
                  Cancel and Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
