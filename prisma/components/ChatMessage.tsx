
import React, { useState } from 'react';
import { User, Sparkles, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  // Check if there is any thinking data to show
  const hasThinkingData = message.analysis || (message.experts && message.experts.length > 0);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-sm text-slate-900">
              {isUser ? 'You' : 'Prisma'}
            </div>
            {message.content && (
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5
                  ${copied 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100'
                  }`}
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Copied</span>
                  </>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
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
