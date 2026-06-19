import { useState } from 'react';
import teamService from '../../services/teamService';

export default function JoinTournamentModal({ tournament, onClose, onJoined }) {
  const requiredPlayers = tournament.sportConfig?.teamSize || 1;

  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState(
    Array.from({ length: requiredPlayers }, () => ({ name: '', phone: '' }))
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
    setError('');
  };

  const validate = () => {
    if (!teamName.trim()) return 'Team name is required';
    for (let i = 0; i < players.length; i++) {
      if (!players[i].name.trim()) return `Player ${i + 1} name is required`;
    }
    return '';
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');

    try {
      // step 1 — create order
      const orderData = await teamService.createOrder({
        tournamentId: tournament._id,
        teamName,
        players,
      });

      // if waitlisted — no payment needed
      if (orderData.isWaitlisted) {
        onJoined();
        return;
      }

      // step 2 — load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // step 3 — open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Sportfolio',
        description: `Entry fee — ${tournament.name}`,
        order_id: orderData.order.id,
        prefill: {},
        theme: { color: '#1a6bff' },
        handler: async (response) => {
          // step 4 — verify payment and create team
          try {
            await teamService.verifyPayment({
              tournamentId: tournament._id,
              teamName,
              players,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onJoined();
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed. Contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled. Your team has not been registered.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-7 py-5 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Join Tournament
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{tournament.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-7 py-6">
          {/* Tournament summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Entry Fee', value: `₹${tournament.entryFee?.toLocaleString('en-IN')}` },
                { label: 'Players Required', value: `${requiredPlayers} players` },
                { label: 'Venue', value: `${tournament.venue?.name}, ${tournament.venue?.city}` },
                { label: 'Starts', value: new Date(tournament.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-xs text-gray-400">{r.label}</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Team name */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">
              Team Name
            </label>
            <input
              className="input"
              placeholder="e.g. Mumbai Warriors"
              value={teamName}
              onChange={(e) => { setTeamName(e.target.value); setError(''); }}
            />
          </div>

          {/* Players */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 block">
              Players ({requiredPlayers} required)
            </label>
            <div className="flex flex-col gap-3">
              {players.map((player, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </div>
                  <input
                    className="input flex-1"
                    placeholder={`Player ${i + 1} name`}
                    value={player.name}
                    onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                  />
                  <input
                    className="input w-36"
                    placeholder="Phone (optional)"
                    value={player.phone}
                    onChange={(e) => updatePlayer(i, 'phone', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment info */}
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-600">💳</span>
              <p className="text-xs font-semibold text-blue-700">Secure Payment via Razorpay</p>
            </div>
            <p className="text-xs text-blue-500">
              You'll be redirected to Razorpay to pay ₹{tournament.entryFee?.toLocaleString('en-IN')} via UPI, card, or netbanking. Your team is registered only after successful payment.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-7 py-4 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              `Register & Pay ₹${tournament.entryFee?.toLocaleString('en-IN')}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}