import React from 'react';
import { Settings, X, ChevronDown, Key, Globe } from 'lucide-react';
import { AppConfig, ModelOption, ThinkingLevel } from './types';
import { getValidThinkingLevels } from './config';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  config, 
  setConfig, 
  model 
}: {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  model: ModelOption;
}) => {
  if (!isOpen) return null;

  const validLevels = getValidThinkingLevels(model);

  const LevelSelect = ({ 
    label, 
    value, 
    onChange,
    desc 
  }: { 
    label: string, 
    value: ThinkingLevel, 
    onChange: (v: ThinkingLevel) => void,
    desc: string
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-xs text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{value}</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ThinkingLevel)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none appearance-none cursor-pointer"
        >
          {validLevels.map(l => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
      </div>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Configuration</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Connection Settings */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Connection</h3>
               {/* Toggle Switch */}
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.enableCustomApi ?? false} 
                    onChange={(e) => setConfig({ ...config, enableCustomApi: e.target.checked })} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            
            {config.enableCustomApi && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Key size={14} className="text-slate-400" />
                    Custom API Key
                  </label>
                  <input 
                    type="password"
                    placeholder="sk-..."
                    value={config.customApiKey || ''}
                    onChange={(e) => setConfig({ ...config, customApiKey: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe size={14} className="text-slate-400" />
                    Custom Base URL
                  </label>
                  <input 
                    type="text"
                    placeholder="https://generativelanguage.googleapis.com"
                    value={config.customBaseUrl || ''}
                    onChange={(e) => setConfig({ ...config, customBaseUrl: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thinking Process</h3>
            <LevelSelect 
              label="Manager: Planning Strategy" 
              value={config.planningLevel} 
              onChange={(v) => setConfig({ ...config, planningLevel: v })}
              desc="Controls the depth of initial query analysis and expert delegation."
            />
            
            <LevelSelect 
              label="Experts: Execution Depth" 
              value={config.expertLevel} 
              onChange={(v) => setConfig({ ...config, expertLevel: v })}
              desc="Determines how deeply each expert persona thinks about their specific task."
            />
            
            <LevelSelect 
              label="Manager: Final Synthesis" 
              value={config.synthesisLevel} 
              onChange={(v) => setConfig({ ...config, synthesisLevel: v })}
              desc="Controls the reasoning effort for aggregating results into the final answer."
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;