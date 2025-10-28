'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, saveFlashcards } from '@/lib/flashcardDb';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard } from '@/lib/types';

export default function CreateFlashcardPage() {
  const { userId, user, loading: authLoading, handleSignOut, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const [generating, setGenerating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Manual mode states
  const [manualTerm, setManualTerm] = useState('');
  const [manualDefinition, setManualDefinition] = useState('');
  const [manualDomain, setManualDomain] = useState('General Security Concepts');
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
  const [manualTermError, setManualTermError] = useState('');
  const [manualDefinitionError, setManualDefinitionError] = useState('');

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const handleManualImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        e.target.value = '';
        return;
      }
      setManualImage(file);
      setManualImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveManualImage = () => {
    setManualImage(null);
    setManualImagePreview(null);
  };

  const handleManualCreate = async () => {
    if (!userId) return;

    // Clear previous errors
    setManualTermError('');
    setManualDefinitionError('');

    // Validate term
    let hasError = false;
    if (!manualTerm.trim()) {
      setManualTermError('Term is required');
      hasError = true;
    } else if (manualTerm.trim().length < 2) {
      setManualTermError('Term must be at least 2 characters');
      hasError = true;
    }

    // Validate definition
    if (!manualDefinition.trim()) {
      setManualDefinitionError('Definition is required');
      hasError = true;
    } else if (manualDefinition.trim().length < 10) {
      setManualDefinitionError('Definition must be at least 10 characters');
      hasError = true;
    }

    if (hasError) return;

    // Validate image if provided
    if (manualImage) {
      const validation = validateImageFile(manualImage);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setGenerating(true);
    try {
      let imageUrl: string | undefined = undefined;

      // Upload image if provided
      if (manualImage) {
        const tempId = `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        imageUrl = await uploadFlashcardImage(userId, tempId, manualImage);
      }

      const flashcard = {
        term: manualTerm.trim(),
        definition: manualDefinition.trim(),
        domain: manualDomain,
        imageUrl,
      };

      await saveFlashcards(userId, [flashcard], 'Manual Entry');

      alert('Flashcard created successfully!');
      setManualTerm('');
      setManualDefinition('');
      setManualDomain('General Security Concepts');
      setManualImage(null);
      setManualImagePreview(null);
      setManualTermError('');
      setManualDefinitionError('');
    } catch (error) {
      console.error('Error creating manual flashcard:', error);
      alert('Failed to create flashcard. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 text-white overflow-hidden flex flex-col relative ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}
      <div className="container mx-auto px-4 py-4 max-w-4xl flex-1 flex flex-col min-h-0" style={{ overscrollBehavior: 'none' }}>
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => router.push('/cybersecurity/flashcards')}
              className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
              title="Back to Flashcards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && user && !user?.isAnonymous && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl py-2 min-w-[200px] z-50">
                  <div className="px-4 py-2 text-sm text-slate-200 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{user?.displayName || 'User'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to sign out?')) {
                        await handleSignOut();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-slate-200 hover:bg-white/5 active:bg-white/10 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Create Flashcards</h1>
          <p className="text-slate-400 text-base">Make new flashcards for your study</p>
        </div>

        {/* Flashcard Creation Form - Scrollable */}
        <div className="flex-1 overflow-y-auto relative" style={{ overscrollBehavior: 'contain' }}>
      <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-3xl' : 'bg-slate-800/95 backdrop-blur-xl rounded-[28px]'} p-6 mb-4 border ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} shadow-2xl`}>
        {liquidGlass && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl opacity-50" />
        )}
        <h2 className="relative text-2xl font-semibold mb-3 tracking-tight text-slate-100">✍️ Create Flashcard</h2>
          <p className={`relative text-sm mb-6 leading-relaxed ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
            Enter a term/question and its definition to create a single flashcard.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                Term / Question
              </label>
              <input
                id="term-input"
                type="text"
                value={manualTerm}
                onChange={(e) => {
                  setManualTerm(e.target.value);
                  if (manualTermError) setManualTermError('');
                }}
                placeholder="e.g., What is Zero Trust?"
                className="w-full bg-slate-900/60 text-slate-100 rounded-3xl p-4 border-2 border-slate-700/50 focus:border-violet-500/50 focus:outline-none focus:bg-slate-900/80 transition-all duration-300"
                disabled={generating}
              />
              {manualTermError && (
                <p className="text-red-400 text-sm mt-2 ml-4">{manualTermError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                Definition / Answer
              </label>
              <textarea
                id="definition-input"
                value={manualDefinition}
                onChange={(e) => {
                  setManualDefinition(e.target.value);
                  if (manualDefinitionError) setManualDefinitionError('');
                }}
                placeholder="Enter the definition or answer here..."
                className="w-full h-32 bg-slate-900/60 text-slate-100 rounded-3xl p-4 border-2 border-slate-700/50 focus:border-violet-500/50 focus:outline-none focus:bg-slate-900/80 resize-vertical transition-all duration-300"
                disabled={generating}
              />
              {manualDefinitionError && (
                <p className="text-red-400 text-sm mt-2 ml-4">{manualDefinitionError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                Security+ Domain
              </label>
              <select
                id="domain-dropdown"
                value={manualDomain}
                onChange={(e) => setManualDomain(e.target.value)}
                className="w-full bg-slate-900/60 text-slate-100 rounded-3xl p-4 border-2 border-slate-700/50 focus:border-violet-500/50 focus:outline-none focus:bg-slate-900/80 transition-all duration-300"
                disabled={generating}
              >
                <option value="General Security Concepts">General Security Concepts</option>
                <option value="Threats, Vulnerabilities, and Mitigations">Threats, Vulnerabilities, and Mitigations</option>
                <option value="Security Architecture">Security Architecture</option>
                <option value="Security Operations">Security Operations</option>
                <option value="Security Program Management and Oversight">Security Program Management and Oversight</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                Image (Optional)
              </label>
              {manualImagePreview ? (
                <div className="relative">
                  <img
                    src={manualImagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-3xl border-2 border-slate-700/50 bg-black/40"
                  />
                  <button
                    onClick={handleRemoveManualImage}
                    className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-700 active:bg-red-800 text-white p-2 rounded-full transition-all duration-300 shadow-lg"
                    disabled={generating}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleManualImageChange}
                  className="w-full bg-slate-900/60 text-slate-100 rounded-3xl p-4 border-2 border-slate-700/50 focus:border-violet-500/50 focus:outline-none transition-all duration-300 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 file:cursor-pointer file:transition-all file:duration-300"
                  disabled={generating}
                />
              )}
              <p className="text-xs text-slate-500 mt-2 ml-4">Max 5MB, JPG/PNG/GIF/WebP</p>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                id="create-flashcard"
                onClick={handleManualCreate}
                disabled={generating}
                className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-violet-600/30 disabled:shadow-none"
              >
                {generating ? 'Creating...' : 'Create Flashcard'}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </>
  );
}
