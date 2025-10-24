'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, saveFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards, getDeckStats } from '@/lib/spacedRepetition';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard, FlashcardReview } from '@/lib/types';
import NotificationSettings from '@/components/NotificationSettings';

export default function FlashcardsPage() {
  const { userId } = useApp();
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState<'study' | 'create' | 'search' | null>(null);

  // Manual mode states
  const [manualTerm, setManualTerm] = useState('');
  const [manualDefinition, setManualDefinition] = useState('');
  const [manualDomain, setManualDomain] = useState('General Security Concepts');
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);

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
    if (!manualTerm.trim() || !manualDefinition.trim() || !userId) return;

    if (manualTerm.trim().length < 2 || manualDefinition.trim().length < 10) {
      alert('Please enter a valid term (min 2 characters) and definition (min 10 characters).');
      return;
    }

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
    setEditingCard(card);
    setEditTerm(card.term);
    setEditDefinition(card.definition);
    setEditDomain(card.domain || 'General Security Concepts');
    setEditImagePreview(card.imageUrl || null);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading flashcards...</p>
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

  // If no option selected, show three option cards
  if (selectedOption === null) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/cybersecurity')}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold mb-2 text-green-400">Flashcards</h1>
            <p className="text-gray-400">Choose an option</p>
          </div>

          {/* Three Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Study Option */}
            <button
              onClick={() => dueCards.length > 0 ? handleStartStudy() : setSelectedOption('study')}
              className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-green-500 cursor-pointer shadow-lg hover:shadow-green-500/30 hover:shadow-2xl min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
              style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-2xl font-bold mb-2 text-green-400">Study</h2>
                <p className="text-gray-400 text-sm">Review your flashcards with spaced repetition</p>
                {dueCards.length > 0 && (
                  <p className="text-green-300 text-sm font-medium mt-3">{dueCards.length} cards due</p>
                )}
              </div>
            </button>

            {/* Create Option */}
            <button
              onClick={() => setSelectedOption('create')}
              className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-blue-500 cursor-pointer shadow-lg hover:shadow-blue-500/30 hover:shadow-2xl min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
              style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">✍️</div>
                <h2 className="text-2xl font-bold mb-2 text-blue-400">Create</h2>
                <p className="text-gray-400 text-sm">Make new flashcards for your study</p>
              </div>
            </button>

            {/* Search Option */}
            <button
              onClick={() => setSelectedOption('search')}
              className="bg-gray-800 rounded-xl p-8 border-2 border-gray-700 hover:border-purple-500 cursor-pointer shadow-lg hover:shadow-purple-500/30 hover:shadow-2xl min-h-[250px] touch-manipulation hover:-translate-y-2 active:translate-y-0"
              style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2 text-purple-400">Search</h2>
                <p className="text-gray-400 text-sm">Find and manage your flashcards</p>
                <p className="text-gray-500 text-sm mt-3">{flashcards.length} total cards</p>
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
    );
  }

  // Study option selected (or direct navigation)
  if (selectedOption === 'study') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedOption(null)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold mb-2 text-green-400">Study Flashcards</h1>
            <p className="text-gray-400">Review using spaced repetition</p>
          </div>

          {/* Stats */}
          {flashcards.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📚</span>
                    <div className="text-gray-400 text-xs">Total</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌱</span>
                    <div className="text-gray-400 text-xs">Learning</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.learning}</div>
                  {stats.learning > 0 && (
                    <div className="text-xs text-gray-500 mt-1">New cards</div>
                  )}
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔄</span>
                    <div className="text-gray-400 text-xs">Review</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{stats.review}</div>
                  {stats.review > 0 && (
                    <div className="text-xs text-gray-500 mt-1">In progress</div>
                  )}
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⭐</span>
                    <div className="text-gray-400 text-xs">Mastered</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{stats.mastered}</div>
                  {stats.mastered > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((stats.mastered / stats.total) * 100)}% complete
                    </div>
                  )}
                </div>
              </div>

              {/* Study Button */}
              <div className="text-center mb-8">
                {dueCards.length > 0 && (
                  <div className="inline-block mb-6">
                    <button
                      onClick={handleStartStudy}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-12 rounded-lg text-lg shadow-lg shadow-green-500/50 hover:shadow-green-500/70 hover:shadow-2xl min-h-[56px] touch-manipulation hover:-translate-y-1 active:translate-y-0"
                      style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                      Study Now ({dueCards.length} due)
                    </button>
                  </div>
                )}
                {dueCards.length === 0 && flashcards.length > 0 && (
                  <div className="mb-6">
                    <button
                      disabled
                      className="bg-gray-600 cursor-not-allowed text-white font-bold py-5 px-12 rounded-lg text-lg min-h-[56px] touch-manipulation opacity-50"
                    >
                      ✓ All caught up!
                    </button>
                    <p className="mt-4 text-green-400 text-sm">
                      🌟 Great job! Come back later for reviews.
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={handleResetProgress}
                    className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/50 font-medium py-2 px-6 rounded-lg transition-all min-h-[44px]"
                  >
                    Reset Progress
                  </button>
                </div>
              </div>
            </>
          )}

          {flashcards.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-400 text-lg">No flashcards yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Create your first flashcard to start studying
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create option selected
  if (selectedOption === 'create') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedOption(null)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold mb-2 text-blue-400">Create Flashcard</h1>
            <p className="text-gray-400">Make a new flashcard for your study</p>
          </div>

          {/* Flashcard Creation Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">✍️ Create Flashcard</h2>
            <p className="text-gray-400 text-sm mb-4">
              Enter a term/question and its definition to create a single flashcard.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Term / Question
                </label>
                <input
                  type="text"
                  value={manualTerm}
                  onChange={(e) => setManualTerm(e.target.value)}
                  placeholder="e.g., What is Zero Trust?"
                  className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={generating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Definition / Answer
                </label>
                <textarea
                  value={manualDefinition}
                  onChange={(e) => setManualDefinition(e.target.value)}
                  placeholder="Enter the definition or answer here..."
                  className="w-full h-32 bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
                  disabled={generating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Security+ Domain
                </label>
                <select
                  value={manualDomain}
                  onChange={(e) => setManualDomain(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image (Optional)
                </label>
                {manualImagePreview ? (
                  <div className="relative">
                    <img
                      src={manualImagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-600 bg-gray-900"
                    />
                    <button
                      onClick={handleRemoveManualImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                      disabled={generating}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleManualImageChange}
                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                    disabled={generating}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF/WebP</p>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={handleManualCreate}
                  disabled={generating || manualTerm.trim().length < 2 || manualDefinition.trim().length < 10}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all"
                >
                  {generating ? 'Creating...' : 'Create Flashcard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Search option selected
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedOption(null)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold mb-2 text-purple-400">Search Flashcards</h1>
          <p className="text-gray-400">Find and manage your flashcards</p>
        </div>

        {/* Stats */}
        {flashcards.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📚</span>
                  <div className="text-gray-400 text-xs">Total</div>
                </div>
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌱</span>
                  <div className="text-gray-400 text-xs">Learning</div>
                </div>
                <div className="text-2xl font-bold text-yellow-400">{stats.learning}</div>
                {stats.learning > 0 && (
                  <div className="text-xs text-gray-500 mt-1">New cards</div>
                )}
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔄</span>
                  <div className="text-gray-400 text-xs">Review</div>
                </div>
                <div className="text-2xl font-bold text-orange-400">{stats.review}</div>
                {stats.review > 0 && (
                  <div className="text-xs text-gray-500 mt-1">In progress</div>
                )}
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⭐</span>
                  <div className="text-gray-400 text-xs">Mastered</div>
                </div>
                <div className="text-2xl font-bold text-purple-400">{stats.mastered}</div>
                {stats.mastered > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((stats.mastered / stats.total) * 100)}% complete
                  </div>
                )}
              </div>
            </div>

            {/* Flashcard List */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  Your Flashcards ({filteredFlashcards.length}{filteredFlashcards.length !== flashcards.length && ` of ${flashcards.length}`})
                </h3>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by term, definition, domain, or source..."
                    className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-10 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFlashcards.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {searchQuery ? 'No flashcards match your search.' : 'No flashcards yet.'}
                  </div>
                ) : (
                  filteredFlashcards.slice(0, 20).map((card) => (
                  <div
                    key={card.id}
                    className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{card.term}</div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {card.definition}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>From: {card.sourceFile}</span>
                          {card.domain && (
                            <span className="text-blue-400">• {card.domain}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditFlashcard(card)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-blue-400 hover:text-blue-300 p-1"
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
                          onClick={() => handleDeleteFlashcard(card.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-red-400 hover:text-red-300 p-1"
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
                {filteredFlashcards.length > 20 && (
                  <p className="text-center text-gray-500 text-sm pt-2">
                    Showing 20 of {filteredFlashcards.length} flashcards
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {flashcards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-400 text-lg">No flashcards yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Create flashcards to start searching
            </p>
          </div>
        )}

        {/* Edit Modal */}
        {editingCard && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Flashcard</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Term / Question *
                  </label>
                  <input
                    type="text"
                    value={editTerm}
                    onChange={(e) => setEditTerm(e.target.value)}
                    placeholder="e.g., What is Zero Trust?"
                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={generating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Definition / Answer *
                  </label>
                  <textarea
                    value={editDefinition}
                    onChange={(e) => setEditDefinition(e.target.value)}
                    placeholder="Enter the definition or answer here..."
                    className="w-full h-40 bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
                    disabled={generating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Security+ Domain
                  </label>
                  <select
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Image (Optional)
                  </label>
                  {editImagePreview ? (
                    <div className="relative">
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="w-full max-h-48 object-contain rounded-lg border border-gray-600 bg-gray-900"
                      />
                      <button
                        onClick={handleRemoveEditImage}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                        disabled={generating}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                      disabled={generating}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF/WebP</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Term: {editTerm.length} chars | Definition: {editDefinition.length} chars
                    {(editTerm.length > 0 && editTerm.length < 2) && (
                      <span className="text-yellow-500 ml-2">(Term needs at least 2 characters)</span>
                    )}
                    {(editDefinition.length > 0 && editDefinition.length < 10) && (
                      <span className="text-yellow-500 ml-2">(Definition needs at least 10 characters)</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={generating}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={generating || editTerm.trim().length < 2 || editDefinition.trim().length < 10}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all"
                    >
                      {generating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
