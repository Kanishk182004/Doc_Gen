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
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticlesBackground } from './components/ParticlesBackground';
import { SpotlightCard } from './components/SpotlightCard';

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

export default function App() {
  const [requestText, setRequestText] = useState(SAMPLE_TEMPLATES[0].text);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('trace'); // 'trace' | 'assumptions' | 'json'
  const [healthData, setHealthData] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);

  // Poll service health on load
  useEffect(() => {
    fetch('http://127.0.0.1:8000/health')
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

    try {
      const response = await fetch('http://127.0.0.1:8000/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: requestText.trim() })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || 'Workflow execution failed');
      }

      const data = await response.json();
      setResult(data);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#ff2a85', '#00f5a0', '#ffffff', '#ff70a6']
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050608',
      color: '#f8fafc',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Google Sans", "Segoe UI", Roboto, sans-serif'
    }}>
      <ParticlesBackground />

      {/* Top Google-Style Minimalist Nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo with neon pink-green gradient glow */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff2a85 0%, #00f5a0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255, 42, 133, 0.45)'
          }}>
            <Sparkles size={18} color="#050608" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                FLUID AI
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
                AUTONOMOUS STUDIO
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Plan • Execute • Review • Deliver
            </span>
          </div>
        </div>

        {/* Live Engine & Docs Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(12, 13, 18, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: healthData?.status === 'healthy' ? '#00f5a0' : '#ff2a85',
              boxShadow: healthData?.status === 'healthy' ? '0 0 10px #00f5a0' : '0 0 10px #ff2a85'
            }} />
            <span style={{ color: '#94a3b8' }}>Model:</span>
            <span style={{ color: '#ffffff', fontWeight: '600' }}>
              {healthData?.model || 'qwen/qwen3.8-27b'}
            </span>
          </div>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 42, 133, 0.4)',
              backgroundColor: 'rgba(255, 42, 133, 0.08)',
              color: '#ff70a6',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>Swagger API</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </nav>

      {/* Main Studio Container */}
      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px 32px 80px',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Studio Hero Title */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, rgba(255, 42, 133, 0.15) 0%, rgba(0, 245, 160, 0.15) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '12px',
            color: '#e2e8f0',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} color="#ff2a85" />
            <span>Multi-Step Directed Acyclic Graph (DAG) Agent</span>
          </div>

          <h1 style={{
            fontSize: '38px',
            fontWeight: '800',
            letterSpacing: '-0.04em',
            margin: '0 0 12px',
            lineHeight: '1.15'
          }}>
            Generate Executive Word Documents with{' '}
            <span style={{
              background: 'linear-gradient(135deg, #ff2a85 0%, #00f5a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 25px rgba(255, 42, 133, 0.35))'
            }}>
              Autonomous Reasoning
            </span>
          </h1>

          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
            Input your requirements. The agent plans dependencies, executes modular tools, evaluates quality, and renders styled .docx files.
          </p>
        </div>

        {/* Central Card: Compact Prompt Studio */}
        <div style={{ maxWidth: '860px', margin: '0 auto 40px' }}>
          <SpotlightCard style={{ padding: '24px 28px' }}>
            
            {/* Header of prompt box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} color="#00f5a0" />
                <span>Document Objective & Directives</span>
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Endpoint: POST /agent</span>
            </div>

            {/* Input Textarea */}
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="State what document you need drafted..."
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(5, 6, 8, 0.85)',
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

            {/* Compact Action Bar (Presets + Compact Button) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Preset Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

              {/* Compact Neon Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !requestText.trim()}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  background: isGenerating
                    ? 'rgba(255, 42, 133, 0.3)'
                    : 'linear-gradient(135deg, #ff2a85 0%, #00f5a0 100%)',
                  color: '#050608',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(255, 42, 133, 0.4)',
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
                backgroundColor: 'rgba(255, 42, 133, 0.15)',
                border: '1px solid rgba(255, 42, 133, 0.3)',
                color: '#ff70a6',
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

        {/* Output Section (Appears after generation) */}
        {result && (
          <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Document Header Card */}
            <SpotlightCard style={{
              padding: '28px 32px',
              border: '1px solid rgba(0, 245, 160, 0.3)',
              background: 'linear-gradient(135deg, rgba(12, 13, 18, 0.95) 0%, rgba(20, 22, 30, 0.95) 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255, 42, 133, 0.15)',
                      color: '#ff70a6',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.04em'
                    }}>
                      {result.document_type.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#00f5a0',
                      backgroundColor: 'rgba(0, 245, 160, 0.12)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontWeight: '700'
                    }}>
                      VERIFIED ARTIFACT
                    </span>
                  </div>

                  <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>
                    {result.title}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    File: <code style={{ color: '#00f5a0' }}>{result.document_url}</code>
                  </span>
                </div>

                {/* Compact Green Download Button */}
                <a
                  href={`http://127.0.0.1:8000${result.document_url}`}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#00f5a0',
                    color: '#050608',
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

              {/* Status Indicator Bar */}
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
                  <Cpu size={16} color="#ff70a6" />
                  <span style={{ color: '#94a3b8' }}>Mode:</span>
                  <strong style={{ color: '#ff70a6' }}>{result.llm_mode.toUpperCase()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={16} color="#38bdf8" />
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
                backgroundColor: 'rgba(12, 13, 18, 0.6)'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'trace', label: 'Execution Trace', icon: ListChecks },
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
                        backgroundColor: 'rgba(5, 6, 8, 0.7)',
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
                  backgroundColor: 'rgba(5, 6, 8, 0.95)',
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
  );
}
