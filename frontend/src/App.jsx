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
  ChevronRight,
  Terminal,
  Activity,
  Maximize2,
  FileCode,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticlesBackground } from './components/ParticlesBackground';
import { SpotlightCard } from './components/SpotlightCard';

const SAMPLE_TEMPLATES = [
  {
    tag: "Standard",
    title: "AI Chatbot Project Plan (8-Weeks)",
    category: "Project Plan",
    text: "Create a project plan for launching an AI-powered customer support chatbot for a 50-person e-commerce company within 8 weeks. Include phases, milestones, risks, owners, and success metrics."
  },
  {
    tag: "Complex",
    title: "Support Modernization Proposal",
    category: "Business Proposal",
    text: "Prepare a proposal for improving customer support at a small company with a limited budget. We want to use AI but have not chosen a vendor or defined success metrics. Make reasonable assumptions and label them clearly, compare a lightweight pilot with a full rollout, identify risks, recommend next steps, and do not invent exact costs."
  },
  {
    tag: "Technical",
    title: "Microservices Architecture Spec",
    category: "Technical Design",
    text: "Draft a Technical Design Document for a distributed real-time notification engine. Include API specifications, caching tradeoffs, retry policies, and circuit breaker patterns."
  }
];

export default function App() {
  const [requestText, setRequestText] = useState(SAMPLE_TEMPLATES[0].text);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('trace'); // 'trace' | 'json' | 'preview'
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

  // Timer during active generation
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
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 }
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
      backgroundColor: '#070b14',
      color: '#f8fafc',
      position: 'relative'
    }}>
      <ParticlesBackground />

      {/* Top Enterprise Control Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)'
          }}>
            <Zap size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.01em', color: '#ffffff' }}>
                FLUID AI
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                fontWeight: '600'
              }}>
                DOC-AGENT v1.0
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Autonomous Multi-Step Document Engine
            </span>
          </div>
        </div>

        {/* Live Telemetry Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '12px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: healthData?.status === 'healthy' ? '#10b981' : '#f59e0b'
            }} />
            <span style={{ color: '#94a3b8' }}>Engine:</span>
            <span style={{ color: '#f8fafc', fontWeight: '600' }}>
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
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'background-color 0.2s ease'
            }}
          >
            <span>FastAPI Docs</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </nav>

      {/* Main Studio Workspace */}
      <main style={{
        maxWidth: '1520px',
        margin: '0 auto',
        padding: '32px 32px 64px',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Hero Headline */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '-0.03em',
            margin: '0 0 8px',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Autonomous Document Synthesis & Review
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '780px' }}>
            Transform unstructured instructions into verified, publication-ready Word documents. Built with dynamic DAG planning, cycle verification, and reflection checks.
          </p>
        </div>

        {/* Studio Grid: Left Control Plane + Right Document Inspector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: result ? '460px 1fr' : '1fr',
          gap: '24px',
          alignItems: 'start',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>

          {/* LEFT: Generation Control Center */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <SpotlightCard style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} color="#818cf8" />
                  <span>Instruction Input</span>
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Markdown / Natural Language</span>
              </div>

              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="State your document objective..."
                rows={6}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(2, 6, 23, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s'
                }}
              />

              {/* Template Pill Carousel */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                  Enterprise Benchmark Presets:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SAMPLE_TEMPLATES.map((tmpl, i) => (
                    <button
                      key={i}
                      onClick={() => setRequestText(tmpl.text)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{tmpl.title}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8'
                      }}>
                        {tmpl.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !requestText.trim()}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  background: isGenerating
                    ? 'rgba(99, 102, 241, 0.3)'
                    : 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
                  transition: 'transform 0.1s ease'
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Executing Pipeline ({elapsedTime}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Synthesize Document</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {errorMsg && (
                <div style={{
                  marginTop: '14px',
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

            {/* Stage Architecture Breakdown */}
            <SpotlightCard style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Pipeline Architecture Guardrails
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <ShieldCheck size={15} color="#10b981" />
                  <span><strong>Factual Grounding:</strong> No invented exact budget figures</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <Cpu size={15} color="#38bdf8" />
                  <span><strong>DAG Scheduler:</strong> Kahn's algorithm cycle prevention</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <CheckCircle2 size={15} color="#818cf8" />
                  <span><strong>Self-Correction:</strong> Bounded repair on quality findings</span>
                </div>
              </div>
            </SpotlightCard>

          </div>

          {/* RIGHT: Production Document & Trace Console */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Document Master Card */}
              <SpotlightCard style={{
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.04em'
                      }}>
                        {result.document_type.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        VERIFIED DRAFT
                      </span>
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '12px 0 6px', color: '#ffffff' }}>
                      {result.title}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Artifact URL: <code style={{ color: '#38bdf8' }}>{result.document_url}</code>
                    </span>
                  </div>

                  {/* Primary Download Button */}
                  <a
                    href={`http://127.0.0.1:8000${result.document_url}`}
                    download
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '11px 20px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Download size={16} />
                    <span>Download .DOCX</span>
                  </a>
                </div>

                {/* Score & Telemetry Bar */}
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#10b981" />
                    <span style={{ color: '#94a3b8' }}>Quality Check:</span>
                    <strong style={{ color: '#10b981' }}>{result.quality_review.score * 100}% Passed</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={16} color="#38bdf8" />
                    <span style={{ color: '#94a3b8' }}>Inference Provider:</span>
                    <strong style={{ color: '#38bdf8' }}>{result.llm_mode.toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={16} color="#818cf8" />
                    <span style={{ color: '#94a3b8' }}>Tasks Executed:</span>
                    <strong style={{ color: '#f8fafc' }}>{result.plan.length} Steps</strong>
                  </div>
                </div>
              </SpotlightCard>

              {/* Multi-Tab Console (Trace / Assumptions / Raw JSON) */}
              <SpotlightCard style={{ padding: '0px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'trace', label: 'Task Execution Trace', icon: ListChecks },
                      { id: 'assumptions', label: 'Operational Assumptions', icon: ShieldCheck },
                      { id: 'json', label: 'Raw API Payload', icon: FileCode }
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
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            color: isActive ? '#a5b4fc' : '#94a3b8',
                            border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                            fontSize: '12.5px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <Icon size={14} />
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
                      {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
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
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(2, 6, 23, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>{t.description}</span>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>{t.status.toUpperCase()}</span>
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
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    backgroundColor: 'rgba(2, 6, 23, 0.85)',
                    maxHeight: '400px'
                  }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </SpotlightCard>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
