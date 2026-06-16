import { useState } from 'react';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';

export default function Navbar() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#f7f6f2]/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <a href="/" className="font-black text-xl tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sport<span className="text-blue-600">folio</span>
          </a>

          <ul className="hidden md:flex items-center gap-8 list-none">
            <li><a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</a></li>
            <li><a href="#finance" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Finance</a></li>
            <li><a href="#sponsors" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Sponsors</a></li>
            <li><a href="#ml" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">AI Models</a></li>
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
        />
      )}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
        />
      )}
    </>
  );
}