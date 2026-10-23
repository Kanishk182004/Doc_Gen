import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

export function AuthModal({ isOpen, onClose, onAuthSuccess, apiBaseUrl }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
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
        throw new Error(data.detail || 'Authentication failed. Please verify your details.');
      }

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSimulatedAuth = async () => {
    setError('');
    setLoading(true);
    try {
      // Direct fast Google account sign-in
      const promptEmail = window.prompt("Enter your Google Account email to sign in:", email || "user@gmail.com");
      if (!promptEmail) {
        setLoading(false);
        return;
      }
      const promptName = promptEmail.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = promptName.charAt(0).toUpperCase() + promptName.slice(1);

      const res = await fetch(`${apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: promptEmail,
          name: formattedName,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(promptEmail)}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google sign in failed');
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        <SpotlightCard style={{
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 245, 160, 0.35)',
          backgroundColor: '#0a0d11',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 245, 160, 0.15)'
        }}>
          {/* Close Button */}
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

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 245, 160, 0.1)',
              border: '1px solid rgba(0, 245, 160, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Sparkles size={20} color="#00f5a0" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px', color: '#fff' }}>
              {mode === 'login' ? 'Welcome Back to ScribeAI' : 'Create Your ScribeAI Account'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              {mode === 'login' ? 'Access your generated documents & saved API keys' : 'Generate executive-grade documents with persistent history'}
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

          {/* Google One-Click Button */}
          <button
            onClick={handleGoogleSimulatedAuth}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            {/* Google SVG Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or continue with email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    placeholder="Jordan Student"
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
                padding: '11px 16px',
                borderRadius: '8px',
                backgroundColor: '#00f5a0',
                border: 'none',
                color: '#05070a',
                fontSize: '13px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{mode === 'login' ? 'Sign In to Studio' : 'Create Free Account'}</span>
            </button>
          </form>

          {/* Toggle Mode */}
          <div style={{ textAlign: 'center', marginTop: '18px' }}>
            <button
              onClick={() => {
                setError('');
                setMode(mode === 'login' ? 'signup' : 'login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {mode === 'login' ? (
                <span>Don't have an account? <strong style={{ color: '#00f5a0' }}>Sign Up</strong></span>
              ) : (
                <span>Already have an account? <strong style={{ color: '#00f5a0' }}>Sign In</strong></span>
              )}
            </button>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
