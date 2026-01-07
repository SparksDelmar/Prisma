import React, { useState } from 'react';
import { User, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ProcessFlow from './ProcessFlow';
import { ChatMessage } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
  isLast?: boolean;
}

const ChatMessageItem = ({ message, isLast }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);

  // Check if there is any thinking data to show
  const hasThinkingData = message.analysis || (message.experts && message.experts.length > 0);

  return (
    <div className={`group w-full text-slate-800 ${isUser ? 'bg-transparent' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-4 md:gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            isUser 
              ? 'bg-slate-100 border-slate-200' 
              : 'bg-white border-blue-100 shadow-sm'
          }`}>
            {isUser ? (
              <User size={16} className="text-slate-500" />
            ) : (
              <Sparkles size={16} className="text-blue-600" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="font-semibold text-sm text-slate-900 mb-1">
            {isUser ? 'You' : 'Prisma'}
          </div>

          {/* Thinking Process Accordion (Only for AI) */}
          {!isUser && hasThinkingData && (
            <div className="mb-4">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors w-full md:w-auto"
              >
                <span>
                   {message.isThinking 
                      ? "Thinking..." 
                      : (message.totalDuration 
                          ? `Thought for ${(message.totalDuration / 1000).toFixed(1)} seconds` 
                          : "Reasoning Process")
                   }
                </span>
                {showThinking ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {showThinking && (
                <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                   <ProcessFlow 
                      appState={message.isThinking ? 'experts_working' : 'completed'} // Visual approximation for history
                      managerAnalysis={message.analysis || null}
                      experts={message.experts || []}
                      defaultExpanded={true}
                   />
                </div>
              )}
            </div>
          )}

          {/* Text Content */}
          <div className="prose prose-slate max-w-none prose-p:leading-7 prose-pre:bg-slate-900 prose-pre:text-slate-50">
            {message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              message.isThinking && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse" />
            )}
          </div>
          
          {/* Internal Monologue (Synthesis Thoughts) - Optional Footer */}
          {!isUser && message.synthesisThoughts && (
             <div className="mt-4 pt-4 border-t border-slate-100">
               <details className="group/thoughts">
                 <summary className="cursor-pointer list-none text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                   <ChevronRight size={12} className="group-open/thoughts:rotate-90 transition-transform" />
                   Show Internal Monologue
                 </summary>
                 <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap max-h-40 overflow-y-auto">
                   {message.synthesisThoughts}
                 </div>
               </details>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;