'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, saveFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards, getDeckStats } from '@/lib/spacedRepetition';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard, FlashcardReview } from '@/lib/types';
import NotificationSettings from '@/components/NotificationSettings';

export default function FlashcardsPage() {
  const { userId, user, loading: authLoading, handleSignOut } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState<'study' | 'create' | 'search' | 'performance' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Manual mode states
  const [manualTerm, setManualTerm] = useState('');
  const [manualDefinition, setManualDefinition] = useState('');
  const [manualDomain, setManualDomain] = useState('General Security Concepts');
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
  const [manualTermError, setManualTermError] = useState('');
  const [manualDefinitionError, setManualDefinitionError] = useState('');

  // Edit mode states
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [editDomain, setEditDomain] = useState('General Security Concepts');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

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

  const loadFlashcards = async () => {
    if (!userId) return;

    try {
      const [cards, cardReviews] = await Promise.all([
        getUserFlashcards(userId),
        getUserReviews(userId),
      ]);

      setFlashcards(cards);
      setReviews(cardReviews);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
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
      await loadFlashcards();
    } catch (error) {
      console.error('Error creating manual flashcard:', error);
      alert('Failed to create flashcard. Please try again.');
    } finally {
      setGenerating(false);
    }
  };


  const handleStartStudy = () => {
    router.push('/cybersecurity/flashcards/study');
  };

  const handleEditFlashcard = (card: Flashcard) => {
    console.log('Edit button clicked for card:', card.term);
    console.log('Setting editingCard to:', card);
    setEditingCard(card);
    setEditTerm(card.term);
    setEditDefinition(card.definition);
    setEditDomain(card.domain || 'General Security Concepts');
    setEditImagePreview(card.imageUrl || null);
    console.log('State setters called, editingCard should be:', card);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditTerm('');
    setEditDefinition('');
    setEditDomain('General Security Concepts');
    setEditImage(null);
    setEditImagePreview(null);
  };

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

  const handleRemoveManualImage = () => {
    setManualImage(null);
    setManualImagePreview(null);
  };

  const handleRemoveEditImage = () => {
    setEditImage(null);
    setEditImagePreview(null);
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

  const handleDeleteAllFlashcards = async () => {
    if (!userId) return;

    if (!confirm(`Delete ALL ${flashcards.length} flashcards? This cannot be undone!`)) return;

    try {
      const { deleteFlashcard } = await import('@/lib/flashcardDb');

      // Delete all flashcards
      for (const card of flashcards) {
        await deleteFlashcard(card.id);
      }

      alert('All flashcards deleted successfully!');
      await loadFlashcards();
    } catch (error) {
      console.error('Error deleting flashcards:', error);
      alert('Failed to delete all flashcards. Please try again.');
    }
  };

  const handleResetProgress = async () => {
    if (!userId) return;

    if (!confirm('Reset ALL flashcard progress? This will clear all review history and spaced repetition data. Your flashcards will not be deleted.')) return;

    try {
      const { resetFlashcardProgress } = await import('@/lib/flashcardDb');
      await resetFlashcardProgress(userId);
      alert('Flashcard progress reset successfully!');
      await loadFlashcards();
    } catch (error) {
      console.error('Error resetting flashcard progress:', error);
      alert('Failed to reset progress. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  const dueCards = getDueFlashcards(reviews, flashcards.map(f => f.id));
  const stats = getDeckStats(reviews, flashcards.map(f => f.id));

  // Filter flashcards based on search query
  const filteredFlashcards = flashcards.filter((card) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      card.term.toLowerCase().includes(query) ||
      card.definition.toLowerCase().includes(query) ||
      card.domain?.toLowerCase().includes(query) ||
      card.sourceFile.toLowerCase().includes(query)
    );
  });

  // Global debug overlay component
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
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 999998,
              transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />

          {/* Modal Content */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            color: 'white',
            padding: '32px',
            borderRadius: '28px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 999999,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '600', margin: 0, letterSpacing: '-0.02em', color: '#e2e8f0' }}>Edit Flashcard</h2>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '8px',
                  lineHeight: '1',
                  borderRadius: '50%',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', letterSpacing: '0.01em' }}>
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
                    padding: '14px 16px',
                    fontSize: '15px',
                    borderRadius: '24px',
                    border: '2px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                  }}
                />
                {editTerm.length > 0 && editTerm.length < 2 && (
                  <span style={{ color: '#fbbf24', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                    Term must be at least 2 characters
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', letterSpacing: '0.01em' }}>
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
                    padding: '14px 16px',
                    fontSize: '15px',
                    borderRadius: '24px',
                    border: '2px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                  }}
                />
                {editDefinition.length > 0 && editDefinition.length < 10 && (
                  <span style={{ color: '#fbbf24', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                    Definition must be at least 10 characters
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', letterSpacing: '0.01em' }}>
                  Security+ Domain
                </label>
                <select
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  disabled={generating}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '15px',
                    borderRadius: '24px',
                    border: '2px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                  }}
                >
                  <option value="General Security Concepts">General Security Concepts</option>
                  <option value="Threats, Vulnerabilities, and Mitigations">Threats, Vulnerabilities, and Mitigations</option>
                  <option value="Security Architecture">Security Architecture</option>
                  <option value="Security Operations">Security Operations</option>
                  <option value="Security Program Management and Oversight">Security Program Management and Oversight</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button
                  onClick={handleCancelEdit}
                  disabled={generating}
                  style={{
                    flex: 1,
                    padding: '14px 28px',
                    backgroundColor: 'rgba(71, 85, 105, 0.4)',
                    color: '#cbd5e1',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.01em'
                  }}
                  onMouseEnter={(e) => !generating && (e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.6)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.4)')}
                  onMouseDown={(e) => !generating && (e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.7)')}
                  onMouseUp={(e) => !generating && (e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.6)')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10}
                  style={{
                    flex: 1,
                    padding: '14px 28px',
                    backgroundColor: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? 'rgba(71, 85, 105, 0.4)' : 'rgba(139, 92, 246, 0.9)',
                    color: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? '#64748b' : 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? 'not-allowed' : 'pointer',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.01em',
                    boxShadow: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.9)')}
                  onMouseLeave={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.9)')}
                  onMouseDown={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(109, 40, 217, 0.9)')}
                  onMouseUp={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.9)')}
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

  // If no option selected, show three option cards
  if (selectedOption === null) {
    return (
      <>
        <DebugOverlay />
        <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => router.push('/cybersecurity')}
                className="text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-300 p-2 rounded-full"
                title="Back to Cybersecurity"
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
            <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Flashcards</h1>
            <p className="text-slate-400 text-base">Choose an option</p>
          </div>

          {/* Four Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Study Option */}
            <button
              id="study"
              onClick={handleStartStudy}
              className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 active:bg-white/10 cursor-pointer min-h-[250px] touch-manipulation hover:-translate-y-2 hover:shadow-2xl active:translate-y-0 transition-all duration-500"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-2xl font-semibold mb-2 text-slate-100 tracking-tight">Study</h2>
                <p className="text-slate-400 text-sm leading-relaxed">Review with spaced repetition and interleaving</p>
              </div>
            </button>

            {/* Create Option */}
            <button
              id="create"
              onClick={() => setSelectedOption('create')}
              className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 active:bg-white/10 cursor-pointer min-h-[250px] touch-manipulation hover:-translate-y-2 hover:shadow-2xl active:translate-y-0 transition-all duration-500"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">✍️</div>
                <h2 className="text-2xl font-semibold mb-2 text-slate-100 tracking-tight">Create</h2>
                <p className="text-slate-400 text-sm leading-relaxed">Make new flashcards for your study</p>
              </div>
            </button>

            {/* Search Option */}
            <button
              id="search"
              onClick={() => setSelectedOption('search')}
              className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 active:bg-white/10 cursor-pointer min-h-[250px] touch-manipulation hover:-translate-y-2 hover:shadow-2xl active:translate-y-0 transition-all duration-500"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-semibold mb-2 text-slate-100 tracking-tight">Search</h2>
                <p className="text-slate-400 text-sm leading-relaxed">Find and manage your flashcards</p>
                <p className="text-slate-500 text-sm mt-3">{flashcards.length} total cards</p>
              </div>
            </button>

            {/* Performance Option */}
            <button
              id="flashcard-performance"
              onClick={() => setSelectedOption('performance')}
              className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-8 border border-slate-700/50 hover:border-violet-500/50 hover:bg-white/5 active:bg-white/10 cursor-pointer min-h-[250px] touch-manipulation hover:-translate-y-2 hover:shadow-2xl active:translate-y-0 transition-all duration-500"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-semibold mb-2 text-slate-100 tracking-tight">Performance</h2>
                <p className="text-slate-400 text-sm leading-relaxed">View your progress and statistics</p>
              </div>
            </button>
          </div>

          {/* Notification Settings at bottom */}
          {flashcards.length > 0 && (
            <div className="mt-12">
              <NotificationSettings />
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  // Performance option selected
  if (selectedOption === 'performance') {
    return (
      <>
        <DebugOverlay />
        {/* Global tooltip animation */}
        <style jsx global>{`
          @keyframes tooltipFade {
            0% { opacity: 0; }
            26.3% { opacity: 0; }
            30.3% { opacity: 1; }
            96.1% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
        <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setSelectedOption(null)}
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
            <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Performance</h1>
            <p className="text-slate-400 text-base">View your progress and statistics</p>
          </div>

          {/* Stats */}
          {flashcards.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-5 border border-slate-700/50 relative group cursor-help hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📚</span>
                  <div className="text-slate-400 text-xs font-medium tracking-wide">Total</div>
                </div>
                <div className="text-3xl font-bold text-violet-400">{stats.total}</div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                  <p className="text-sm text-slate-300 leading-relaxed">The total number of flashcards in your deck.</p>
                </div>
              </div>
              <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-5 border border-slate-700/50 relative group cursor-help hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌱</span>
                  <div className="text-slate-400 text-xs font-medium tracking-wide">Learning</div>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{stats.learning}</div>
                {stats.learning > 0 && (
                  <div className="text-xs text-slate-500 mt-1 font-medium">New cards</div>
                )}
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                  <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;ve attempted but got wrong or rated as &quot;Again&quot;. These cards have 0 successful repetitions and need daily practice.</p>
                </div>
              </div>
              <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-5 border border-slate-700/50 relative group cursor-help hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔄</span>
                  <div className="text-slate-400 text-xs font-medium tracking-wide">Review</div>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{stats.review}</div>
                {stats.review > 0 && (
                  <div className="text-xs text-slate-500 mt-1 font-medium">In progress</div>
                )}
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                  <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;re actively learning and have reviewed correctly 1-2 times. These cards are in progress but not yet mastered.</p>
                </div>
              </div>
              <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-5 border border-slate-700/50 relative group cursor-help hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⭐</span>
                  <div className="text-slate-400 text-xs font-medium tracking-wide">Mastered</div>
                </div>
                <div className="text-3xl font-bold text-violet-400">{stats.mastered}</div>
                {stats.mastered > 0 && (
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    {Math.round((stats.mastered / stats.total) * 100)}% complete
                  </div>
                )}
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:animate-[tooltipFade_7.6s_ease-in-out_forwards]">
                  <p className="text-sm text-slate-300 leading-relaxed">Cards you&apos;ve successfully reviewed 3 or more times. These cards are well-learned and appear less frequently to maintain long-term retention.</p>
                </div>
              </div>
            </div>
          )}

          {/* Reset Progress Button */}
          {flashcards.length > 0 && (
            <div className="text-center mt-8">
              <button
                id="reset-flashcard-progress"
                onClick={handleResetProgress}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 active:bg-yellow-600/40 text-yellow-400 border border-yellow-600/50 font-semibold py-3 px-8 rounded-full transition-all duration-300 min-h-[44px] hover:shadow-lg hover:shadow-yellow-600/10"
              >
                Reset Progress
              </button>
            </div>
          )}

          {flashcards.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-slate-300 text-lg font-medium">No flashcards yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Create your first flashcard to start tracking performance
              </p>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  // Create option selected
  if (selectedOption === 'create') {
    return (
      <>
        <DebugOverlay />
        <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
        <div className="container mx-auto px-4 py-4 max-w-4xl flex-1 flex flex-col min-h-0" style={{ overscrollBehavior: 'none' }}>
          {/* Header */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={() => setSelectedOption(null)}
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
            <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Create Flashcard</h1>
            <p className="text-slate-400 text-base">Make a new flashcard for your study</p>
          </div>

          {/* Flashcard Creation Form - Scrollable */}
          <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-6 mb-4 border border-slate-700/50 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-3 tracking-tight text-slate-100">✍️ Create Flashcard</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
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

  // Search option selected
  return (
    <>
      <DebugOverlay />
      <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-4 max-w-4xl flex-1 flex flex-col min-h-0" style={{ overscrollBehavior: 'none' }}>
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => setSelectedOption(null)}
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
          <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Search Flashcards</h1>
          <p className="text-slate-400 text-base">Find and manage your flashcards</p>
        </div>

        {/* Flashcard List */}
        {flashcards.length > 0 && (
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-5 border border-slate-700/50 flex-1 flex flex-col overflow-hidden mb-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-xl font-semibold text-slate-100 tracking-tight">
                  Your Flashcards ({filteredFlashcards.length}{filteredFlashcards.length !== flashcards.length && ` of ${flashcards.length}`})
                </h3>
              </div>

              {/* Search Input */}
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by term, definition, domain, or source..."
                    className="w-full bg-slate-900/60 text-slate-100 rounded-full pl-12 pr-12 py-4 border-2 border-slate-700/50 focus:border-violet-500/50 focus:outline-none focus:bg-slate-900/80 transition-all duration-300"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 rounded-full p-1 transition-all duration-300"
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                {filteredFlashcards.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {searchQuery ? 'No flashcards match your search.' : 'No flashcards yet.'}
                  </div>
                ) : (
                  filteredFlashcards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900/40 rounded-3xl p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-300 group border border-transparent hover:border-slate-700/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-200">{card.term}</div>
                        <div className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {card.definition}
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                          <span>From: {card.sourceFile}</span>
                          {card.domain && (
                            <span className="text-violet-400">• {card.domain}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 relative z-10">
                        <button
                          id={`edit-flashcard-${card.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Button clicked!', card.term);
                            handleEditFlashcard(card);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 text-violet-400 hover:text-violet-300 hover:bg-white/5 active:bg-white/10 p-2 rounded-full"
                          title="Edit flashcard"
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
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-white/5 active:bg-white/10 p-2 rounded-full"
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

  // Search view (default when selectedOption === 'search')
  return (
    <>
      <DebugOverlay />

      <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-4 max-w-4xl flex-1 flex flex-col min-h-0" style={{ overscrollBehavior: 'none' }}>
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => setSelectedOption(null)}
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
          <h1 className="text-4xl font-bold mb-2 text-slate-100 tracking-tight">Search Flashcards</h1>
          <p className="text-slate-400 text-base">Find and manage your flashcards</p>
        </div>

        {/* Flashcard List */}
        {flashcards.length > 0 && (
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-[28px] p-5 border border-slate-700/50 flex-1 flex flex-col overflow-hidden mb-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-xl font-semibold text-slate-100 tracking-tight">
                  Your Flashcards ({filteredFlashcards.length}{filteredFlashcards.length !== flashcards.length && ` of ${flashcards.length}`})
                </h3>
              </div>

              {/* Search Input */}
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by term, definition, domain, or source..."
                    className="w-full bg-slate-900/60 text-slate-100 rounded-full pl-12 pr-12 py-4 border-2 border-slate-700/50 focus:border-violet-500/50 focus:outline-none focus:bg-slate-900/80 transition-all duration-300"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 rounded-full p-1 transition-all duration-300"
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                {filteredFlashcards.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {searchQuery ? 'No flashcards match your search.' : 'No flashcards yet.'}
                  </div>
                ) : (
                  filteredFlashcards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900/40 rounded-3xl p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-300 group border border-transparent hover:border-slate-700/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-200">{card.term}</div>
                        <div className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {card.definition}
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                          <span>From: {card.sourceFile}</span>
                          {card.domain && (
                            <span className="text-violet-400">• {card.domain}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 relative z-10">
                        <button
                          id={`edit-flashcard-${card.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Button clicked!', card.term);
                            handleEditFlashcard(card);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 text-violet-400 hover:text-violet-300 hover:bg-white/5 active:bg-white/10 p-2 rounded-full"
                          title="Edit flashcard"
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
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-white/5 active:bg-white/10 p-2 rounded-full"
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
