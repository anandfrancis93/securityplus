import React, { useRef, useEffect } from 'react';
import { SECURITY_DOMAINS } from '@/lib/constants/domainColors';

interface DomainDropdownProps {
  value: string;
  onChange: (domain: string) => void;
  liquidGlass: boolean;
  disabled?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

/**
 * Domain Dropdown Component
 * Reusable dropdown for selecting Security+ domains
 */
export function DomainDropdown({
  value,
  onChange,
  liquidGlass,
  disabled = false,
  isOpen,
  setIsOpen,
}: DomainDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full ${
          liquidGlass ? 'bg-white/5' : 'bg-slate-900/60'
        } text-slate-100 text-lg ${
          liquidGlass ? 'rounded-[28px]' : 'rounded-3xl'
        } p-5 border-2 ${
          liquidGlass ? 'border-white/10' : 'border-slate-700/50'
        } ${
          liquidGlass
            ? 'hover:bg-white/10 hover:border-cyan-500/50'
            : 'hover:bg-slate-900/80'
        } focus:outline-none transition-all duration-700 disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between`}
        disabled={disabled}
      >
        <span>{value}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-2 ${
            liquidGlass
              ? 'bg-black/95 backdrop-blur-2xl border border-white/20 rounded-[28px]'
              : 'bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl'
          } shadow-2xl overflow-hidden`}
        >
          {SECURITY_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => {
                onChange(domain);
                setIsOpen(false);
              }}
              className={`w-full text-left px-5 py-4 text-base transition-all duration-300 ${
                value === domain
                  ? liquidGlass
                    ? 'bg-cyan-500/30 text-white'
                    : 'bg-cyan-600/50 text-white'
                  : liquidGlass
                  ? 'text-zinc-200 hover:bg-white/10'
                  : 'text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
