import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

export function AuthModal({ isOpen, onClose, onAuthSuccess, apiBaseUrl, isForced = false }) {
  const [mode, setMode] = useState('signup'); // Default directly to signup/login
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? `${apiBaseUrl}/auth/register` : `${apiBaseUrl}/auth/login`;
      const payload = mode === 'signup' 
        ? { email, name, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed. Please check your credentials.');
      }

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(5, 7, 10, 0.92)',
      backdropFilter: 'blur(12px)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <SpotlightCard style={{
          padding: '36px 32px',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          backgroundColor: '#0d1117',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
        }}>
          {/* Close button only shown if not strictly forced */}
          {!isForced && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Sparkles size={22} color="#38bdf8" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px', color: '#fff' }}>
              {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              {mode === 'signup' 
                ? 'Sign up to start synthesizing executive-ready documents'
                : 'Sign in to access your documents and agent studio'}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Smith"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(5, 7, 10, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(5, 7, 10, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(5, 7, 10, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#38bdf8',
                border: 'none',
                color: '#080b10',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                transition: 'all 0.15s ease',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In to ScribeAI'}</span>
            </button>
          </form>

          {/* Toggle Mode */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                setError('');
                setMode(mode === 'signup' ? 'login' : 'signup');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              {mode === 'signup' ? (
                <span>Already have an account? <strong style={{ color: '#38bdf8' }}>Sign In</strong></span>
              ) : (
                <span>Don't have an account? <strong style={{ color: '#38bdf8' }}>Sign Up</strong></span>
              )}
            </button>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
