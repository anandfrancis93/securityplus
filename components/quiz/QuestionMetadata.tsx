'use client';

import { Question } from '@/lib/types';
import { getDomainsFromTopics } from '@/lib/domainDetection';

interface QuestionMetadataProps {
  question: Question;
  liquidGlass?: boolean;
}

export default function QuestionMetadata({ question, liquidGlass = true }: QuestionMetadataProps) {
  const domains = getDomainsFromTopics(question.topics);

  return (
    <div className={`relative p-12 md:p-16 ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px]' : 'bg-zinc-950 border-2 border-zinc-800 rounded-md'}`}>
      {liquidGlass && <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px]" />}
      <div className="space-y-8 relative">
        {/* Domain(s) */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xl md:text-2xl text-white font-bold">
            {domains.length > 1 ? 'Domains:' : 'Domain:'}
          </span>
          <div className="flex flex-wrap gap-3">
            {domains.map((domain, index) => (
              <span
                key={index}
                className={`px-6 py-4 text-lg md:text-xl font-bold ${liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-200 border border-white/20 rounded-2xl' : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700 rounded-md'}`}
              >
                {domain}
              </span>
            ))}
          </div>
        </div>

        {/* Topics */}
        {question.topics && question.topics.length > 0 && (
          <div className="flex items-start gap-4 flex-wrap">
            <span className="text-xl md:text-2xl text-white font-bold">
              {question.topics.length > 1 ? 'Topics:' : 'Topic:'}
            </span>
            <div className="flex flex-wrap gap-3">
              {question.topics.map((topic, index) => (
                <span
                  key={index}
                  className={`px-6 py-4 text-lg md:text-xl font-medium ${liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-200 border border-white/20 rounded-2xl' : 'bg-zinc-900 text-zinc-200 border-2 border-zinc-700 rounded-md'}`}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xl md:text-2xl text-white font-bold">Difficulty:</span>
          <span className={`px-6 py-4 text-lg md:text-xl border-2 font-bold ${
            liquidGlass
              ? question.difficulty === 'easy' ? 'bg-green-500/20 text-green-200 border-green-500/50 backdrop-blur-xl rounded-2xl' :
                question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/50 backdrop-blur-xl rounded-2xl' :
                'bg-red-500/20 text-red-200 border-red-500/50 backdrop-blur-xl rounded-2xl'
              : question.difficulty === 'easy' ? 'bg-green-900 text-green-200 border-green-700 rounded-md' :
                question.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-200 border-yellow-700 rounded-md' :
                'bg-red-900 text-red-200 border-red-700 rounded-md'
          }`}>
            {question.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Question Type */}
        {question.questionCategory && (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xl md:text-2xl text-white font-bold">Type:</span>
            <span className={`px-6 py-4 text-lg md:text-xl font-medium ${liquidGlass ? 'bg-white/10 backdrop-blur-xl text-zinc-300 border border-white/20 rounded-2xl' : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700 rounded-md'}`}>
              {question.questionCategory === 'single-domain-single-topic' ? 'Single Domain, Single Topic' :
               question.questionCategory === 'single-domain-multiple-topics' ? 'Single Domain, Multiple Topics' :
               'Multiple Domains, Multiple Topics'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
