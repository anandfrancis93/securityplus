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
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          backgroundColor: '#0f0f0f',
          color: '#e5e5e5',
          fontSize: 'clamp(14px, 3vw, 18px)',
          borderRadius: '16px',
          padding: 'clamp(12px, 2vw, 20px)',
          border: 'none',
          outline: 'none',
          boxShadow: isOpen
            ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
            : '6px 6px 12px #050505, -6px -6px 12px #191919',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          opacity: disabled ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
          }
        }}
      >
        <span>{value}</span>
        <svg
          style={{
            width: '20px',
            height: '20px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
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
          style={{
            position: 'absolute',
            zIndex: 50,
            width: '100%',
            marginTop: '8px',
            backgroundColor: '#0f0f0f',
            borderRadius: '16px',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
            overflow: 'hidden'
          }}
        >
          {SECURITY_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => {
                onChange(domain);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px 20px',
                fontSize: '16px',
                color: value === domain ? '#8b5cf6' : '#e5e5e5',
                backgroundColor: value === domain ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: value === domain ? 600 : 400
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = value === domain ? 'rgba(139, 92, 246, 0.2)' : 'rgba(25, 25, 25, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value === domain ? 'rgba(139, 92, 246, 0.1)' : 'transparent';
              }}
            >
              {domain}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
