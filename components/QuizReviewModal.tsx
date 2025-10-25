'use client';

import { QuizSession, QuestionAttempt } from '@/lib/types';
import { useEffect } from 'react';

interface QuizReviewModalProps {
  quiz: QuizSession;
  onClose: () => void;
}

export default function QuizReviewModal({ quiz, onClose }: QuizReviewModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const date = new Date(quiz.startedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Calculate time taken
  const timeTakenMs = (quiz.endedAt || quiz.startedAt) - quiz.startedAt;
  const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
  const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);
  const timeDisplay = timeTakenMinutes > 0
    ? `${timeTakenMinutes}m ${timeTakenSeconds}s`
    : `${timeTakenSeconds}s`;

  // Get domain from topics (using same logic as db.ts)
  const getDomainFromTopics = (topics: string[]): string => {
    const domainKeywords = {
      '1.0 General Security Concepts': [
        'security control', 'technical', 'managerial', 'operational', 'physical',
        'cia', 'confidentiality', 'integrity', 'availability', 'non-repudiation',
        'authentication', 'authorization', 'accounting', 'aaa',
        'zero trust', 'adaptive identity', 'policy', 'trust zone',
        'bollard', 'vestibule', 'fencing', 'surveillance', 'guard', 'badge', 'lighting', 'sensor',
        'honeypot', 'honeynet', 'honeyfile', 'honeytoken',
        'change management', 'approval', 'backout', 'maintenance window',
        'pki', 'encryption', 'cryptographic', 'tpm', 'hsm', 'hashing', 'salting',
        'certificate', 'crl', 'ocsp', 'blockchain'
      ],
      '2.0 Threats, Vulnerabilities, and Mitigations': [
        'threat actor', 'nation-state', 'hacktivist', 'insider threat', 'organized crime',
        'phishing', 'vishing', 'smishing', 'social engineering', 'pretexting',
        'vulnerability', 'buffer overflow', 'injection', 'xss', 'sqli', 'race condition',
        'malware', 'ransomware', 'trojan', 'worm', 'spyware', 'virus', 'keylogger', 'rootkit',
        'ddos', 'dns attack', 'brute force', 'password spray',
        'mitigation', 'segmentation', 'patching', 'hardening', 'least privilege'
      ],
      '3.0 Security Architecture': [
        'cloud', 'iaac', 'serverless', 'microservices', 'containerization',
        'virtualization', 'iot', 'ics', 'scada', 'rtos', 'embedded',
        'network infrastructure', 'sdn', 'air-gapped', 'segmentation',
        'data protection', 'data classification', 'data at rest', 'data in transit',
        'resilience', 'high availability', 'load balancing', 'clustering',
        'backup', 'replication', 'snapshot', 'disaster recovery'
      ],
      '4.0 Security Operations': [
        'baseline', 'hardening', 'mdm', 'byod', 'cope', 'cyod',
        'wpa3', 'radius', 'wireless',
        'asset management', 'inventory', 'disposal', 'sanitization',
        'vulnerability scan', 'penetration test', 'cvss', 'cve',
        'monitoring', 'siem', 'log', 'alert', 'dlp', 'netflow',
        'firewall', 'ips', 'ids', 'web filter', 'dns filtering',
        'identity', 'access management', 'provisioning', 'sso', 'ldap', 'oauth', 'saml',
        'mfa', 'biometric', 'password', 'privileged access',
        'automation', 'orchestration', 'api', 'ci/cd',
        'incident response', 'forensics', 'chain of custody'
      ],
      '5.0 Security Program Management and Oversight': [
        'governance', 'policy', 'aup', 'procedure', 'playbook',
        'compliance', 'regulatory', 'audit', 'attestation',
        'risk management', 'risk assessment', 'sle', 'ale', 'aro',
        'third-party', 'vendor', 'sla', 'mou', 'msa', 'nda',
        'privacy', 'gdpr', 'data subject', 'right to be forgotten',
        'penetration testing', 'security awareness', 'training'
      ]
    };

    const topicsLower = topics.map(t => t.toLowerCase());

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      for (const topic of topicsLower) {
        for (const keyword of keywords) {
          if (topic.includes(keyword)) {
            return domain;
          }
        }
      }
    }

    return '1.0 General Security Concepts';
  };

  const renderAnswer = (attempt: QuestionAttempt) => {
    const { question, userAnswer } = attempt;
    const isMultiple = question.questionType === 'multiple';
    const correctAnswers = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : (userAnswer !== null ? [userAnswer] : []);

    return question.options.map((option, idx) => {
      const isCorrect = correctAnswers.includes(idx);
      const isUserAnswer = userAnswers.includes(idx);
      const shouldHaveSelected = isCorrect;
      const incorrectlySelected = isUserAnswer && !isCorrect;
      const missedCorrect = !isUserAnswer && isCorrect;

      let bgColor = 'bg-gray-700';
      let borderColor = 'border-gray-600';
      let textColor = 'text-gray-300';

      if (incorrectlySelected) {
        bgColor = 'bg-red-900/30';
        borderColor = 'border-red-500';
        textColor = 'text-red-300';
      } else if (isUserAnswer && isCorrect) {
        bgColor = 'bg-green-900/30';
        borderColor = 'border-green-500';
        textColor = 'text-green-300';
      } else if (missedCorrect) {
        bgColor = 'bg-yellow-900/20';
        borderColor = 'border-yellow-500/50';
        textColor = 'text-yellow-300';
      }

      return (
        <div
          key={idx}
          className={`${bgColor} border-2 ${borderColor} rounded-lg p-3 ${textColor}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold">
              {String.fromCharCode(65 + idx)}
            </div>
            <div className="flex-1">
              <p className="text-sm">{option}</p>
              {incorrectlySelected && (
                <p className="text-xs mt-1 text-red-400">Your incorrect answer</p>
              )}
              {isUserAnswer && isCorrect && (
                <p className="text-xs mt-1 text-green-400">Your correct answer</p>
              )}
              {missedCorrect && (
                <p className="text-xs mt-1 text-yellow-400">Correct answer (not selected)</p>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-start justify-center p-4">
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 rounded-t-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Quiz Review</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{formattedDate} • {formattedTime}</span>
                <span>•</span>
                <span>{quiz.questions.length} questions</span>
                <span>•</span>
                <span>Time: {timeDisplay}</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-lg font-semibold">
                  <span className="text-blue-400">{quiz.score}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-300">{quiz.questions.length}</span>
                  <span className="text-gray-500 ml-2">
                    ({((quiz.score / quiz.questions.length) * 100).toFixed(0)}%)
                  </span>
                </div>
                {!quiz.completed && (
                  <span className="text-xs px-2 py-1 rounded bg-yellow-700/30 text-yellow-400 border border-yellow-600/50">
                    Incomplete Quiz
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 -mr-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="p-6 space-y-8 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {quiz.questions.map((attempt, index) => {
            const { question } = attempt;
            const domains = getDomainFromTopics(question.topics);

            return (
              <div key={attempt.questionId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {attempt.isCorrect ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-700/30 text-green-400 border border-green-600/50">
                            Correct
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-700/30 text-red-400 border border-red-600/50">
                            Incorrect
                          </span>
                        )}
                        <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                          {question.difficulty}
                        </span>
                        {question.questionType === 'multiple' && (
                          <span className="px-2 py-1 rounded text-xs bg-purple-700/30 text-purple-400 border border-purple-600/50">
                            Multiple Response
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-400">Points</div>
                    <div className="font-semibold">
                      <span className={attempt.isCorrect ? 'text-green-400' : 'text-red-400'}>
                        {attempt.pointsEarned}
                      </span>
                      <span className="text-gray-500">/</span>
                      <span className="text-gray-300">{attempt.maxPoints}</span>
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-4">
                  <p className="text-white font-medium text-lg leading-relaxed">{question.question}</p>
                </div>

                {/* Answer Options */}
                <div className="space-y-2 mb-4">
                  {renderAnswer(attempt)}
                </div>

                {/* Explanation */}
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-400 mb-1">Explanation</h4>
                      <p className="text-sm text-gray-300 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                </div>

                {/* Topics and Domains */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold">Domain:</span>
                    <span className="px-2 py-1 rounded text-xs bg-indigo-700/30 text-indigo-300 border border-indigo-600/50">
                      {domains}
                    </span>
                  </div>
                  {question.topics && question.topics.length > 0 && (
                    <>
                      <span className="text-gray-600">|</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-semibold">Topics:</span>
                        {question.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 rounded-b-xl p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
}
