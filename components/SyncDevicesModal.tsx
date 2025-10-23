'use client';

import React, { useState } from 'react';

interface SyncDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateCode: () => Promise<string>;
  onEnterCode: (code: string) => Promise<boolean>;
  currentCode: string | null;
}

export default function SyncDevicesModal({
  isOpen,
  onClose,
  onGenerateCode,
  onEnterCode,
  currentCode,
}: SyncDevicesModalProps) {
  const [mode, setMode] = useState<'menu' | 'generate' | 'enter'>('menu');
  const [generatedCode, setGeneratedCode] = useState<string | null>(currentCode);
  const [enteredCode, setEnteredCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = await onGenerateCode();
      setGeneratedCode(code);
      setMode('generate');
    } catch (err) {
      setError('Failed to generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCode = async () => {
    if (!enteredCode || enteredCode.length !== 6) {
      setError('Please enter a valid 6-character code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await onEnterCode(enteredCode.toUpperCase());
      if (success) {
        alert('Devices synced successfully! Your progress is now shared across devices.');
        onClose();
        window.location.reload();
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setError('Failed to sync devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('menu');
    setEnteredCode('');
    setError(null);
    setGeneratedCode(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Sync Devices</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Menu View */}
        {mode === 'menu' && (
          <div className="space-y-4">
            <p className="text-gray-300 mb-6">
              Sync your progress across multiple devices without creating an account.
            </p>

            <button
              onClick={handleGenerateCode}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              Generate Pairing Code
            </button>

            <button
              onClick={() => setMode('enter')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
            >
              Enter Pairing Code
            </button>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                <strong>How it works:</strong>
                <br />
                1. Generate a code on your primary device
                <br />
                2. Enter the code on your other devices
                <br />
                3. All devices will share the same progress
              </p>
            </div>
          </div>
        )}

        {/* Generate Code View */}
        {mode === 'generate' && generatedCode && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('menu')}
              className="text-blue-400 hover:text-blue-300 text-sm mb-4"
            >
              ← Back
            </button>

            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <p className="text-gray-400 text-sm mb-4">Your Pairing Code:</p>
              <div className="text-5xl font-bold text-blue-400 tracking-widest mb-4 font-mono">
                {generatedCode}
              </div>
              <p className="text-gray-500 text-xs">Expires in 15 minutes</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Instructions:</strong>
                <br />
                1. Open this app on your other device
                <br />
                2. Click &quot;Sync Devices&quot; → &quot;Enter Pairing Code&quot;
                <br />
                3. Enter this code: <strong>{generatedCode}</strong>
              </p>
            </div>

            <button
              onClick={handleGenerateCode}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm disabled:opacity-50"
            >
              Generate New Code
            </button>
          </div>
        )}

        {/* Enter Code View */}
        {mode === 'enter' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('menu')}
              className="text-blue-400 hover:text-blue-300 text-sm mb-4"
            >
              ← Back
            </button>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Enter 6-Character Pairing Code:
              </label>
              <input
                type="text"
                value={enteredCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (value.length <= 6) {
                    setEnteredCode(value);
                    setError(null);
                  }
                }}
                placeholder="AB12CD"
                maxLength={6}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-2xl font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                <strong>⚠️ Warning:</strong> This will replace your current progress on this device with the progress from the paired device.
              </p>
            </div>

            <button
              onClick={handleEnterCode}
              disabled={loading || enteredCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Syncing...' : 'Sync Devices'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
