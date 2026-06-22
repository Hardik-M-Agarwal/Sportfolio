import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const roles = [
  { value: 'organiser', icon: '🏆', label: 'Organiser', desc: 'Create and manage tournaments' },
  { value: 'captain', icon: '🧢', label: 'Team Captain', desc: 'Register your team and track matches' },
  { value: 'sponsor', icon: '💼', label: 'Sponsor', desc: 'Invest in tournaments and track ROI' },
  { value: 'scorer', icon: '🎯', label: 'Scorer', desc: 'Score matches for a tournament' },
];

// ── OTP Screen ────────────────────────────────────────────────────────
function OTPScreen({ userId, email, onVerified, onClose }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) setOtp(pasted.split(''));
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const data = await authService.verifyOTP(userId, otpString);
      onVerified(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authService.resendOTP(userId);
      setResent(true);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-5">📧</div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
        Check your email
      </h2>
      <p className="text-sm text-gray-400 mb-1">We sent a 6-digit OTP to</p>
      <p className="text-sm font-semibold text-gray-700 mb-7">{email}</p>

      {error && (
        <div className="w-full mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {resent && (
        <div className="w-full mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600">
          ✓ OTP resent successfully
        </div>
      )}

      <div className="flex gap-3 mb-7" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-11 text-center text-xl font-black border-2 rounded-xl transition-all outline-none
              ${digit ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-900'}
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
            style={{ height: '52px', fontFamily: "'Syne', sans-serif" }}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || otp.join('').length !== 6}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4"
      >
        {loading ? 'Verifying...' : 'Verify & Continue'}
      </button>

      <p className="text-sm text-gray-400">
        Didn't receive it?{' '}
        <button onClick={handleResend} disabled={resending} className="text-blue-600 font-semibold hover:underline disabled:opacity-60">
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </p>
      <p className="text-xs text-gray-300 mt-2">OTP expires in 10 minutes</p>
    </div>
  );
}

// ── Signup Form ───────────────────────────────────────────────────────
export default function SignupModal({ onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: '', tournamentCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpScreen, setOtpScreen] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role, tournamentCode: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) { setError('Please select a role to continue.'); return; }
    if (formData.role === 'scorer' && !formData.tournamentCode.trim()) {
      setError('Tournament code is required for scorers.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.register(formData);
      setUserId(data.userId);
      setOtpScreen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (data) => {
    const role = data.user.role;
    if (role === 'organiser') window.location.href = '/organiser/dashboard';
    else if (role === 'captain') window.location.href = '/captain/dashboard';
    else if (role === 'sponsor') window.location.href = '/sponsor/dashboard';
    else if (role === 'scorer') window.location.href = '/scorer/dashboard';
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {otpScreen ? (
          <OTPScreen userId={userId} email={formData.email} onVerified={handleVerified} onClose={onClose} />
        ) : (
          <>
            <div className="mb-7">
              <h2 className="text-2xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Create account
              </h2>
              <p className="text-sm text-gray-400 mt-1">Join Sportfolio and run your first tournament</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Role selector */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                  I am a...
                </label>
                <div className="flex flex-col gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => handleRoleSelect(r.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                        ${formData.role === r.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{r.label}</div>
                        <div className="text-xs text-gray-400">{r.desc}</div>
                      </div>
                      {formData.role === r.value && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tournament code — scorer only */}
              {formData.role === 'scorer' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">
                    Tournament Code
                  </label>
                  <input
                    type="text"
                    name="tournamentCode"
                    value={formData.tournamentCode}
                    onChange={(e) => setFormData({ ...formData, tournamentCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. 2RBMXU"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all tracking-widest"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Get this code from the tournament organiser.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Full name</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Hardik Shah" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Email</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Phone</label>
                <input
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={formData.password} onChange={handleChange}
                    placeholder="••••••••" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-blue-600 font-semibold hover:underline">
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}