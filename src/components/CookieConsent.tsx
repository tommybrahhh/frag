'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    // Here you would typically initialize analytics
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-stone-900 text-stone-50 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-stone-800">
        
        <div className="flex-1">
          <h4 className="font-serif text-lg mb-2">We value your privacy</h4>
          <p className="text-sm text-stone-400 leading-relaxed">
            We use cookies to enhance your experience, analyze site traffic, and personalize content. 
            Read our <Link href="/privacy" className="text-white underline underline-offset-4 hover:text-stone-300">Privacy Policy</Link> to learn more.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 md:flex-none px-6 py-3 border border-stone-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-8 py-3 bg-white text-stone-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition"
          >
            Accept
          </button>
        </div>

      </div>
    </div>
  );
}
