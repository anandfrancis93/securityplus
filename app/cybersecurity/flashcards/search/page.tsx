'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import Header from '@/components/Header';
import { getUserFlashcards } from '@/lib/flashcardDb';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard } from '@/lib/types';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DomainDropdown } from '@/components/ui/DomainDropdown';
import { getDomainColor } from '@/lib/constants/domainColors';

export default function SearchFlashcards() {
  const { userId, user, loading: authLoading } = useApp();

  // Redirect to login if not authenticated
  useRequireAuth(user, authLoading);

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
    return <LoadingScreen message="Loading flashcards..." />;
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

  const EditModal = () => (
    <>
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
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />

          {/* Modal Content */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#0f0f0f',
            color: '#e5e5e5',
            padding: 'clamp(24px, 4vw, 48px)',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 999999,
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(24px, 4vw, 36px)' }}>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '700', margin: 0, letterSpacing: '-0.03em', color: '#e5e5e5' }}>
                Edit Flashcard
              </h2>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: '#0f0f0f',
                  border: 'none',
                  color: '#a8a8a8',
                  fontSize: '36px',
                  cursor: 'pointer',
                  padding: '10px',
                  lineHeight: '1',
                  borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                  e.currentTarget.style.color = '#e5e5e5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                  e.currentTarget.style.color = '#a8a8a8';
                }}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 28px)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '14px', fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '700', color: '#e5e5e5', letterSpacing: '0.01em' }}>
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
                    padding: 'clamp(14px, 2vw, 18px) clamp(16px, 2.5vw, 24px)',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#0f0f0f',
                    color: '#e5e5e5',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 0 2px #8b5cf6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                  }}
                />
                {editTerm.length > 0 && editTerm.length < 2 && (
                  <span style={{ color: '#f59e0b', fontSize: '15px', marginTop: '10px', display: 'block', fontWeight: '500' }}>
                    Term must be at least 2 characters
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '14px', fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '700', color: '#e5e5e5', letterSpacing: '0.01em' }}>
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
                    padding: 'clamp(14px, 2vw, 18px) clamp(16px, 2.5vw, 24px)',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#0f0f0f',
                    color: '#e5e5e5',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 0 2px #8b5cf6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                  }}
                />
                {editDefinition.length > 0 && editDefinition.length < 10 && (
                  <span style={{ color: '#f59e0b', fontSize: '15px', marginTop: '10px', display: 'block', fontWeight: '500' }}>
                    Definition must be at least 10 characters
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '14px', fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '700', color: '#e5e5e5', letterSpacing: '0.01em' }}>
                  Security+ Domain
                </label>
                <DomainDropdown
                  value={editDomain}
                  onChange={setEditDomain}
                  liquidGlass={false}
                  disabled={generating}
                  isOpen={editDomainDropdownOpen}
                  setIsOpen={setEditDomainDropdownOpen}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '20px', marginTop: 'clamp(20px, 3vw, 32px)' }}>
                <button
                  onClick={handleCancelEdit}
                  disabled={generating}
                  style={{
                    flex: 1,
                    padding: 'clamp(14px, 2vw, 18px) clamp(24px, 4vw, 36px)',
                    backgroundColor: '#0f0f0f',
                    color: '#a8a8a8',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: 'clamp(14px, 2.5vw, 17px)',
                    fontWeight: '700',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.02em',
                    boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                  }}
                  onMouseEnter={(e) => !generating && (e.currentTarget.style.color = '#e5e5e5')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a8a8')}
                  onMouseDown={(e) => !generating && (e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919')}
                  onMouseUp={(e) => !generating && (e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10}
                  style={{
                    flex: 1,
                    padding: 'clamp(14px, 2vw, 18px) clamp(24px, 4vw, 36px)',
                    backgroundColor: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? '#0f0f0f' : '#10b981',
                    color: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? '#666666' : '#000',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: 'clamp(14px, 2.5vw, 17px)',
                    fontWeight: '700',
                    cursor: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.02em',
                    boxShadow: (generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) ? '6px 6px 12px #050505, -6px -6px 12px #191919' : '6px 6px 12px #050505, -6px -6px 12px #191919'
                  }}
                  onMouseEnter={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.backgroundColor = '#10b981')}
                  onMouseDown={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919')}
                  onMouseUp={(e) => !(generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10) && (e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919')}
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
      <EditModal />
      <div style={{
        position: 'fixed',
        inset: 0,
        height: '100vh',
        backgroundColor: '#0f0f0f',
        color: '#e5e5e5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header - Full width */}
        <div style={{
          position: 'relative',
          paddingTop: '24px',
          paddingBottom: '16px',
          flexShrink: 0
        }}>
          <Header />
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 48px) clamp(20px, 3vw, 32px)',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overscrollBehavior: 'none'
        }}>
          {/* Hero Section */}
          <div style={{ marginBottom: 'clamp(16px, 2.5vw, 24px)', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 3vw, 32px)' }}>
              <h1 style={{
                fontSize: 'clamp(48px, 12vw, 96px)',
                fontWeight: '700',
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                marginBottom: 'clamp(16px, 2.5vw, 24px)',
                margin: 0
              }}>
                <span style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #e5e5e5 0%, #a8a8a8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Search
                </span>
                <span style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Flashcards
                </span>
              </h1>
              <p style={{
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: '300',
                color: '#a8a8a8',
                lineHeight: '1.6',
                maxWidth: '672px',
                margin: '0 auto'
              }}>
                Find and manage your flashcards
              </p>
            </div>
          </div>

          {/* Flashcard List */}
          {flashcards.length > 0 && (
            <div style={{
              backgroundColor: '#0f0f0f',
              borderRadius: '24px',
              padding: 'clamp(20px, 3vw, 32px)',
              boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(16px, 2.5vw, 24px)', flexShrink: 0 }}>
                <h3 style={{
                  fontSize: 'clamp(20px, 5vw, 30px)',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                  margin: 0,
                  color: '#e5e5e5'
                }}>
                  Your Flashcards ({filteredFlashcards.length}{filteredFlashcards.length !== flashcards.length && ` of ${flashcards.length}`})
                </h3>
              </div>

              {/* Search Input */}
              <div style={{ marginBottom: 'clamp(16px, 2.5vw, 24px)', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by term, definition, or domain..."
                    style={{
                      width: '100%',
                      backgroundColor: '#0f0f0f',
                      color: '#e5e5e5',
                      fontSize: 'clamp(14px, 3vw, 18px)',
                      borderRadius: '16px',
                      paddingLeft: 'clamp(44px, 8vw, 56px)',
                      paddingRight: 'clamp(44px, 8vw, 56px)',
                      paddingTop: 'clamp(12px, 2vw, 20px)',
                      paddingBottom: 'clamp(12px, 2vw, 20px)',
                      border: 'none',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919, 0 0 0 2px #10b981';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                    }}
                  />
                  <svg
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '24px',
                      height: '24px',
                      color: '#a8a8a8'
                    }}
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
                      title="Clear search"
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#a8a8a8',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#e5e5e5';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#a8a8a8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                overflowY: 'auto',
                overscrollBehavior: 'contain'
              }}>
                {filteredFlashcards.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    paddingTop: '48px',
                    paddingBottom: '48px',
                    fontSize: '18px',
                    color: '#a8a8a8'
                  }}>
                    {searchQuery ? 'No flashcards match your search.' : 'No flashcards yet.'}
                  </div>
                ) : (
                  filteredFlashcards.map((card) => (
                    <FlashcardItem key={card.id} card={card} />
                  ))
                )}
              </div>
            </div>
          )}

          {flashcards.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 'clamp(32px, 6vw, 48px)', paddingBottom: 'clamp(32px, 6vw, 48px)' }}>
              <div style={{ fontSize: 'clamp(64px, 15vw, 96px)', marginBottom: '16px' }}>📚</div>
              <p style={{ color: '#e5e5e5', fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: '500', margin: 0 }}>
                No flashcards yet
              </p>
              <p style={{ color: '#666666', fontSize: 'clamp(12px, 2.5vw, 14px)', marginTop: '8px' }}>
                Create flashcards to start searching
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #0f0f0f;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #191919;
          border-radius: 4px;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #222222;
        }
        ::placeholder {
          color: #666666;
          opacity: 1;
        }
      `}</style>
    </>
  );

  function FlashcardItem({ card }: { card: Flashcard }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: '#0f0f0f',
          borderRadius: '24px',
          padding: 'clamp(16px, 2.5vw, 24px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
          border: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '700', fontSize: 'clamp(14px, 3vw, 18px)', color: '#e5e5e5', marginBottom: '8px' }}>
              {card.term}
            </div>
            <div style={{
              fontSize: 'clamp(12px, 2.5vw, 16px)',
              color: '#a8a8a8',
              marginTop: '8px',
              lineHeight: '1.6',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {card.definition}
            </div>
            {card.domain && (
              <div style={{
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  color: getDomainColor(card.domain),
                  backgroundColor: '#0f0f0f',
                  padding: 'clamp(4px, 1vw, 6px) clamp(12px, 2vw, 16px)',
                  borderRadius: '12px',
                  fontSize: 'clamp(11px, 2vw, 13px)',
                  fontWeight: '600',
                  boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
                }}>
                  {card.domain}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 10 }}>
            <button
              id={`edit-flashcard-${card.id}`}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Button clicked!', card.term);
                handleEditFlashcard(card);
              }}
              title="Edit flashcard"
              style={{
                opacity: isHovered ? 1 : 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                color: '#10b981',
                backgroundColor: '#0f0f0f',
                border: 'none',
                padding: '10px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#10b981';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
              }}
            >
              <svg
                style={{ width: '20px', height: '20px' }}
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
              title="Delete flashcard"
              style={{
                opacity: isHovered ? 1 : 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                color: '#f43f5e',
                backgroundColor: '#0f0f0f',
                border: 'none',
                padding: '10px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#f43f5e';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
              }}
            >
              <svg
                style={{ width: '20px', height: '20px' }}
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
    );
  }
}
