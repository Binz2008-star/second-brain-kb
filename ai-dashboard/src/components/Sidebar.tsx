import React from 'react';
import {
  MessageSquare,
  Plus,
  Shield,
  Layers,
  Terminal,
  Trash2,
  Cpu,
  Zap,
  Download,
  X,
  Server,
} from 'lucide-react';
import { Conversation, ReasoningMode, SecondBrainProject, SystemTelemetry } from '../types';
import { Language, translations } from '../i18n';
import { getModifierKey } from '../utils/platform';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  reasoningMode: ReasoningMode;
  onSelectMode: (mode: ReasoningMode) => void;
  isOpen: boolean;
  onClose: () => void;
  hasGeminiKey: boolean;
  onExport: () => void;
  projects: SecondBrainProject[];
  currentProjectId: string;
  onSwitchProject: (id: string) => void;
  telemetry: SystemTelemetry | null;
  onOpenTelemetry: () => void;
  lang: Language;
  onOpenNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  reasoningMode,
  onSelectMode,
  isOpen,
  onClose,
  hasGeminiKey,
  onExport,
  projects,
  currentProjectId,
  onSwitchProject,
  telemetry,
  onOpenTelemetry,
  lang,
  onOpenNewProject,
}) => {
  const t = translations[lang];
  const modKey = getModifierKey();

  const modeItems: Array<{ id: ReasoningMode; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = [
    {
      id: 'fast',
      label: t.modes.fast.label,
      desc: t.modes.fast.desc,
      icon: Zap,
    },
    {
      id: 'advanced',
      label: t.modes.advanced.label,
      desc: t.modes.advanced.desc,
      icon: Cpu,
    },
    {
      id: 'security',
      label: t.modes.security.label,
      desc: t.modes.security.desc,
      icon: Shield,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 ${
          lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'
        } z-40 w-72 bg-[#1b1b1a] border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : lang === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Workspace Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center text-[#d97757]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-stone-100 flex items-center gap-1.5">
                <span>{t.appName}</span>
                <span className="text-[10px] font-mono-code text-stone-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  v4.0
                </span>
              </h1>
              <p className="text-[11px] text-stone-400 truncate max-w-[150px]">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-stone-400 hover:text-stone-100 hover:bg-white/5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Session Action */}
        <div className="p-3">
          <button
            id="new-session-btn"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-stone-200 text-xs font-medium border border-white/[0.08] flex items-center justify-between transition-all group active:scale-98"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-[#d97757] group-hover:rotate-90 transition-transform duration-200" />
              <span>{t.newChat}</span>
            </span>
            <span className="text-[10px] font-mono-code text-stone-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
              {modKey}+K
            </span>
          </button>
        </div>

        {/* Connected Projects List */}
        <div className="px-3 pb-2 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
              {t.connectedProjects} ({projects.length})
            </span>
            <button
              onClick={onOpenTelemetry}
              className="text-[10px] font-mono text-[#d97757] hover:underline"
            >
              {lang === 'ar' ? 'القياسات ↗' : 'Telemetry ↗'}
            </button>
          </div>
          <div className="space-y-1">
            {projects.map((p) => {
              const isSelected = p.id === currentProjectId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSwitchProject(p.id)}
                  className={`w-full ${
                    lang === 'ar' ? 'text-right' : 'text-left'
                  } px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#d97757]/15 border border-[#d97757]/30 text-stone-100 font-medium'
                      : 'text-stone-400 hover:bg-white/5 hover:text-stone-200 border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <span className="block truncate">{p.name}</span>
                    <span className="text-[9px] text-stone-500 font-mono block truncate">
                      {p.path.split(/[\\/]/).slice(-1)[0]}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97757] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onOpenNewProject();
              onClose();
            }}
            className={`w-full mt-2 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-[#d97757] hover:bg-[#d97757]/10 transition-colors font-medium border border-[#d97757]/20 ${
              lang === 'ar' ? 'text-right' : 'text-left'
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{t.newProject.button}</span>
          </button>
        </div>

        {/* Reasoning Mode Selector */}
        <div className="px-3 py-2 border-b border-white/[0.05]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-2 px-1">
            {t.modes.title}
          </span>
          <div className="space-y-1">
            {modeItems.map((item) => {
              const Icon = item.icon;
              const isSelected = reasoningMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectMode(item.id)}
                  className={`w-full ${
                    lang === 'ar' ? 'text-right' : 'text-left'
                  } p-2 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-white/10 border-white/20 text-stone-100 font-medium'
                      : 'bg-white/[0.02] border-transparent text-stone-400 hover:bg-white/5 hover:text-stone-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-[#d97757]' : 'text-stone-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 leading-snug">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions / Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-1 px-1">
            {t.chatHistory}
          </span>
          {conversations.length === 0 && (
            <div className="text-center py-6 text-stone-400 text-xs font-mono">
              {t.noHistory}
            </div>
          )}
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  <span className="truncate">{conv.title}</span>
                </div>

                {conversations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-rose-400 transition-opacity"
                    title={lang === 'ar' ? 'حذف الجلسة' : 'Delete session'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions & Telemetry Snapshot */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {/* Telemetry quick card */}
          <div
            onClick={onOpenTelemetry}
            className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-stone-300 font-mono">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>ROBEN • Windows</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">12 Cores</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>CPU: {telemetry?.cpu || 44.8}%</span>
              <span>RAM: 14.1 GB</span>
              <span className="text-amber-400">Disk: {telemetry?.disk.usePct || 80.95}%</span>
            </div>
          </div>

          <button
            onClick={onExport}
            className="w-full py-1.5 px-3 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/5 text-xs flex items-center justify-between transition-colors"
            title={t.exportChat}
          >
            <span className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-stone-400" />
              <span>{t.exportChat}</span>
            </span>
            <span className="text-[10px] font-mono text-stone-500">{modKey}+E</span>
          </button>
        </div>
      </aside>
    </>
  );
};
