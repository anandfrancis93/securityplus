'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getUserFlashcards, saveFlashcards } from '@/lib/flashcardDb';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard } from '@/lib/types';

export default function CreateFlashcards() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const [generating, setGenerating] = useState(false);

  // Manual mode states
  const [manualTerm, setManualTerm] = useState('');
  const [manualDefinition, setManualDefinition] = useState('');
  const [manualDomain, setManualDomain] = useState('General Security Concepts');
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
  const [manualTermError, setManualTermError] = useState('');
  const [manualDefinitionError, setManualDefinitionError] = useState('');

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
      {/* Global styles for hidden scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 pb-8 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight mb-6">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">Create</span>
              <span className="block bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">Flashcards</span>
            </h1>
            <p className={`text-xl md:text-2xl font-light ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'} max-w-2xl mx-auto leading-relaxed`}>
              Build your personal study collection
            </p>
          </div>
        </div>

        {/* Flashcard Creation Form */}
        <div className="mb-20">
      <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-10 md:p-12 border ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} shadow-2xl overflow-hidden`}>
        {liquidGlass && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-[40px] opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
          </>
        )}

          <div className="relative space-y-8">
            <div>
              <label className={`block text-lg font-medium mb-3 tracking-tight ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'}`}>
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
                className={`w-full ${liquidGlass ? 'bg-white/5' : 'bg-slate-900/60'} text-slate-100 text-lg ${liquidGlass ? 'rounded-[28px]' : 'rounded-3xl'} p-5 border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} focus:border-cyan-500/50 focus:outline-none ${liquidGlass ? 'focus:bg-white/10' : 'focus:bg-slate-900/80'} transition-all duration-700 placeholder:text-zinc-500`}
                disabled={generating}
              />
              {manualTermError && (
                <p className="text-red-400 text-base mt-3 ml-2">{manualTermError}</p>
              )}
            </div>

            <div>
              <label className={`block text-lg font-medium mb-3 tracking-tight ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'}`}>
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
                className={`no-scrollbar w-full h-40 ${liquidGlass ? 'bg-white/5' : 'bg-slate-900/60'} text-slate-100 text-lg ${liquidGlass ? 'rounded-[28px]' : 'rounded-3xl'} p-5 border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} focus:border-cyan-500/50 focus:outline-none ${liquidGlass ? 'focus:bg-white/10' : 'focus:bg-slate-900/80'} resize-none transition-all duration-700 placeholder:text-zinc-500`}
                disabled={generating}
              />
              {manualDefinitionError && (
                <p className="text-red-400 text-base mt-3 ml-2">{manualDefinitionError}</p>
              )}
            </div>

            <div>
              <label className={`block text-lg font-medium mb-3 tracking-tight ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'}`}>
                Security+ Domain
              </label>
              <select
                id="domain-dropdown"
                value={manualDomain}
                onChange={(e) => setManualDomain(e.target.value)}
                className={`w-full ${liquidGlass ? 'bg-white/5' : 'bg-slate-900/60'} text-slate-100 text-lg ${liquidGlass ? 'rounded-[28px]' : 'rounded-3xl'} p-5 border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} focus:border-cyan-500/50 focus:outline-none ${liquidGlass ? 'focus:bg-white/10' : 'focus:bg-slate-900/80'} transition-all duration-700 ${liquidGlass ? '[&>option]:bg-zinc-900 [&>option]:text-white [&>option]:py-3' : ''}`}
                disabled={generating}
              >
                <option value="General Security Concepts" className={liquidGlass ? 'bg-zinc-900 text-white hover:bg-cyan-600 hover:text-white' : ''}>General Security Concepts</option>
                <option value="Threats, Vulnerabilities, and Mitigations" className={liquidGlass ? 'bg-zinc-900 text-white hover:bg-cyan-600 hover:text-white' : ''}>Threats, Vulnerabilities, and Mitigations</option>
                <option value="Security Architecture" className={liquidGlass ? 'bg-zinc-900 text-white hover:bg-cyan-600 hover:text-white' : ''}>Security Architecture</option>
                <option value="Security Operations" className={liquidGlass ? 'bg-zinc-900 text-white hover:bg-cyan-600 hover:text-white' : ''}>Security Operations</option>
                <option value="Security Program Management and Oversight" className={liquidGlass ? 'bg-zinc-900 text-white hover:bg-cyan-600 hover:text-white' : ''}>Security Program Management and Oversight</option>
              </select>
            </div>

            <div>
              <label className={`block text-lg font-medium mb-3 tracking-tight ${liquidGlass ? 'text-zinc-300' : 'text-slate-300'}`}>
                Image (Optional)
              </label>
              {manualImagePreview ? (
                <div className="relative">
                  <img
                    src={manualImagePreview}
                    alt="Preview"
                    className={`w-full max-h-64 object-contain ${liquidGlass ? 'rounded-[28px]' : 'rounded-3xl'} border-2 ${liquidGlass ? 'border-white/20' : 'border-slate-700/50'} bg-black/40`}
                  />
                  <button
                    onClick={handleRemoveManualImage}
                    className="absolute top-4 right-4 bg-red-500/90 hover:bg-red-600 active:bg-red-700 text-white p-3 rounded-2xl transition-all duration-700 shadow-xl hover:scale-110"
                    disabled={generating}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleManualImageChange}
                  className={`w-full ${liquidGlass ? 'bg-white/5' : 'bg-slate-900/60'} text-slate-100 text-base ${liquidGlass ? 'rounded-[28px]' : 'rounded-3xl'} p-5 border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} focus:border-cyan-500/50 focus:outline-none transition-all duration-700 file:mr-4 file:py-3 file:px-6 ${liquidGlass ? 'file:rounded-full file:border-2 file:border-white/10 file:bg-white/5 file:backdrop-blur-2xl hover:file:bg-white/10 hover:file:border-cyan-400/60 hover:file:shadow-xl hover:file:shadow-cyan-500/50' : 'file:rounded-full file:border-0 file:bg-cyan-600 hover:file:bg-cyan-700'} file:text-base file:font-semibold file:text-white file:cursor-pointer file:transition-all file:duration-700`}
                  disabled={generating}
                />
              )}
              <p className={`text-sm ${liquidGlass ? 'text-zinc-500' : 'text-slate-500'} mt-3 ml-2`}>Max 5MB, JPG/PNG/GIF/WebP</p>
            </div>

            <div className="flex items-center justify-end pt-6">
              <div className="relative group">
                <button
                  id="create-flashcard"
                  onClick={handleManualCreate}
                  disabled={generating}
                  className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[32px] hover:bg-white/10 border-2 border-white/10 hover:border-cyan-400/60 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50' : 'bg-cyan-600 hover:bg-cyan-700 rounded-full shadow-xl hover:shadow-cyan-600/50'} active:bg-white/10 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 text-white px-10 py-5 text-xl font-bold transition-all duration-700 disabled:shadow-none hover:scale-105`}
                >
                  {liquidGlass && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/50 via-transparent to-transparent rounded-[32px] group-hover:opacity-100 transition-opacity duration-700" />
                  )}
                  {liquidGlass && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[32px] opacity-50" />
                  )}
                  <span className="relative">{generating ? 'Creating...' : 'Create Flashcard'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </>
  );
}
