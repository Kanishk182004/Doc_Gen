import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  ShieldCheck,
  Cpu,
  Layers,
  ListChecks,
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
  Terminal,
  Activity,
  FileCode,
  Zap,
  Check,
  Loader2,
  KeyRound,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  History,
  Trash2,
  MessageSquare,
  RotateCcw,
  PanelLeftClose,
  PanelLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticlesBackground } from './components/ParticlesBackground';
import { SpotlightCard } from './components/SpotlightCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    desc: "Ultra-fast LPU inference (Free tier supported)",
    defaultModel: "openai/gpt-oss-120b",
    models: [
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (High Capacity / 8k TPM - Recommended)" },
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (Fast / 8k TPM)" },
      { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B (1k OTPM)" }
    ],
    placeholder: "gsk_..."
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "Industry standard GPT reasoning",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Cost Effective)" },
      { id: "gpt-4o", name: "GPT-4o (Flagship)" },
      { id: "o1-mini", name: "o1-mini (Reasoning)" }
    ],
    placeholder: "sk-proj-..."
  },
  {
    id: "anthropic",
    name: "Anthropic",
    desc: "Claude models with high nuance and safety",
    defaultModel: "claude-3-5-haiku-20241022",
    models: [
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Speed)" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Nuance)" }
    ],
    placeholder: "sk-ant-..."
  },
  {
    id: "gemini",
    name: "Google Gemini",
    desc: "Google DeepMind multimodal flash reasoning",
    defaultModel: "gemini-1.5-flash",
    models: [
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Deep reasoning)" }
    ],
    placeholder: "AIzaSy..."
  }
];

const SAMPLE_TEMPLATES = [
  {
    tag: "8-Week Plan",
    title: "AI Chatbot Launch",
    text: "Create a project plan for launching an AI-powered customer support chatbot for a 50-person e-commerce company within 8 weeks. Include phases, milestones, risks, owners, and success metrics."
  },
  {
    tag: "Proposal",
    title: "Support Pilot & Rollout",
    text: "Prepare a proposal for improving customer support at a small company with a limited budget. We want to use AI but have not chosen a vendor or defined success metrics. Make reasonable assumptions and label them clearly, compare a lightweight pilot with a full rollout, identify risks, recommend next steps, and do not invent exact costs."
  },
  {
    tag: "Technical Spec",
    title: "Distributed Pipeline",
    text: "Draft a Technical Design Document for a distributed real-time notification engine. Include API specifications, caching tradeoffs, retry policies, and circuit breaker patterns."
  }
];

const PIPELINE_STAGES = [
  {
    id: "stage_1",
    title: "Stage 1: Intent & Non-Fabricated Assumptions",
    desc: "Analyzing objective, audience, and enforcing zero-invented cost guardrails"
  },
  {
    id: "stage_2",
    title: "Stage 2: Dynamic DAG Planning & Cycle Verification",
    desc: "Deriving task dependencies and verifying Directed Acyclic Graph via Kahn's algorithm"
  },
  {
    id: "stage_3",
    title: "Stage 3: Tool Execution & Content Synthesis",
    desc: "Executing structure blueprints and drafting context-specific sections & comparative tables"
  },
  {
    id: "stage_4",
    title: "Stage 4: Quality Reflection & Word (.docx) Compilation",
    desc: "Evaluating title completeness, baseline metric disclaimers, and rendering styled XML document"
  }
];

