'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getUserFlashcards } from '@/lib/flashcardDb';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard } from '@/lib/types';

// Domain color mapping - same colors as QuizPage's QuestionMetadata
const DOMAIN_COLORS: { [key: string]: string } = {
  'General Security Concepts': '#9333ea', // Bright purple
  'Threats, Vulnerabilities, and Mitigations': '#ff4500', // Bright orange-red
  'Security Architecture': '#06b6d4', // Bright cyan
  'Security Operations': '#fbbf24', // Bright yellow
  'Security Program Management and Oversight': '#22c55e', // Bright green
};

// Helper function to get domain color
function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#22c55e'; // Default to green
}

export default function SearchFlashcards() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit mode states
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [editDomain, setEditDomain] = useState('General Security Concepts');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editDomainDropdownOpen, setEditDomainDropdownOpen] = useState(false);
  const editDomainDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      loadFlashcards();
    }
  }, [userId]);

  // Debug: Track editingCard state changes
  useEffect(() => {
    console.log('editingCard state changed to:', editingCard);
    if (editingCard) {
      console.log('Modal should now be visible for card:', editingCard.term);
    } else {
      console.log('Modal should be hidden');
    }
  }, [editingCard]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editDomainDropdownRef.current && !editDomainDropdownRef.current.contains(event.target as Node)) {
        setEditDomainDropdownOpen(false);
      }
    }

    if (editDomainDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editDomainDropdownOpen]);

  const loadFlashcards = async () => {
    if (!userId) return;

    try {
      const cards = await getUserFlashcards(userId);
      setFlashcards(cards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditTerm('');
    setEditDefinition('');
    setEditDomain('General Security Concepts');
    setEditImage(null);
    setEditImagePreview(null);
    setEditDomainDropdownOpen(false);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        e.target.value = '';
        return;
      }
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCard || !editTerm.trim() || !editDefinition.trim() || !userId) return;

    if (editTerm.trim().length < 2 || editDefinition.trim().length < 10) {
      alert('Please enter a valid term (min 2 characters) and definition (min 10 characters).');
      return;
    }

    // Validate new image if provided
    if (editImage) {
      const validation = validateImageFile(editImage);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setGenerating(true);
    try {
      let imageUrl: string | undefined = editingCard.imageUrl;

      // Upload new image if provided
      if (editImage) {
        imageUrl = await uploadFlashcardImage(userId, editingCard.id, editImage);
      } else if (!editImagePreview) {
        // Image was removed
        imageUrl = undefined;
      }

      const { updateFlashcard } = await import('@/lib/flashcardDb');
      await updateFlashcard(editingCard.id, {
        term: editTerm.trim(),
        definition: editDefinition.trim(),
        domain: editDomain,
        imageUrl,
      });

      alert('Flashcard updated successfully!');
      handleCancelEdit();
      await loadFlashcards();
    } catch (error) {
      console.error('Error updating flashcard:', error);
      alert('Failed to update flashcard. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteFlashcard = async (flashcardId: string) => {
    if (!confirm('Delete this flashcard?')) return;

    try {
      const { deleteFlashcard } = await import('@/lib/flashcardDb');
      await deleteFlashcard(flashcardId);
      await loadFlashcards();
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      alert('Failed to delete flashcard. Please try again.');
    }
  };

  const handleEditFlashcard = (card: Flashcard) => {
    console.log('Edit button clicked for card:', card.term);
    setEditingCard(card);
    setEditTerm(card.term);
    setEditDefinition(card.definition);
    setEditDomain(card.domain || 'General Security Concepts');
    setEditImage(null);
    setEditImagePreview(card.imageUrl || null);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        )}
        <div className="relative">
          {/* Liquid glass card */}
          <div className={`${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl'} p-16 md:p-20 shadow-2xl`}>
            {liquidGlass && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
            )}
            <div className="relative text-center">
              {/* Animated icon */}
              <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 mb-8">
                {/* Outer ring */}
                <div className={`absolute inset-0 ${liquidGlass ? 'border-4 border-white/20 rounded-full' : 'border-4 border-slate-700 rounded-full'}`}></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 animate-spin">
                  <div className={`w-full h-full rounded-full ${liquidGlass ? 'border-4 border-transparent border-t-emerald-400 border-r-emerald-400/50' : 'border-4 border-transparent border-t-emerald-500 border-r-emerald-500/50'}`}></div>
                </div>
                {/* Center icon - card stack */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className={`w-16 h-16 md:w-20 md:h-20 ${liquidGlass ? 'text-emerald-400' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              </div>
              {/* Loading text */}
              <p className={`text-2xl md:text-3xl font-bold tracking-tight ${liquidGlass ? 'text-white' : 'text-slate-200'}`}>
                Loading flashcards...
              </p>
              <p className={`text-base md:text-lg mt-4 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                Please wait
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort flashcards based on search query with relevance scoring
  const filteredFlashcards = flashcards
    .filter((card) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        card.term.toLowerCase().includes(query) ||
        card.definition.toLowerCase().includes(query) ||
        card.domain?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (!searchQuery.trim()) return 0;

      const query = searchQuery.toLowerCase();
      const aTermLower = a.term.toLowerCase();
      const bTermLower = b.term.toLowerCase();
      const aDefLower = a.definition.toLowerCase();
      const bDefLower = b.definition.toLowerCase();
      const aDomainLower = a.domain?.toLowerCase() || '';
      const bDomainLower = b.domain?.toLowerCase() || '';

      // Calculate relevance scores (higher is better)
      let aScore = 0;
      let bScore = 0;

      // Exact match in term (highest priority) - score 1000
      if (aTermLower === query) aScore += 1000;
      if (bTermLower === query) bScore += 1000;

      // Starts with query in term - score 500
      if (aTermLower.startsWith(query)) aScore += 500;
      if (bTermLower.startsWith(query)) bScore += 500;

      // Contains query in term - score 300
      if (aTermLower.includes(query)) aScore += 300;
      if (bTermLower.includes(query)) bScore += 300;

      // Starts with query in definition - score 100
      if (aDefLower.startsWith(query)) aScore += 100;
      if (bDefLower.startsWith(query)) bScore += 100;

      // Contains query in definition - score 50
      if (aDefLower.includes(query)) aScore += 50;
      if (bDefLower.includes(query)) bScore += 50;

      // Contains query in domain - score 10
      if (aDomainLower.includes(query)) aScore += 10;
      if (bDomainLower.includes(query)) bScore += 10;

      // Sort by score (descending - highest score first)
      return bScore - aScore;
    });

  const DebugOverlay = () => (
    <>
      {/* Edit Modal - Working version */}
      {editingCard && (
        <>
          {/* Modal Backdrop */}
          <div
            onClick={handleCancelEdit}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.90)',
              backdropFilter: 'blur(16px)',
              zIndex: 999998,
              transition: 'opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />

          {/* Modal Content */}
          <div className="edit-modal-scroll" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: liquidGlass ? 'rgba(18, 18, 18, 0.95)' : 'rgba(30, 41, 59, 0.95)',
            color: 'white',
            padding: '48px',
            borderRadius: liquidGlass ? '40px' : '32px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 999999,
            boxShadow: liquidGlass ? '0 32px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(52, 211, 153, 0.2)' : '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(24px)',
            border: liquidGlass ? '1px solid rgba(52, 211, 153, 0.15)' : '1px solid rgba(148, 163, 184, 0.2)',
            transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Light Reflection */}
            {liquidGlass && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%)',
                borderRadius: '40px',
                pointerEvents: 'none'
              }} />
            )}

            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: '700', margin: 0, letterSpacing: '-0.03em', color: '#fff', textShadow: liquidGlass ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none' }}>Edit Flashcard</h2>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: liquidGlass ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '36px',
                  cursor: 'pointer',
                  padding: '10px',
                  lineHeight: '1',
                  borderRadius: liquidGlass ? '20px' : '50%',
                  transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '14px', fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.01em' }}>
                  Term / Question *
                </label>
                <input
                  type="text"
                  value={editTerm}
                  onChange={(e) => setEditTerm(e.target.value)}
                  placeholder="e.g., What is Zero Trust?"
                  disabled={generating}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    fontSize: '18px',
                    borderRadius: liquidGlass ? '24px' : '28px',
                    border: liquidGlass ? '2px solid rgba(52, 211, 153, 0.15)' : '2px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: liquidGlass ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: liquidGlass ? 'blur(8px)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.6)';
                    e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(52, 211, 153, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = liquidGlass ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.6)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {editTerm.length > 0 && editTerm.length < 2 && (
                  <span style={{ color: '#fbbf24', fontSize: '15px', marginTop: '10px', display: 'block', fontWeight: '500' }}>
                    Term must be at least 2 characters
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '14px', fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.01em' }}>
                  Definition / Answer *
                </label>
                <textarea
                  value={editDefinition}
                  onChange={(e) => setEditDefinition(e.target.value)}
                  placeholder="Enter the definition or answer here..."
                  rows={6}
                  disabled={generating}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    fontSize: '18px',
                    borderRadius: liquidGlass ? '24px' : '28px',
                    border: liquidGlass ? '2px solid rgba(52, 211, 153, 0.15)' : '2px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: liquidGlass ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: liquidGlass ? 'blur(8px)' : 'none',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.6)';
                    e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(52, 211, 153, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = liquidGlass ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.6)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {editDefinition.length > 0 && editDefinition.length < 10 && (
                  <span style={{ color: '#fbbf24', fontSize: '15px', marginTop: '10px', display: 'block', fontWeight: '500' }}>
                    Definition must be at least 10 characters
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '14px', fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.01em' }}>
                  Security+ Domain
                </label>
                <div style={{ position: 'relative' }} ref={editDomainDropdownRef}>
                  <button
                    type="button"
                    onClick={() => !generating && setEditDomainDropdownOpen(!editDomainDropdownOpen)}
                    disabled={generating}
                    style={{
                      width: '100%',
                      padding: '18px 24px',
                      fontSize: '18px',
                      borderRadius: liquidGlass ? '24px' : '28px',
                      border: liquidGlass ? '2px solid rgba(52, 211, 153, 0.15)' : '2px solid rgba(148, 163, 184, 0.2)',
                      backgroundColor: liquidGlass ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.6)',
                      color: '#fff',
                      outline: 'none',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                      transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: liquidGlass ? 'blur(8px)' : 'none',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: generating ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!generating) {
                        e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.8)';
                        e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.6)';
                      e.currentTarget.style.borderColor = liquidGlass ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.2)';
                    }}
                  >
                    <span>{editDomain}</span>
                    <svg
                      style={{
                        width: '20px',
                        height: '20px',
                        transition: 'transform 300ms',
                        transform: editDomainDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
                  {editDomainDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      zIndex: 1000000,
                      width: '100%',
                      marginTop: '8px',
                      backgroundColor: liquidGlass ? 'rgba(0, 0, 0, 0.95)' : 'rgba(30, 41, 59, 0.95)',
                      backdropFilter: 'blur(24px)',
                      border: liquidGlass ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: liquidGlass ? '24px' : '28px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                      overflow: 'hidden'
                    }}>
                      {[
                        'General Security Concepts',
                        'Threats, Vulnerabilities, and Mitigations',
                        'Security Architecture',
                        'Security Operations',
                        'Security Program Management and Oversight'
                      ].map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => {
                            setEditDomain(domain);
                            setEditDomainDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '16px 20px',
                            fontSize: '16px',
                            border: 'none',
                            backgroundColor: editDomain === domain
                              ? (liquidGlass ? 'rgba(16, 185, 129, 0.3)' : 'rgba(52, 211, 153, 0.2)')
                              : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 300ms',
                            outline: 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (editDomain !== domain) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (editDomain !== domain) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '32px' }}>
                <button
                  onClick={handleCancelEdit}
                  disabled={generating}
                  style={{
                    flex: 1,
                    padding: '18px 36px',
                    backgroundColor: liquidGlass ? 'rgba(255, 255, 255, 0.05)' : 'rgba(71, 85, 105, 0.4)',
                    color: liquidGlass ? '#d1d5db' : '#cbd5e1',
                    border: liquidGlass ? '2px solid rgba(255, 255, 255, 0.1)' : 'none',
                    borderRadius: liquidGlass ? '24px' : '9999px',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                    transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.02em',
                    backdropFilter: liquidGlass ? 'blur(8px)' : 'none'
                  }}
                  onMouseEnter={(e) => !generating && (e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.1)' : 'rgba(71, 85, 105, 0.6)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.05)' : 'rgba(71, 85, 105, 0.4)')}
                  onMouseDown={(e) => !generating && (e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.15)' : 'rgba(71, 85, 105, 0.7)')}
                  onMouseUp={(e) => !generating && (e.currentTarget.style.backgroundColor = liquidGlass ? 'rgba(255, 255, 255, 0.1)' : 'rgba(71, 85, 105, 0.6)')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10}
                  style={{
                    flex: 1,
                    padding: '18px 36px',
                    backgroundColor: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? (liquidGlass ? 'rgba(255, 255, 255, 0.05)' : 'rgba(71, 85, 105, 0.4)') : 'rgba(52, 211, 153, 1)',
                    color: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? '#64748b' : '#000',
                    border: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? (liquidGlass ? '2px solid rgba(255, 255, 255, 0.1)' : 'none') : 'none',
                    borderRadius: liquidGlass ? '24px' : '9999px',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? 'not-allowed' : 'pointer',
                    transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.02em',
                    boxShadow: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? 'none' : '0 8px 24px rgba(52, 211, 153, 0.4), 0 0 0 1px rgba(52, 211, 153, 0.3)'
                  }}
                  onMouseEnter={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 1)', e.currentTarget.style.boxShadow = '0 12px 32px rgba(52, 211, 153, 0.5), 0 0 0 1px rgba(52, 211, 153, 0.4)')}
                  onMouseLeave={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(52, 211, 153, 1)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(52, 211, 153, 0.4), 0 0 0 1px rgba(52, 211, 153, 0.3)')}
                  onMouseDown={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 1)')}
                  onMouseUp={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 1)')}
                >
                  {generating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Global styles for custom scrollbar */}
      <style jsx global>{`
        .flashcard-list-scroll::-webkit-scrollbar,
        .edit-modal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .flashcard-list-scroll::-webkit-scrollbar-track,
        .edit-modal-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .flashcard-list-scroll::-webkit-scrollbar-thumb,
        .edit-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        .flashcard-list-scroll::-webkit-scrollbar-thumb:hover,
        .edit-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
        .flashcard-list-scroll,
        .edit-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.5) rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <DebugOverlay />
      <div className={`fixed inset-0 h-screen text-white overflow-hidden flex flex-col relative ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {liquidGlass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Header - Full width */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6 flex-shrink-0">
        <Header />
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 pb-8 max-w-5xl flex-1 flex flex-col min-h-0" style={{ overscrollBehavior: 'none' }}>
        {/* Hero Section */}
        <div className="mb-6 flex-shrink-0">
          <div className="text-center mb-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight mb-6">
              <span className="block bg-gradient-to-br from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">Search</span>
              <span className="block bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">Flashcards</span>
            </h1>
            <p className={`text-lg sm:text-xl md:text-2xl font-light ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'} leading-relaxed max-w-2xl mx-auto`}>
              Find and manage your flashcards
            </p>
          </div>
        </div>

        {/* Flashcard List */}
        {flashcards.length > 0 && (
          <div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-[28px]'} p-8 border ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} flex-1 flex flex-col overflow-hidden mb-4 shadow-2xl`}>
              {liquidGlass && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50 pointer-events-none" />
              )}
              <div className="relative flex items-center justify-between mb-6 flex-shrink-0">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Your Flashcards ({filteredFlashcards.length}{filteredFlashcards.length !== flashcards.length && ` of ${flashcards.length}`})
                </h3>
              </div>

              {/* Search Input */}
              <div className="mb-6 flex-shrink-0">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by term, definition, or domain..."
                    className={`w-full ${liquidGlass ? 'bg-white/5' : 'bg-slate-900/60'} text-slate-100 text-lg ${liquidGlass ? 'rounded-[28px]' : 'rounded-full'} pl-14 pr-14 py-5 border-2 ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} focus:border-emerald-500/50 focus:outline-none ${liquidGlass ? 'focus:bg-white/10' : 'focus:bg-slate-900/80'} transition-all duration-700 ${liquidGlass ? 'backdrop-blur-xl' : ''}`}
                  />
                  <svg
                    className={`absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-5 top-1/2 transform -translate-y-1/2 ${liquidGlass ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-white'} hover:bg-white/10 active:bg-white/15 ${liquidGlass ? 'rounded-[20px]' : 'rounded-full'} p-2 transition-all duration-700`}
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flashcard-list-scroll space-y-3 flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                {filteredFlashcards.length === 0 ? (
                  <div className={`text-center py-12 text-lg ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'}`}>
                    {searchQuery ? 'No flashcards match your search.' : 'No flashcards yet.'}
                  </div>
                ) : (
                  filteredFlashcards.map((card) => (
                  <div
                    key={card.id}
                    className={`${liquidGlass ? 'bg-white/5 rounded-[32px]' : 'bg-slate-900/40 rounded-3xl'} p-6 hover:bg-white/10 active:bg-white/15 transition-all duration-700 group border ${liquidGlass ? 'border-white/10 hover:border-white/20' : 'border-transparent hover:border-slate-700/50'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base md:text-lg">{card.term}</div>
                        <div className={`text-sm md:text-base ${liquidGlass ? 'text-zinc-400' : 'text-slate-400'} mt-2 line-clamp-2 leading-relaxed`}>
                          {card.definition}
                        </div>
                        {card.domain && (
                          <div className={`text-xs md:text-sm mt-3 flex items-center gap-2 flex-wrap`}>
                            <span style={{ color: getDomainColor(card.domain) }}>{card.domain}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 relative z-10">
                        <button
                          id={`edit-flashcard-${card.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Button clicked!', card.term);
                            handleEditFlashcard(card);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-all duration-700 flex-shrink-0 text-emerald-400 hover:text-emerald-300 hover:bg-white/5 active:bg-white/10 p-2.5 ${liquidGlass ? 'rounded-[20px]' : 'rounded-full'}`}
                          title="Edit flashcard"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          id={`delete-flashcard-${card.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete button clicked!', card.id);
                            handleDeleteFlashcard(card.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-all duration-700 flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-white/5 active:bg-white/10 p-2.5 ${liquidGlass ? 'rounded-[20px]' : 'rounded-full'}`}
                          title="Delete flashcard"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
        )}

        {flashcards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-300 text-lg font-medium">No flashcards yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Create flashcards to start searching
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
