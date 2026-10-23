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
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticlesBackground } from './components/ParticlesBackground';
import { SpotlightCard } from './components/SpotlightCard';

const SAMPLE_REQUESTS = [
  {
    title: "AI Chatbot Project Plan (8-Weeks)",
    category: "Project Plan",
    text: "Create a project plan for launching an AI-powered customer support chatbot for a 50-person e-commerce company within 8 weeks. Include phases, milestones, risks, owners, and success metrics."
  },
  {
    title: "Support Modernization Proposal",
    category: "Business Proposal",
    text: "Prepare a proposal for improving customer support at a small company with a limited budget. We want to use AI but have not chosen a vendor or defined success metrics. Make reasonable assumptions and label them clearly, compare a lightweight pilot with a full rollout, identify risks, recommend next steps, and do not invent exact costs."
  },
  {
    title: "Healthcare Nurse Onboarding SOP",
    category: "SOP",
    text: "Draft a Standard Operating Procedure (SOP) for onboarding specialized clinical nursing staff within a 14-day training timeframe. Include compliance milestones, patient privacy guidelines, and evaluation rubrics."
  }
];

export default function App() {
  const [requestText, setRequestText] = useState(SAMPLE_REQUESTS[0].text);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [healthData, setHealthData] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Poll service health on load
  useEffect(() => {
    fetch('http://127.0.0.1:8000/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(() => setHealthData({ status: 'offline' }));
  }, []);

  const handleGenerate = async () => {
    if (!requestText.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setErrorMsg(null);
    setActiveStep(1);

    // Simulate animated step transitions for transparency
    const stepTimer1 = setTimeout(() => setActiveStep(2), 1200);
    const stepTimer2 = setTimeout(() => setActiveStep(3), 2600);

    try {
      const response = await fetch('http://127.0.0.1:8000/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: requestText.trim() })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || 'Agent execution failed');
      }

      const data = await response.json();
      setResult(data);
      setActiveStep(4);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      setErrorMsg(err.message);
      setActiveStep(0);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      padding: '40px 24px 80px'
    }}>
      <ParticlesBackground />

      <div style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Navigation / Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)'
            }}>
              <Sparkles size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
                Autonomous Document Agent
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>
                Plan, Execute, Review, Deliver — Executive DOCX Generation
              </p>
            </div>
          </div>

          {/* Service Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: healthData?.status === 'healthy' ? '#10b981' : '#f59e0b'
            }} />
            <span style={{ color: '#cbd5e1' }}>
              Model: <strong style={{ color: '#38bdf8' }}>{healthData?.model || 'qwen/qwen3.8-27b'}</strong>
            </span>
          </div>
        </header>

        {/* Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.2fr' : '1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Intake & Prompt Studio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Prompt Studio Card */}
            <SpotlightCard style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#818cf8" />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>Stage 1 — Natural Language Intake</span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>FastAPI Endpoint: POST /agent</span>
              </div>

              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Describe your desired business document (e.g., project plan, proposal, technical architecture, SOP)..."
                rows={5}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  fontFamily: 'inherit'
                }}
              />

              {/* Sample Quick Selector */}
              <div style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                  Quick Demonstration Presets:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SAMPLE_REQUESTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRequestText(sample.text)}
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !requestText.trim()}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: isGenerating 
                    ? 'rgba(99, 102, 241, 0.4)'
                    : 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Orchestrating Autonomous Workflow...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Executive Document</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {errorMsg && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </SpotlightCard>

            {/* Workflow Pipeline Tracker */}
            <SpotlightCard style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="#38bdf8" />
                <span>Autonomous Lifecycle Execution</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { step: 1, label: "Stage 1: Intent Analysis & Non-Fabricated Assumptions" },
                  { step: 2, label: "Stage 2: Dynamic DAG Planning & Cycle Check (Kahn's Algorithm)" },
                  { step: 3, label: "Stage 3 & 4: Tool Execution & Content Synthesis" },
                  { step: 4, label: "Stage 5 & 6: Reflection Review & Word (.docx) Compilation" }
                ].map((item) => {
                  const isDone = activeStep > item.step || result;
                  const isCurrent = activeStep === item.step && isGenerating;
                  return (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: isDone ? '#10b981' : isCurrent ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                        color: isDone || isCurrent ? '#ffffff' : '#94a3b8',
                        transition: 'all 0.3s ease'
                      }}>
                        {isDone ? <CheckCircle2 size={16} /> : item.step}
                      </div>
                      <span style={{
                        fontSize: '13px',
                        color: isDone ? '#f8fafc' : isCurrent ? '#38bdf8' : '#64748b',
                        fontWeight: isCurrent ? '600' : '400'
                      }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>

          </div>

          {/* Right Column: Execution Output & Artifact Showcase */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Document Overview Banner */}
              <SpotlightCard style={{
                padding: '28px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      {result.document_type}
                    </span>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '12px 0 6px', color: '#ffffff' }}>
                      {result.title}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                      Request ID: <code style={{ color: '#38bdf8' }}>{result.request_id}</code>
                    </p>
                  </div>

                  <a
                    href={`http://127.0.0.1:8000${result.document_url}`}
                    download
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Download size={16} />
                    <span>Download DOCX</span>
                  </a>
                </div>

                {/* Quality Score & Status Chips */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <ShieldCheck size={16} color="#10b981" />
                    <span>Quality Pass: <strong style={{ color: '#10b981' }}>{result.quality_review.score * 100}% Score</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <Cpu size={16} color="#38bdf8" />
                    <span>Inference Mode: <strong style={{ color: '#38bdf8' }}>{result.llm_mode}</strong></span>
                  </div>
                </div>
              </SpotlightCard>

              {/* Execution Plan DAG Trace */}
              <SpotlightCard style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListChecks size={18} color="#818cf8" />
                  <span>Dynamic Execution Trace (Multi-Step Plan)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.plan.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(2, 6, 23, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>{task.id.toUpperCase()}</span>
                        <span style={{
                          fontSize: '11px',
                          color: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {task.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '500', marginBottom: '4px' }}>
                        {task.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Result: {task.result}
                      </div>
                    </div>
                  ))}
                </div>
              </SpotlightCard>

              {/* Grounded Assumptions */}
              <SpotlightCard style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 12px' }}>
                  Operational Assumptions & Guardrails
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7' }}>
                  {result.assumptions.map((assump, idx) => (
                    <li key={idx}>{assump}</li>
                  ))}
                </ul>
              </SpotlightCard>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
