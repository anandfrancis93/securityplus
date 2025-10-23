'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { useRouter } from 'next/navigation';
import { getUserFlashcards, saveFlashcards, getUserReviews } from '@/lib/flashcardDb';
import { getDueFlashcards, getDeckStats } from '@/lib/spacedRepetition';
import { Flashcard, FlashcardReview } from '@/lib/types';

export default function FlashcardsPage() {
  const { userId } = useApp();
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inputText, setInputText] = useState('');

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

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim() || !userId) return;

    if (inputText.trim().length < 50) {
      alert('Please enter at least 50 characters of text.');
      return;
    }

    setGenerating(true);
    try {
      console.log('Generating flashcards from text...');

      const response = await fetch('/api/extract-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          fileName: 'Manual Entry',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', data);
        throw new Error(data.error || 'Failed to extract flashcards');
      }

      console.log('Received flashcards:', data.flashcards.length);

      // Save flashcards to database
      await saveFlashcards(userId, data.flashcards, data.fileName);

      alert(`Successfully created ${data.flashcards.length} flashcards!`);
      setInputText('');

      await loadFlashcards();
    } catch (error) {
      console.error('Error generating flashcards:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate flashcards: ${errorMessage}\n\nPlease check the browser console for more details.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartStudy = () => {
    router.push('/flashcards/study');
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Flashcards
            </h1>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-all"
            >
              ← Back to Home
            </button>
          </div>
          <p className="text-gray-400">
            Create flashcards from your study materials using AI
          </p>
        </div>

        {/* Text Input Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">✍️ Enter Security+ Terms</h2>
          <p className="text-gray-400 text-sm mb-4">
            Enter Security+ terms below (one per line or separated). AI will create one flashcard per term with definitions.
          </p>

          <div className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter Security+ terms (one per line)...&#10;&#10;Example:&#10;Zero Trust&#10;CIA Triad&#10;MFA&#10;Least Privilege&#10;Defense in Depth&#10;AAA Framework&#10;PKI&#10;SIEM&#10;&#10;Or with definitions:&#10;Zero Trust - No implicit trust&#10;CIA Triad - Confidentiality, Integrity, Availability&#10;&#10;10 terms = 10 flashcards&#10;100 terms = 100 flashcards"
              className="w-full h-64 bg-gray-700 text-white rounded-lg p-4 border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
              disabled={generating}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {inputText.length} characters
                {inputText.length < 50 && inputText.length > 0 && (
                  <span className="text-yellow-500 ml-2">
                    (Need at least 50 characters)
                  </span>
                )}
              </div>
              <button
                onClick={handleGenerateFlashcards}
                disabled={generating || inputText.trim().length < 50}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                {generating ? 'Generating...' : 'Generate Flashcards'}
              </button>
            </div>

            {generating && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-400">
                  Analyzing text and extracting key terms...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {flashcards.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-xs mb-1">Total</div>
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-xs mb-1">New</div>
                <div className="text-2xl font-bold text-green-400">{stats.new}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-xs mb-1">Learning</div>
                <div className="text-2xl font-bold text-yellow-400">{stats.learning}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-xs mb-1">Review</div>
                <div className="text-2xl font-bold text-orange-400">{stats.review}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-xs mb-1">Mastered</div>
                <div className="text-2xl font-bold text-purple-400">{stats.mastered}</div>
              </div>
            </div>

            {/* Study Button */}
            <div className="text-center mb-8">
              <button
                onClick={handleStartStudy}
                disabled={dueCards.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {dueCards.length > 0
                  ? `Study Now (${dueCards.length} due)`
                  : 'No cards due'}
              </button>
              {dueCards.length === 0 && flashcards.length > 0 && (
                <p className="mt-4 text-gray-500 text-sm">
                  All caught up! Come back later for reviews.
                </p>
              )}
            </div>

            {/* Flashcard List */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Your Flashcards</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {flashcards.slice(0, 20).map((card) => (
                  <div
                    key={card.id}
                    className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-all"
                  >
                    <div className="font-medium text-sm">{card.term}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {card.definition}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      From: {card.sourceFile}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {flashcards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-400 text-lg">No flashcards yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Upload a document to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