export default function App() {
  const [requestText, setRequestText] = useState(SAMPLE_TEMPLATES[0].text);
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [userApiKey, setUserApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");
  const [showConfig, setShowConfig] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('trace');
  const [healthData, setHealthData] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);

  // Chat History State (Persisted in localStorage)
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('scribeai_chat_history') || localStorage.getItem('docusynth_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem('scribeai_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save chat history to localStorage', e);
    }
  }, [chatHistory]);

  // Start a fresh, clean chat
  const handleNewChat = () => {
    setActiveChatId(null);
    setResult(null);
    setErrorMsg(null);
    setRequestText('');
    setCurrentStageIdx(0);
    setElapsedTime(0);
  };

  // Switch to an existing past chat
  const handleSelectHistoryItem = (item) => {
    setActiveChatId(item.id);
    setRequestText(item.prompt);
    setResult(item.result);
    setErrorMsg(null);
    setCurrentStageIdx(4);
    if (item.provider) setSelectedProvider(item.provider);
    if (item.model) setSelectedModel(item.model);
  };

  // Delete a specific history entry
  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      handleNewChat();
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm("Clear all generation history?")) {
      setChatHistory([]);
      localStorage.removeItem('scribeai_chat_history');
      localStorage.removeItem('docusynth_chat_history');
      handleNewChat();
    }
  };

  // When provider changes, sync default model
  const handleProviderChange = (provId) => {
    setSelectedProvider(provId);
    const prov = PROVIDERS.find(p => p.id === provId);
    if (prov) {
      setSelectedModel(prov.defaultModel);
    }
  };

  // Poll service health on load
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(() => setHealthData({ status: 'offline' }));
  }, []);

  // Timer during generation
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => +(prev + 0.1).toFixed(1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!requestText.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setErrorMsg(null);
    setCurrentStageIdx(0);

    const t1 = setTimeout(() => setCurrentStageIdx(1), 800);
    const t2 = setTimeout(() => setCurrentStageIdx(2), 2200);
    const t3 = setTimeout(() => setCurrentStageIdx(3), 3600);

    try {
      const payload = {
        request: requestText.trim(),
        provider: selectedProvider,
        api_key: userApiKey.trim() || undefined,
        model: selectedModel || undefined
      };

      const response = await fetch(`${API_BASE_URL}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || 'Workflow execution failed');
      }

      const data = await response.json();
      setCurrentStageIdx(4);
      setResult(data);

      // Save into chat history (prepend newest)
      const newChatEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        prompt: requestText.trim(),
        title: data.title || "Untitled Document",
        docType: data.document_type || "Document",
        docUrl: data.document_url,
        provider: selectedProvider,
        model: selectedModel,
        result: data
      };

      setChatHistory(prev => [newChatEntry, ...prev.filter(item => item.prompt !== requestText.trim())]);
      setActiveChatId(newChatEntry.id);

      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#00f5a0', '#ffffff', '#38bdf8', '#00d287']
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentProviderObj = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#05070a',
      color: '#f8fafc',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Google Sans", "Segoe UI", Roboto, sans-serif'
    }}>
      <ParticlesBackground />

      {/* Top Cyber Emerald Nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(5, 7, 10, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f5a0 0%, #008f5d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 245, 160, 0.4)'
          }}>
            <Sparkles size={18} color="#05070a" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                SCRIBE<span style={{ color: '#00f5a0' }}>AI</span>
              </span>
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 245, 160, 0.4)',
                backgroundColor: 'rgba(0, 245, 160, 0.1)',
                color: '#00f5a0',
                fontWeight: '700',
                letterSpacing: '0.04em'
              }}>
                MULTI-PROVIDER STUDIO
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Plan • Execute • Review • Deliver
            </span>
          </div>
        </div>

        {/* Live Provider & Settings Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 245, 160, 0.12)',
              border: '1px solid rgba(0, 245, 160, 0.4)',
              color: '#00f5a0',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 245, 160, 0.25)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 245, 160, 0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: sidebarOpen ? 'rgba(0, 245, 160, 0.2)' : 'rgba(10, 13, 17, 0.8)',
              border: `1px solid ${sidebarOpen ? '#00f5a0' : 'rgba(255, 255, 255, 0.12)'}`,
              color: sidebarOpen ? '#00f5a0' : '#cbd5e1',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00f5a0';
            }}
            onMouseLeave={(e) => {
              if (!sidebarOpen) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
            <span>{sidebarOpen ? 'Hide History' : `History (${chatHistory.length})`}</span>
          </button>

          {/* LLM Selector Button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: showConfig ? 'rgba(0, 245, 160, 0.15)' : 'rgba(10, 13, 17, 0.8)',
              border: `1px solid ${showConfig ? 'rgba(0, 245, 160, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: showConfig ? '#00f5a0' : '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <SlidersHorizontal size={14} />
            <span>LLM: <strong>{currentProviderObj.name}</strong> ({selectedModel})</span>
            <ChevronDown size={13} />
          </button>

          <a
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 245, 160, 0.4)',
              backgroundColor: 'rgba(0, 245, 160, 0.08)',
              color: '#00f5a0',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <span>Swagger API</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </nav>

      {/* Main Studio Layout: Left Sidebar (Gemini style) + Main Content */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 65px)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Gemini-Style Left Sidebar */}
        <aside style={{
          width: sidebarOpen ? '280px' : '0px',
          minWidth: sidebarOpen ? '280px' : '0px',
          backgroundColor: 'rgba(7, 10, 15, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: sidebarOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 40,
          position: 'sticky',
          top: '65px',
          height: 'calc(100vh - 65px)'
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '280px' }}>
              
              {/* Top Action in Sidebar: New Chat */}
              <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  onClick={handleNewChat}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 245, 160, 0.1)',
                    border: '1px solid rgba(0, 245, 160, 0.3)',
                    color: '#00f5a0',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 245, 160, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 245, 160, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={16} />
                  <span>Start New Document</span>
                </button>
              </div>

              {/* History Section Header */}
              <div style={{
                padding: '12px 16px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                  Recent Documents ({chatHistory.length})
                </span>
                {chatHistory.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    title="Clear history"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Scrollable Chat Item List */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '6px 10px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {chatHistory.length === 0 ? (
                  <div style={{
                    padding: '36px 14px',
                    textAlign: 'center',
                    color: '#475569',
                    fontSize: '12px'
                  }}>
                    <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: '600' }}>No chat history yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Your generated documents will appear here like in Gemini</p>
                  </div>
                ) : (
                  chatHistory.map((item) => {
                    const isSelected = activeChatId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistoryItem(item)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'rgba(0, 245, 160, 0.12)' : 'transparent',
                          border: `1px solid ${isSelected ? 'rgba(0, 245, 160, 0.4)' : 'transparent'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{
                              fontSize: '9.5px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(0, 245, 160, 0.15)',
                              color: '#00f5a0',
                              fontWeight: '700'
                            }}>
                              {item.docType?.replace('Document', 'Doc') || 'Doc'}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              {item.timestamp}
                            </span>
                          </div>

                          <div style={{
                            fontSize: '12.5px',
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? '#ffffff' : '#cbd5e1',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.title || item.prompt}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          title="Delete chat"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#475569',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.7
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#475569';
                            e.currentTarget.style.opacity = '0.7';
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#64748b'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={13} color="#00f5a0" />
                  <span>Grounding Active</span>
                </span>
                <span style={{ color: '#00f5a0' }}>{PROVIDERS.find(p => p.id === selectedProvider)?.name}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '36px 32px 80px',
          minWidth: 0
        }}>

        {/* Hero Title */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '9999px',
            background: 'rgba(0, 245, 160, 0.1)',
            border: '1px solid rgba(0, 245, 160, 0.3)',
            fontSize: '12px',
            color: '#00f5a0',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} />
            <span>Autonomous Document Agent — Multi-Provider Inference</span>
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            letterSpacing: '-0.04em',
            margin: '0 0 12px',
            lineHeight: '1.15'
          }}>
            Generate Executive Word Documents with{' '}
            <span style={{
              color: '#00f5a0',
              textShadow: '0 0 25px rgba(0, 245, 160, 0.45)'
            }}>
              Autonomous Reasoning
            </span>
          </h1>

          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
            Choose Groq, OpenAI, Anthropic, or Google Gemini. Bring your own key or use default environment configuration.
          </p>
        </div>

        {/* Dynamic Provider & API Key Modal / Expandable Panel */}
        {showConfig && (
          <div style={{ maxWidth: '840px', margin: '0 auto 24px' }}>
            <SpotlightCard style={{ padding: '24px 28px', border: '1px solid rgba(0, 245, 160, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={16} color="#00f5a0" />
                  <span>LLM Provider & Custom Key Configuration</span>
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Client-side injected per request</span>
              </div>

              {/* Provider Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                {PROVIDERS.map(p => {
                  const isSelected = selectedProvider === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(0, 245, 160, 0.12)' : 'rgba(5, 7, 10, 0.6)',
                        border: `1px solid ${isSelected ? '#00f5a0' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: isSelected ? '#00f5a0' : '#cbd5e1',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700' }}>{p.name}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                        {p.models.length} models
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Model Dropdown + API Key Input in a clean 2-column row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '14px' }}>
                
                {/* Model Selector */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Select Model:
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(5, 7, 10, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  >
                    {currentProviderObj.models.map(m => (
                      <option key={m.id} value={m.id} style={{ backgroundColor: '#0a0d11', color: '#fff' }}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* API Key Input */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    API Key for {currentProviderObj.name} (Optional if set in .env):
                  </label>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder={currentProviderObj.placeholder}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(5, 7, 10, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#00f5a0',
                      fontSize: '12.5px',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  onClick={() => setShowConfig(false)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#00f5a0',
                    color: '#05070a',
                    fontWeight: '700',
                    fontSize: '11.5px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Apply Configuration
                </button>
              </div>
            </SpotlightCard>
          </div>
        )}

        {/* Central Card: Compact Prompt Studio */}
        <div style={{ maxWidth: '840px', margin: '0 auto 32px' }}>
          <SpotlightCard style={{ padding: '24px 28px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} color="#00f5a0" />
                <span>Document Objective & Directives</span>
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Endpoint: POST /agent</span>
            </div>

            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="State what document you need drafted..."
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(5, 7, 10, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#ffffff',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease'
              }}
            />

            {/* Action Bar (Presets + Compact Button) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Presets:</span>
                {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRequestText(tmpl.text)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f5a0';
                      e.currentTarget.style.color = '#00f5a0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !requestText.trim()}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  background: isGenerating
                    ? 'rgba(0, 245, 160, 0.25)'
                    : '#00f5a0',
                  color: '#05070a',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(0, 245, 160, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => !isGenerating && (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={(e) => !isGenerating && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Synthesizing ({elapsedTime}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Synthesize Document</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}
          </SpotlightCard>
        </div>

        {/* Live Task Progress Tracker */}
        {(isGenerating || result) && (
          <div style={{ maxWidth: '840px', margin: '0 auto 36px' }}>
            <SpotlightCard style={{ padding: '22px 26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="#00f5a0" />
                  <span>Pipeline Execution Status</span>
                </span>
                <span style={{ fontSize: '12px', color: '#00f5a0', fontWeight: '600' }}>
                  {isGenerating ? `Processing (${elapsedTime}s)` : 'Execution Completed'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PIPELINE_STAGES.map((stg, idx) => {
                  const isDone = isGenerating ? currentStageIdx > idx : true;
                  const isCurrent = isGenerating && currentStageIdx === idx;

                  return (
                    <div
                      key={stg.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: isCurrent ? 'rgba(0, 245, 160, 0.08)' : 'rgba(5, 7, 10, 0.5)',
                        border: isCurrent 
                          ? '1px solid rgba(0, 245, 160, 0.4)' 
                          : isDone 
                          ? '1px solid rgba(0, 245, 160, 0.2)' 
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDone ? '#00f5a0' : isCurrent ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: isDone ? '#05070a' : isCurrent ? '#00f5a0' : '#64748b',
                        boxShadow: isDone ? '0 0 12px rgba(0, 245, 160, 0.5)' : 'none',
                        flexShrink: 0
                      }}>
                        {isDone ? (
                          <Check size={15} strokeWidth={3} />
                        ) : isCurrent ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>{idx + 1}</span>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: isDone || isCurrent ? '#ffffff' : '#94a3b8'
                          }}>
                            {stg.title}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: isDone ? '#00f5a0' : isCurrent ? '#38bdf8' : '#64748b'
                          }}>
                            {isDone ? 'COMPLETED' : isCurrent ? 'RUNNING...' : 'PENDING'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {stg.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>
          </div>
        )}

        {/* Output Section */}
        {result && (
          <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <SpotlightCard style={{
              padding: '28px 32px',
              border: '1px solid rgba(0, 245, 160, 0.3)',
              background: 'linear-gradient(135deg, rgba(10, 13, 17, 0.95) 0%, rgba(18, 22, 28, 0.95) 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(0, 245, 160, 0.15)',
                      color: '#00f5a0',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.04em'
                    }}>
                      {result.document_type.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#00f5a0',
                      backgroundColor: 'rgba(0, 245, 160, 0.1)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontWeight: '700'
                    }}>
                      QUALITY VERIFIED
                    </span>
                  </div>

                  <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>
                    {result.title}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    File: <code style={{ color: '#00f5a0' }}>{result.document_url}</code>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={handleNewChat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f5a0';
                      e.currentTarget.style.color = '#00f5a0';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.color = '#f8fafc';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Plus size={15} />
                    <span>Start New Chat</span>
                  </button>

                  <a
                    href={`${API_BASE_URL}${result.document_url}`}
                    download
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#00f5a0',
                      color: '#05070a',
                      padding: '10px 22px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      boxShadow: '0 0 20px rgba(0, 245, 160, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <Download size={15} />
                    <span>Download .DOCX</span>
                  </a>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '24px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#00f5a0" />
                  <span style={{ color: '#94a3b8' }}>Quality Check:</span>
                  <strong style={{ color: '#00f5a0' }}>{result.quality_review.score * 100}% Passed</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={16} color="#00f5a0" />
                  <span style={{ color: '#94a3b8' }}>Active Provider:</span>
                  <strong style={{ color: '#00f5a0' }}>{result.llm_mode.toUpperCase()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={16} color="#00f5a0" />
                  <span style={{ color: '#94a3b8' }}>DAG Tasks:</span>
                  <strong style={{ color: '#f8fafc' }}>{result.plan.length} Completed</strong>
                </div>
              </div>
            </SpotlightCard>

            {/* Multi-Tab Console */}
            <SpotlightCard style={{ padding: '0px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(10, 13, 17, 0.6)'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'trace', label: 'Detailed Task Results', icon: ListChecks },
                    { id: 'assumptions', label: 'Operational Assumptions', icon: ShieldCheck },
                    { id: 'json', label: 'JSON Payload', icon: FileCode }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          backgroundColor: isActive ? 'rgba(0, 245, 160, 0.12)' : 'transparent',
                          color: isActive ? '#00f5a0' : '#94a3b8',
                          border: isActive ? '1px solid rgba(0, 245, 160, 0.3)' : '1px solid transparent',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon size={13} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {activeTab === 'json' && (
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={12} color="#00f5a0" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Execution Trace */}
              {activeTab === 'trace' && (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.plan.map((t, idx) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(5, 7, 10, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 245, 160, 0.15)',
                        color: '#00f5a0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>{t.description}</span>
                          <span style={{ fontSize: '10.5px', color: '#00f5a0', fontWeight: '800' }}>{t.status.toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t.result}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Assumptions */}
              {activeTab === 'assumptions' && (
                <div style={{ padding: '20px' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7' }}>
                    {result.assumptions.map((a, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tab 3: Raw JSON */}
              {activeTab === 'json' && (
                <pre style={{
                  margin: 0,
                  padding: '20px',
                  fontSize: '12px',
                  color: '#00f5a0',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  backgroundColor: 'rgba(5, 7, 10, 0.95)',
                  maxHeight: '380px'
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </SpotlightCard>

          </div>
        )}

      </main>
      </div>
    </div>
  );
}
