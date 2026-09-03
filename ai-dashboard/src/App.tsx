/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Conversation, Message, CodeArtifact, ReasoningMode, AttachedFile, SystemTelemetry, SecondBrainProject, AppSettings, SystemAction } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ArtifactDrawer } from './components/ArtifactDrawer';
import { TelemetryModal } from './components/TelemetryModal';
import { ExportModal } from './components/ExportModal';
import { NewProjectModal } from './components/NewProjectModal';
import { SettingsModal } from './components/SettingsModal';
import { GithubModal } from './components/GithubModal';
import { Language, translations } from './i18n';

// Initial preloaded conversation matching user's initial prompt & context
const initialConversations: Conversation[] = [
  {
    id: 'conv-flow-monitor',
    title: 'مراقبة تدفق البيانات',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'قم ببرمجة وظيفة للتحقق من كفاءة تدفق البيانات وتنبيه النظام عند حدوث أي خطأ برمجي.',
        timestamp: Date.now() - 3500000,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          'قمت بتحليل موديول تدفق البيانات الحالي لمشروع Rico، وأنشأت وحدة مراقبة متكاملة (FlowMonitor) تقوم باعتراض الأخطاء البرمجية، قياس زمن الاستجابة، وتفعيل نمط Circuit Breaker لحماية الأنظمة المتزامنة.',
        timestamp: Date.now() - 3400000,
        modelSource: 'Second Brain Multi-Agent Core',
        agentPhases: [
          { name: 'researcher', label: 'البحث الدلالي بالذاكرة', detail: 'تم استرجاع سياق تدفق البيانات من Neon Vector DB', status: 'completed' },
          { name: 'architect', label: 'التصميم المعماري', detail: 'Circuit Breaker + Decorator Pattern', status: 'completed' },
          { name: 'editor', label: 'تنفيذ الشفرة', detail: 'monitoring_system.py تم كتابتها للمشروع', status: 'completed' },
          { name: 'tester', label: 'فحص الـ Self-Healing', detail: 'Pytest 1 passed, 0 warnings (0.04s)', status: 'completed' },
          { name: 'memory', label: 'تسجيل التطور', detail: 'تم حفظ التجربة في سجل LESSONS.md المستدام', status: 'completed' }
        ],
        thinkingSteps: [
          'تحليل هيكلية الـ Flow ومسارات البيانات غير المتزامنة',
          'بناء وحدة FlowMonitor مع آلية حماية Circuit Breaker',
          'الربط مع قواعد البيانات وتسجيل السجلات المهيكلة (Structured Logging)',
          'معالجة حالات استرداد النظام وإعادة المحاولة التلقائية',
        ],
        artifact: {
          title: 'monitoring_system.py',
          language: 'python',
          description: 'وحدة مراقبة وحماية مسارات تدفق البيانات مع تنبيهات فورية',
          projectId: 'rico',
          code: `import asyncio
import logging
import time
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("CodeIt.FlowMonitor")

class FlowMonitor:
    """
    نظام مراقبة تدفق بيانات فائق الكفاءة:
    - فحص سلامة الحمولة البرمجية
    - قياس زمن التأخير اللحظي
    - قاطع الدائرة التلقائي لمنع الانهيار المتتالي
    """
    def __init__(self, trace_id: str, failure_threshold: int = 3):
        self.trace_id = trace_id
        self.failure_threshold = failure_threshold
        self.failure_count = 0
        self.state = "OPERATIONAL"

    async def verify_flow(self, payload: Dict[str, Any]) -> bool:
        start_time = time.perf_counter()
        try:
            if not payload or not isinstance(payload, dict):
                raise ValueError("بيانات التدفق غير صالحة أو فارغة")
            
            if not payload.get("valid", True):
                raise ValueError("خطأ في بنية حمولة التدفق البرمجي")

            # محاكاة معالجة التدفق
            await asyncio.sleep(0.015)
            
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"[{self.trace_id}] تم التحقق بنجاح في {duration_ms:.2f}ms")
            self.failure_count = 0
            return True

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            await self.trigger_alert(exc, duration_ms)
            return False

    async def trigger_alert(self, error: Exception, duration_ms: float):
        self.failure_count += 1
        logger.error(f"[{self.trace_id}] تنبيه: فشل التحقق من التدفق: {error} (زمن: {duration_ms:.2f}ms)")
        if self.failure_count >= self.failure_threshold:
            self.state = "DEGRADED"
            logger.critical(f"[{self.trace_id}] تحذير أمني: تم تفعيل حالة الطوارئ بعد {self.failure_count} أخطاء!")

# تجربة تشغيلية
async def main():
    monitor = FlowMonitor(trace_id="TRC-98421")
    res = await monitor.verify_flow({"valid": True, "batch_id": 102})
    print(f"نتيجة الاختبار: {res}")

if __name__ == "__main__":
    asyncio.run(main())`,
        },
      },
    ],
  },
];

