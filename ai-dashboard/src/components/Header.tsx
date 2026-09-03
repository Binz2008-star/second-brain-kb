import React, { useState } from 'react';
import { Menu, Code2, RefreshCw, Server, ChevronDown, Check, Globe, Plus, Share2, Settings, Github } from 'lucide-react';
import { CodeArtifact, ReasoningMode, SecondBrainProject, SystemTelemetry } from '../types';
import { Language, translations } from '../i18n';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentArtifact: CodeArtifact | null;
  onOpenArtifact: () => void;
  reasoningMode: ReasoningMode;
  onResetChat: () => void;
  isGenerating: boolean;
  projects: SecondBrainProject[];
  currentProjectId: string;
  onSwitchProject: (id: string) => void;
  telemetry: SystemTelemetry | null;
  onOpenTelemetry: () => void;
  lang: Language;
  onToggleLang: () => void;
  onOpenNewProject: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenGithub: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentArtifact,
  onOpenArtifact,
  reasoningMode,
  onResetChat,
  isGenerating,
  projects,
  currentProjectId,
  onSwitchProject,
  telemetry,
  onOpenTelemetry,
  lang,
  onToggleLang,
  onOpenNewProject,
  onOpenExport,
  onOpenSettings,
  onOpenGithub,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const t = translations[lang];

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  return (
    <header
      id="main-header"
      className="py-2.5 px-3 sm:px-6 flex items-center justify-between border-b border-white/[0.06] shrink-0 sticky top-0 bg-[#141413]/90 backdrop-blur-md z-20"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-stone-400 hover:text-stone-100 hover:bg-white/5 rounded-lg active:scale-95 transition-transform"
          title={t.appName}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {/* Project Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-200 text-xs font-medium transition-colors"
              title={t.projectSwitcher}
            >
              <span className="w-2 h-2 rounded-full bg-[#d97757]" />
              <span className="font-semibold text-[11px] truncate max-w-[110px] sm:max-w-[150px]">
                {activeProject ? activeProject.name : 'Rico AI Agent'}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-500" />
            </button>

            {/* Dropdown Menu */}
            {isProjectDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProjectDropdownOpen(false)}
                />
                <div
                  className={`absolute top-full mt-1.5 w-64 bg-[#1b1b1a] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 ${
                    lang === 'ar' ? 'right-0' : 'left-0'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-500 flex items-center justify-between">
                    <span>{t.connectedProjects}</span>
                    <span className="text-[#d97757] font-semibold">{projects.length}</span>
                  </div>
                  {projects.map((p) => {
                    const isSelected = p.id === currentProjectId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSwitchProject(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          lang === 'ar' ? 'text-right' : 'text-left'
                        } ${
                          isSelected
                            ? 'bg-[#d97757]/15 text-[#d97757] font-medium'
                            : 'text-stone-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-medium text-stone-100 truncate">{p.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono truncate max-w-[170px]">
                            {p.path}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#d97757] shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Create New Project Option */}
                  <div className="pt-1.5 mt-1 border-t border-white/5">
                    <button
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        onOpenNewProject();
                      }}
                      className={`w-full p-2 rounded-lg flex items-center gap-2 text-xs text-[#d97757] hover:bg-[#d97757]/10 transition-colors font-medium ${
                        lang === 'ar' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.newProject.button}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Host Telemetry Quick Button */}
          <button
            onClick={onOpenTelemetry}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-stone-400 hover:text-stone-200 text-[11px] font-mono transition-colors"
            title={t.hostTelemetry}
          >
            <Server className="w-3 h-3 text-emerald-400" />
            <span>ROBEN:</span>
            <span className="text-stone-300">{telemetry ? `${telemetry.cpu}%` : '44.8%'}</span>
            <span className="text-stone-600">•</span>
            <span className="text-amber-400/90">{telemetry ? `${telemetry.disk.usePct}% D` : '80.9% D'}</span>
          </button>

          <span className="text-[11px] text-stone-400 hidden xl:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-300 font-medium">{t.modes[reasoningMode].label}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Connect GitHub Button */}
        <button
          id="header-github-btn"
          onClick={onOpenGithub}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-300 hover:text-stone-100 text-xs font-medium transition-all active:scale-95"
          title={t.github.title}
        >
          <Github className="w-3.5 h-3.5 text-stone-300" />
          <span className="hidden sm:inline text-[11px]">{t.github.button}</span>
        </button>

        {/* System Settings Button */}
        <button
          id="header-settings-btn"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-300 hover:text-stone-100 text-xs font-medium transition-all active:scale-95"
          title={t.settings.title}
        >
          <Settings className="w-3.5 h-3.5 text-[#d97757]" />
          <span className="hidden sm:inline text-[11px]">{t.settings.button}</span>
        </button>

        {/* Export Session as GFM Markdown Button */}
        <button
          id="header-export-btn"
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-300 hover:text-stone-100 text-xs font-medium transition-all active:scale-95"
          title={t.exportMarkdown.title}
        >
          <Share2 className="w-3.5 h-3.5 text-[#d97757]" />
          <span className="hidden md:inline text-[11px]">{lang === 'ar' ? 'تصدير' : 'Export'}</span>
        </button>

        {/* Language Switcher Button */}
        <button
          id="lang-toggle-btn"
          onClick={onToggleLang}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-stone-300 hover:text-stone-100 text-xs font-medium transition-all active:scale-95"
          title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-[#d97757]" />
          <span className="font-medium text-[11px]">{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Reset Chat Button */}
        <button
          onClick={onResetChat}
          disabled={isGenerating}
          className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-white/5 rounded-lg text-xs flex items-center gap-1 transition-colors"
          title={t.clearChat}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{t.clearChat}</span>
        </button>

        {/* Artifact Preview Pill */}
        {currentArtifact && (
          <button
            id="header-preview-code-btn"
            onClick={onOpenArtifact}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 text-xs font-medium transition-all shadow-xs active:scale-95"
          >
            <Code2 className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="font-mono-code text-[11px] truncate max-w-[90px] sm:max-w-[130px]">
              {currentArtifact.title}
            </span>
            <span className="text-[10px] text-[#d97757] bg-[#d97757]/10 px-1.5 py-0.5 rounded">
              {t.message.inspectCode.split(' ')[0]}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
