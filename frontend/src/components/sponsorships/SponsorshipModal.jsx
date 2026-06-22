import { useState } from 'react';
import sponsorshipService from '../../services/sponsorshipService';

const tierAmounts = {
  platinum: 50000,
  gold: 25000,
  silver: 15000,
  bronze: 7000,
};

const tierPerks = {
  platinum: ['Logo on all match banners', 'Hero placement on public page', 'Every match result share', 'Social media mentions', 'Impact Report PDF', 'Sponsor Certificate', 'Naming rights to one match'],
  gold:     ['Logo on all match banners', 'Hero placement on public page', 'Match result shares', 'Social media mentions', 'Impact Report PDF', 'Sponsor Certificate'],
  silver:   ['Logo on public page', 'Mentioned in closing ceremony', 'Select match shares', 'Impact Report PDF', 'Sponsor Certificate'],
  bronze:   ['Name mention in ceremony', 'Listed on public page', 'Impact Report PDF', 'Sponsor Certificate'],
};

const tierColor = {
  platinum: 'border-purple-400 bg-purple-50 text-purple-700',
  gold:     'border-yellow-400 bg-yellow-50 text-yellow-700',
  silver:   'border-gray-300 bg-gray-50 text-gray-600',
  bronze:   'border-orange-300 bg-orange-50 text-orange-700',
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SponsorshipModal({ tournament, tier, onClose, onSponsored }) {
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = tierAmounts[tier];

  const handleSubmit = async () => {
    if (!businessName.trim()) { setError('Business name is required'); return; }
    setLoading(true);
    setError('');

    try {
      const orderData = await sponsorshipService.createOrder({
        tournamentId: tournament._id,
        tier,
        businessName,
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Sportfolio',
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsorship — ${tournament.name}`,
        order_id: orderData.order.id,
        theme: { color: '#f59e0b' },
        handler: async (response) => {
          try {
            await sponsorshipService.verifyPayment({
              tournamentId: tournament._id,
              tier,
              businessName,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSponsored();
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled.');
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
      setError(err.response?.data?.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Sponsor Tournament
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{tournament.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-7 py-6">
          {/* Tier badge + amount */}
          <div className={`border-2 rounded-xl p-4 mb-6 ${tierColor[tier]}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest">{tier} Tier</span>
                <div className="text-2xl font-black mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ₹{amount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-3xl">💼</div>
            </div>
          </div>

          {/* Perks */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What you get</p>
            <ul className="flex flex-col gap-2">
              {tierPerks[tier].map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Business name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">
              Business / Brand Name
            </label>
            <input
              className="input"
              placeholder="e.g. Acme Sports Store"
              value={businessName}
              onChange={(e) => { setBusinessName(e.target.value); setError(''); }}
            />
            <p className="text-xs text-gray-400 mt-1">This name will appear on banners and the public tournament page.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-100 flex gap-3">
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
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₹${amount.toLocaleString('en-IN')}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}