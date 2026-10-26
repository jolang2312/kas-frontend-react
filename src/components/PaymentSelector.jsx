import React from 'react';

export default function PaymentSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4 my-2">
      <button
        type="button"
        onClick={() => onChange('QRIS')}
        className={`p-4 rounded-xl border font-bold uppercase tracking-wider transition-all duration-300 ${
          value === 'QRIS'
            ? 'border-brightChrome bg-gradient-to-r from-zinc-800 to-zinc-900 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-[1.02]'
            : 'border-borderDark bg-inputBg text-textSec hover:border-chrome'
        }`}
      >
        QRIS
      </button>

      <button
        type="button"
        onClick={() => onChange('DANA')}
        className={`p-4 rounded-xl border font-bold uppercase tracking-wider transition-all duration-300 ${
          value === 'DANA'
            ? 'border-brightChrome bg-gradient-to-r from-zinc-800 to-zinc-900 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-[1.02]'
            : 'border-borderDark bg-inputBg text-textSec hover:border-chrome'
        }`}
      >
        DANA
      </button>
    </div>
  );
}