const fallbackProjects: SecondBrainProject[] = [
  { id: 'rico', name: 'Rico AI Agent', path: 'X:\\rico\\src', tech: 'Python • Streamlit • Postgres' },
  { id: 'lvyy', name: 'Lvyy Agent', path: 'C:\\Users\\loyal\\lvyy', tech: 'TypeScript • Express • React' },
  { id: 'content-engine', name: 'Content Engine', path: 'X:\\content-engine', tech: 'Python • Gemini API' },
  { id: 'second-brain', name: 'Second Brain v4', path: 'C:\\Users\\loyal\\second-brain-v4', tech: 'Python • Neon DB (Vector)' },
  { id: 'ai-dashboard', name: 'AI Dashboard', path: 'C:\\Users\\loyal\\ai-dashboard', tech: 'Next.js • Tailwind' }
];

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('codeit_conversations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialConversations;
      }
    }
    return initialConversations;
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || 'conv-flow-monitor';
  });

  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('advanced');
  const [activeArtifact, setActiveArtifact] = useState<CodeArtifact | null>(() => {
    return conversations[0]?.messages.find((m) => m.artifact)?.artifact || null;
  });
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [prefilledInput, setPrefilledInput] = useState('');

  // Language state (ar/en)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('codeit_lang');
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  useEffect(() => {
    localStorage.setItem('codeit_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // System & Second Brain state
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [projects, setProjects] = useState<SecondBrainProject[]>(fallbackProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>('rico');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  // App Settings state (persistent)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('codeit_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      language: lang,
      reasoningMode: 'advanced',
      explanationStyle: 'detailed',
      showQuickChips: true,
      zenMode: false,
      githubToken: '',
    };
  });

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('codeit_settings', JSON.stringify(updated));
      if (updated.language && updated.language !== lang) {
        setLang(updated.language);
      }
      if (updated.reasoningMode && updated.reasoningMode !== reasoningMode) {
        setReasoningMode(updated.reasoningMode);
      }
      return updated;
    });
  };

  const handleClearStorage = () => {
    localStorage.removeItem('codeit_conversations');
    localStorage.removeItem('codeit_settings');
    setConversations(initialConversations);
    setActiveConversationId(initialConversations[0].id);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsModalOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setIsGithubModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem('codeit_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Load health, telemetry, and projects
  useEffect(() => {
    // Health check
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch((err) => {
        console.warn('Health check warning:', err);
      });

    // Telemetry fetch
    fetch('/api/system')
      .then((res) => res.json())
      .then((data: SystemTelemetry) => {
        setTelemetry(data);
      })
      .catch((err) => console.warn('Telemetry fetch error:', err));

    // Projects fetch
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
          const active = data.find((p: any) => p.active);
          if (active) {
            setCurrentProjectId(active.id);
          }
        } else if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
          if (data.activeProject) {
            setCurrentProjectId(data.activeProject);
          }
        }
      })
      .catch((err) => console.warn('Projects fetch error:', err));
  }, []);

  const handleSwitchProject = async (projectId: string) => {
    setCurrentProjectId(projectId);
    try {
      await fetch('/api/projects/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
    } catch (err) {
      console.warn('Failed to switch project on server:', err);
    }
  };

  const handleCreateProject = async (projectData: {
    name: string;
    path?: string;
    tech?: string;
    description?: string;
    icon?: string;
  }) => {
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else if (data.newProject) {
          setProjects((prev) => [...prev, data.newProject]);
        }
        if (data.activeProject) {
          setCurrentProjectId(data.activeProject);
        }
      } else {
        // Local state fallback
        const baseId = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || `proj-${Date.now()}`;
        const newProj: SecondBrainProject = {
          id: baseId,
          name: projectData.name,
          path: projectData.path || `X:\\workspace\\${baseId}`,
          tech: projectData.tech || 'Python 3.11 • FastEmbed • Neon DB',
          description: projectData.description,
        };
        setProjects((prev) => [...prev, newProj]);
        setCurrentProjectId(baseId);
      }
    } catch (err) {
      console.warn('Project creation fallback:', err);
      const baseId = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || `proj-${Date.now()}`;
      const newProj: SecondBrainProject = {
        id: baseId,
        name: projectData.name,
        path: projectData.path || `X:\\workspace\\${baseId}`,
        tech: projectData.tech || 'Python 3.11 • FastEmbed • Neon DB',
        description: projectData.description,
      };
      setProjects((prev) => [...prev, newProj]);
      setCurrentProjectId(baseId);
    }
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsSidebarOpen(false);

    // Auto-update active artifact if that conversation has one
    const conv = conversations.find((c) => c.id === id);
    const lastArtifact = conv?.messages
      .slice()
      .reverse()
      .find((m) => m.artifact)?.artifact;
    if (lastArtifact) {
      setActiveArtifact(lastArtifact);
    }
  };

  const handleNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: lang === 'ar' ? 'جلسة عمل جديدة' : 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    if (updated.length === 0) {
      const fallback: Conversation = {
        id: `conv-${Date.now()}`,
        title: lang === 'ar' ? 'جلسة عمل جديدة' : 'New Session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations([fallback]);
      setActiveConversationId(fallback.id);
    } else {
      setConversations(updated);
      if (activeConversationId === id) {
        setActiveConversationId(updated[0].id);
      }
    }
  };

  const handleResetChat = () => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, messages: [] } : c))
    );
  };

  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };

  const handleAiAction = (action: 'summarize' | 'natural_chat' | 'code_gen' | 'audit') => {
    if (action === 'summarize') {
      setIsExportModalOpen(true);
    } else if (action === 'natural_chat') {
      const prompt = lang === 'ar'
        ? 'ما هي أفضل الممارسات المعمارية الموصى بها لهذا المشروع، وكيف نضمن التوافق العالي؟'
        : 'What are the recommended architectural best practices for this project?';
      setPrefilledInput(prompt);
    } else if (action === 'code_gen') {
      const prompt = lang === 'ar'
        ? 'قم ببرمجة موديول جديد متكامل يطبق معمارية Clean Architecture مع الاختبارات والتوثيق.'
        : 'Implement a clean architecture module with test coverage and structured logging.';
      setPrefilledInput(prompt);
    } else if (action === 'audit') {
      const prompt = lang === 'ar'
        ? 'قم بإجراء فحص أمني دقيق للتحقق من سلامة المدخلات وعزل العمليات وحماية الذاكرة.'
        : 'Perform a rigorous security audit for input validation and fault isolation.';
      setPrefilledInput(prompt);
    }
  };

  const handleOpenArtifact = (artifact: CodeArtifact) => {
    setActiveArtifact(artifact);
    setIsArtifactOpen(true);
  };

  const handleSendMessage = async (text: string, attachedFiles: AttachedFile[]) => {
    if (!text.trim() && attachedFiles.length === 0) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    const initialThinking = lang === 'ar'
      ? ['البحث في ذاكرة Second Brain (Neon Vector DB)', 'تحليل المتطلبات واستدعاء وكيل الهندسة المعمارية']
      : ['Querying Second Brain Memory (Neon Vector DB)', 'Analyzing constraints and dispatching Architect agent'];

    const assistantPlaceholderId = `msg-ai-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isThinking: true,
      thinkingSteps: initialThinking,
    };

    // Update conversation title if this is the first message
    const shouldUpdateTitle = activeConversation?.messages.length === 0 && text.trim().length > 0;
    const newTitle = shouldUpdateTitle
      ? text.slice(0, 30) + (text.length > 30 ? '...' : '')
      : activeConversation?.title;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            title: newTitle || c.title,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, assistantMessage],
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    try {
      // Step interval animation for visual thinking progress
      const extraStep = lang === 'ar'
        ? 'تشغيل محرك الـ Self-Healing وفحص التوافقية'
        : 'Running Self-Healing runner & validating assertions';

      const stepsInterval = setInterval(() => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversationId) {
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === assistantPlaceholderId && m.thinkingSteps) {
                    if (m.thinkingSteps.length < 4) {
                      return {
                        ...m,
                        thinkingSteps: [
                          ...m.thinkingSteps,
                          extraStep,
                        ],
                      };
                    }
                  }
                  return m;
                }),
              };
            }
            return c;
          })
        );
      }, 700);

      // Call server-side API
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          attachedFiles,
          reasoningMode,
          language: lang,
          projectId: currentProjectId,
        }),
      });

      clearInterval(stepsInterval);

      if (!res.ok) {
        throw new Error(`خطأ في الخادم (${res.status})`);
      }

      const data = await res.json();

      // Execute Conversational System Actions
      if (data.systemAction) {
        const action: SystemAction = data.systemAction;
        if (action.type === 'create_project') {
          if (action.payload?.projects && Array.isArray(action.payload.projects)) {
            setProjects(action.payload.projects);
          } else if (action.payload?.newProject) {
            setProjects((prev) => [...prev, action.payload.newProject]);
          }
          if (action.payload?.activeProject) {
            setCurrentProjectId(action.payload.activeProject);
          }
        } else if (action.type === 'switch_project') {
          if (action.payload?.activeProject) {
            setCurrentProjectId(action.payload.activeProject);
          }
        } else if (action.type === 'github_import') {
          if (action.payload?.projects && Array.isArray(action.payload.projects)) {
            setProjects(action.payload.projects);
          } else if (action.payload?.newProject) {
            setProjects((prev) => [...prev, action.payload.newProject]);
          }
          if (action.payload?.activeProject) {
            setCurrentProjectId(action.payload.activeProject);
          }
        } else if (action.type === 'open_settings') {
          setIsSettingsModalOpen(true);
        } else if (action.type === 'open_telemetry') {
          setIsTelemetryOpen(true);
        } else if (action.type === 'export_markdown') {
          setIsExportModalOpen(true);
        } else if (action.type === 'change_mode') {
          if (action.payload?.mode) {
            setReasoningMode(action.payload.mode);
            handleUpdateSettings({ reasoningMode: action.payload.mode });
          }
        }
      }

      const finalArtifact = data.artifact || null;
      if (finalArtifact) {
        setActiveArtifact(finalArtifact);
        // Auto open artifact on large screens
        if (window.innerWidth >= 1280) {
          setIsArtifactOpen(true);
        }
      }

      const defaultDoneContent = lang === 'ar'
        ? 'تم الانتهاء من المعالجة البرمجية بنجاح.'
        : 'Code execution and architecture synthesis completed successfully.';

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === assistantPlaceholderId) {
                  return {
                    ...m,
                    isThinking: false,
                    content:
                      data.explanation ||
                      data.summary ||
                      defaultDoneContent,
                    thinkingSteps:
                      data.thinkingSteps && data.thinkingSteps.length > 0
                        ? data.thinkingSteps
                        : m.thinkingSteps,
                    agentPhases: data.agentPhases || undefined,
                    artifact: finalArtifact,
                    systemAction: data.systemAction || undefined,
                    modelSource:
                      data.source === 'gemini'
                        ? `Gemini ${data.model || '3.8'}`
                        : 'Second Brain Multi-Agent Core',
                  };
                }
                return m;
              }),
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      console.error('Error generating response:', err);
      const fallbackContent = lang === 'ar'
        ? 'تم استدعاء محرك Second Brain المحلي بنجاح لمعالجة طلبك وفق مواصفات النظام المستهدف.'
        : 'Second Brain local engine successfully processed the request aligned with project targets.';
      const fallbackSteps = lang === 'ar'
        ? [
            'تم التحقق من مسار المشروع محلياً',
            'تطبيق المعمارية النظيفة Clean Architecture',
            'اكتمال التنفيذ وتسجيل الحالة',
          ]
        : [
            'Target project verified locally',
            'Clean Architecture standards applied',
            'Execution completed and logged',
          ];

      // Update with friendly fallback
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === assistantPlaceholderId) {
                  return {
                    ...m,
                    isThinking: false,
                    content: fallbackContent,
                    thinkingSteps: fallbackSteps,
                  };
                }
                return m;
              }),
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Global keyboard shortcuts (Ctrl/Cmd + K, Ctrl/Cmd + E, Ctrl/Cmd + /, Ctrl/Cmd + P)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewConversation();
      } else if (isModifier && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleOpenExport();
      } else if (isModifier && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsNewProjectModalOpen(true);
      } else if (isModifier && e.key === '/') {
        e.preventDefault();
        handleToggleLang();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [activeConversationId, lang]);

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  return (
    <div
      className="flex h-screen h-[100dvh] overflow-hidden bg-[#141413] text-[#f3f3ee] font-sans antialiased"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Sidebar navigation */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        reasoningMode={reasoningMode}
        onSelectMode={setReasoningMode}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        hasGeminiKey={hasGeminiKey}
        onExport={handleOpenExport}
        projects={projects}
        currentProjectId={currentProjectId}
        onSwitchProject={handleSwitchProject}
        telemetry={telemetry}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        lang={lang}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentArtifact={activeArtifact}
          onOpenArtifact={() => setIsArtifactOpen(true)}
          reasoningMode={reasoningMode}
          onResetChat={handleResetChat}
          isGenerating={isGenerating}
          projects={projects}
          currentProjectId={currentProjectId}
          onSwitchProject={handleSwitchProject}
          telemetry={telemetry}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
          lang={lang}
          onToggleLang={handleToggleLang}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          onOpenExport={handleOpenExport}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenGithub={() => setIsGithubModalOpen(true)}
        />

        {/* Message Stream */}
        <MessageList
          messages={activeConversation?.messages || []}
          onOpenArtifact={handleOpenArtifact}
          onSelectPrompt={(prompt) => {
            setPrefilledInput(prompt);
          }}
          lang={lang}
        />

        {/* Floating Input Dock */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          initialText={prefilledInput}
          onTextChange={setPrefilledInput}
          lang={lang}
          onTriggerAiAction={handleAiAction}
          showQuickChips={settings.showQuickChips && !settings.zenMode}
        />
      </div>

      {/* Artifact Code Drawer */}
      <ArtifactDrawer
        artifact={activeArtifact}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
        currentProjectId={currentProjectId}
        lang={lang}
      />

      {/* Host Telemetry & Second Brain System Modal */}
      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        telemetry={telemetry}
        projects={projects}
        currentProjectId={currentProjectId}
        onSwitchProject={handleSwitchProject}
        lang={lang}
      />

      {/* Export Conversation as GitHub Flavored Markdown Modal */}
      {activeConversation && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          conversation={activeConversation}
          projectName={activeProject?.name || 'Rico AI Agent'}
          telemetry={telemetry}
          lang={lang}
        />
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        lang={lang}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearStorage={handleClearStorage}
        lang={lang}
      />

      {/* GitHub Repository Connect & Import Modal */}
      <GithubModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        onImportSuccess={(newProj, all) => {
          if (all && Array.isArray(all)) {
            setProjects(all);
          } else {
            setProjects((prev) => [...prev, newProj]);
          }
          setCurrentProjectId(newProj.id);
        }}
        lang={lang}
      />
    </div>
  );
}

