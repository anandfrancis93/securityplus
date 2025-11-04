'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import Header from '@/components/Header';
import { getUserFlashcards, saveFlashcards } from '@/lib/flashcardDb';
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';
import { Flashcard } from '@/lib/types';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

const DOMAINS = [
  'General Security Concepts',
  'Threats, Vulnerabilities, and Mitigations',
  'Security Architecture',
  'Security Operations',
  'Security Program Management and Oversight'
];

export default function CreateFlashcards() {
  const { userId, user, loading: authLoading } = useApp();

  const [generating, setGenerating] = useState(false);

  // Manual mode states
  const [manualTerm, setManualTerm] = useState('');
  const [manualDefinition, setManualDefinition] = useState('');
  const [manualDomain, setManualDomain] = useState('General Security Concepts');
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
  const [manualTermError, setManualTermError] = useState('');
  const [manualDefinitionError, setManualDefinitionError] = useState('');
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

  // Redirect to login if not authenticated
  useRequireAuth(user, authLoading);

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        position: 'relative',
        paddingTop: '24px',
        paddingBottom: '16px'
      }}>
        <Header />
      </div>

      <div style={{
        position: 'relative',
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 clamp(20px, 4vw, 48px) clamp(20px, 3vw, 32px)'
      }}>
        {/* Hero Section */}
        <div style={{ marginBottom: 'clamp(32px, 6vw, 64px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 6vw, 48px)' }}>
            <h1 style={{
              fontSize: 'clamp(48px, 12vw, 80px)',
              fontWeight: 'bold',
              letterSpacing: '-0.025em',
              lineHeight: '1.1',
              marginBottom: 'clamp(16px, 2.5vw, 24px)',
              color: '#e5e5e5'
            }}>
              <span style={{ display: 'block' }}>Create</span>
              <span style={{
                display: 'block',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Flashcards</span>
            </h1>
            <p style={{
              fontSize: 'clamp(18px, 4vw, 24px)',
              fontWeight: '300',
              color: '#a8a8a8',
              maxWidth: '672px',
              margin: '0 auto',
              lineHeight: '1.5'
            }}>
              Build your personal study collection
            </p>
          </div>
        </div>

        {/* Flashcard Creation Form */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 32px)' }}>
          <div style={{
            backgroundColor: '#0f0f0f',
            borderRadius: '24px',
            padding: 'clamp(24px, 4vw, 48px)',
            boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)' }}>
              {/* Term Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: '500',
                  marginBottom: '12px',
                  letterSpacing: '-0.025em',
                  color: '#e5e5e5'
                }}>
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
                  disabled={generating}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f0f0f',
                    color: '#e5e5e5',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    borderRadius: '16px',
                    padding: 'clamp(12px, 2vw, 20px)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: generating ? 0.5 : 1,
                    cursor: generating ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => {
                    if (!generating) {
                      e.target.style.boxShadow = 'inset 6px 6px 12px #050505, inset -6px -6px 12px #191919';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                  }}
                />
                {manualTermError && (
                  <p style={{
                    color: '#f43f5e',
                    fontSize: '16px',
                    marginTop: '12px',
                    marginLeft: '8px'
                  }}>{manualTermError}</p>
                )}
              </div>

              {/* Definition Textarea */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: '500',
                  marginBottom: '12px',
                  letterSpacing: '-0.025em',
                  color: '#e5e5e5'
                }}>
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
                  disabled={generating}
                  style={{
                    width: '100%',
                    height: '160px',
                    backgroundColor: '#0f0f0f',
                    color: '#e5e5e5',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    borderRadius: '16px',
                    padding: 'clamp(12px, 2vw, 20px)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                    resize: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: generating ? 0.5 : 1,
                    cursor: generating ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => {
                    if (!generating) {
                      e.target.style.boxShadow = 'inset 6px 6px 12px #050505, inset -6px -6px 12px #191919';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                  }}
                />
                {manualDefinitionError && (
                  <p style={{
                    color: '#f43f5e',
                    fontSize: '16px',
                    marginTop: '12px',
                    marginLeft: '8px'
                  }}>{manualDefinitionError}</p>
                )}
              </div>

              {/* Domain Dropdown */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: '500',
                  marginBottom: '12px',
                  letterSpacing: '-0.025em',
                  color: '#e5e5e5'
                }}>
                  Security+ Domain
                </label>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => !generating && setDomainDropdownOpen(!domainDropdownOpen)}
                    disabled={generating}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f0f0f',
                      color: '#e5e5e5',
                      fontSize: 'clamp(14px, 3vw, 18px)',
                      borderRadius: '16px',
                      padding: 'clamp(12px, 2vw, 20px)',
                      border: 'none',
                      outline: 'none',
                      boxShadow: domainDropdownOpen
                        ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                        : '6px 6px 12px #050505, -6px -6px 12px #191919',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      opacity: generating ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!generating && !domainDropdownOpen) {
                        e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!domainDropdownOpen) {
                        e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                      }
                    }}
                  >
                    <span>{manualDomain}</span>
                    <svg
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: domainDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
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

                  {domainDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#0f0f0f',
                      borderRadius: '16px',
                      boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
                      zIndex: 50,
                      overflow: 'hidden'
                    }}>
                      {DOMAINS.map((domain) => (
                        <button
                          key={domain}
                          onClick={() => {
                            setManualDomain(domain);
                            setDomainDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '16px 20px',
                            textAlign: 'left',
                            fontSize: '16px',
                            color: manualDomain === domain ? '#8b5cf6' : '#e5e5e5',
                            backgroundColor: manualDomain === domain ? '#8b5cf6/10' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontWeight: manualDomain === domain ? '600' : '400'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = manualDomain === domain ? 'rgba(139, 92, 246, 0.2)' : 'rgba(25, 25, 25, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = manualDomain === domain ? 'rgba(139, 92, 246, 0.1)' : 'transparent';
                          }}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: '500',
                  marginBottom: '12px',
                  letterSpacing: '-0.025em',
                  color: '#e5e5e5'
                }}>
                  Image (Optional)
                </label>
                {manualImagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={manualImagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: '256px',
                        objectFit: 'contain',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        padding: '16px',
                        boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                      }}
                    />
                    <button
                      onClick={handleRemoveManualImage}
                      disabled={generating}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: '#f43f5e',
                        color: '#ffffff',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '6px 6px 12px #050505, -6px -6px 12px #191919',
                        opacity: generating ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!generating) {
                          e.currentTarget.style.boxShadow = 'inset 4px 4px 8px rgba(0,0,0,0.5), inset -4px -4px 8px rgba(255,255,255,0.1)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleManualImageChange}
                      disabled={generating}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f0f0f',
                        color: '#e5e5e5',
                        fontSize: '16px',
                        borderRadius: '16px',
                        padding: '20px',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        opacity: generating ? 0.5 : 1
                      }}
                    />
                  </div>
                )}
                <p style={{
                  fontSize: '14px',
                  color: '#666666',
                  marginTop: '12px',
                  marginLeft: '8px'
                }}>Max 5MB, JPG/PNG/GIF/WebP</p>
              </div>

              {/* Create Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingTop: 'clamp(16px, 2.5vw, 24px)'
              }}>
                <button
                  id="create-flashcard"
                  onClick={handleManualCreate}
                  disabled={generating}
                  style={{
                    position: 'relative',
                    backgroundColor: '#0f0f0f',
                    color: '#e5e5e5',
                    padding: 'clamp(12px, 2vw, 20px) clamp(24px, 4vw, 40px)',
                    fontSize: 'clamp(16px, 3.5vw, 20px)',
                    fontWeight: 'bold',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: generating
                      ? 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919'
                      : '6px 6px 12px #050505, -6px -6px 12px #191919',
                    opacity: generating ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!generating) {
                      e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!generating) {
                      e.currentTarget.style.boxShadow = '6px 6px 12px #050505, -6px -6px 12px #191919';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {generating ? 'Creating...' : 'Create Flashcard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        input::placeholder,
        textarea::placeholder {
          color: #666666;
        }

        input::-webkit-file-upload-button {
          margin-right: 16px;
          padding: 12px 24px;
          border-radius: 16px;
          border: none;
          background: #0f0f0f;
          color: #e5e5e5;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
        }

        input::-webkit-file-upload-button:hover {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        input:disabled::-webkit-file-upload-button {
          opacity: 0.5;
          cursor: not-allowed;
        }

        textarea::-webkit-scrollbar {
          width: 8px;
        }

        textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        textarea::-webkit-scrollbar-thumb {
          background: #191919;
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-thumb:hover {
          background: #222222;
        }
      `}</style>
    </div>
  );
}
