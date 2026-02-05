import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ─── CONSTANTS ──────────────────────────────────────────────────────
const ACCENT = '#c47d5a';
const GOLD = '#c9a84c';
const ROSE = '#d4728c';
const BG = '#faf7f5';
const DARK = '#1a1215';
const CARD = '#ffffff';
const MUTED = '#8a7e7a';
const BORDER = '#ede8e4';
const SUCCESS = '#4caf7d';
const WARN = '#e8a838';

const STATUS_MAP = {
  confirmed: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Confirmed' },
  pending: { bg: '#fff3e0', fg: '#e65100', label: 'Pending' },
  completed: { bg: '#e3f2fd', fg: '#1565c0', label: 'Completed' },
  cancelled: { bg: '#fce4ec', fg: '#c62828', label: 'Cancelled' },
  arrived: { bg: '#e0f7fa', fg: '#00695c', label: 'Arrived' },
  in_progress: { bg: '#f3e5f5', fg: '#7b1fa2', label: 'In Progress' },
  no_show: { bg: '#fce4ec', fg: '#880e4f', label: 'No Show' },
};

const CATEGORIES_ICONS = {
  Braids: '✦', Hair: '✂', Nails: '💅', Skincare: '✨', Spa: '🧖', Makeup: '💄',
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = d => { const dt = new Date(d + 'T00:00:00'); return `${DAYS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]}`; };
const fmtTime = t => { const [h,m] = t.split(':'); const hr = +h; return `${hr > 12 ? hr-12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── STYLES ─────────────────────────────────────────────────────────
const css = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; background:${BG}; color:${DARK}; -webkit-font-smoothing:antialiased; }
  input,textarea,select,button { font-family:inherit; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
  @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  .fade-up { animation: fadeUp .4s ease both; }
  .slide-up { animation: slideUp .35s cubic-bezier(.16,1,.3,1) both; }
  .shimmer { background: linear-gradient(90deg, #f0ebe7 25%, #faf7f5 50%, #f0ebe7 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:12px; }
  ::-webkit-scrollbar { width:0; height:0; }
  input:focus,textarea:focus,select:focus { outline:none; border-color:${ACCENT} !important; box-shadow:0 0 0 3px ${ACCENT}22; }
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
`;

// ─── IMAGE UPLOAD UTILITY ─────────────────────────────────────────
async function uploadImage(bucket, folder, file) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

// ─── ICONS (inline SVG) ─────────────────────────────────────────────
const Icon = ({ name, size = 20, color = DARK, ...p }) => {
  const paths = {
    home: <><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    star: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z" fill={color}/></>,
    starO: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    map: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
    back: <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
    close: <><path d="M18 6L6 18M6 6l12 12"/></>,
    check: <><path d="M20 6L9 17l-5-5"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
    sparkle: <><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>,
    gift: <><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 010-5C9 3 12 6 12 8M16.5 8a2.5 2.5 0 000-5C15 3 12 6 12 8"/></>,
    chevR: <><path d="M9 18l6-6-6-6"/></>,
    filter: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>,
    scissors: <><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{paths[name]}</svg>
  );
};

// ─── SHARED COMPONENTS ──────────────────────────────────────────────
const Badge = ({ children, bg, fg }) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:bg, color:fg }}>{children}</span>
);

const Stars = ({ rating, size = 14 }) => (
  <span style={{ display:'inline-flex', gap:1 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= rating ? GOLD : 'none'}
        stroke={i <= rating ? GOLD : '#ccc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z"/>
      </svg>
    ))}
  </span>
);

const Btn = ({ children, variant = 'primary', full, small, disabled, onClick, style: s }) => {
  const base = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius:12, fontWeight:600, transition:'all .2s', opacity: disabled ? .5 : 1,
    width: full ? '100%' : 'auto', padding: small ? '8px 16px' : '13px 24px', fontSize: small ? 13 : 15 };
  const vars = {
    primary: { background:ACCENT, color:'#fff' },
    secondary: { background:'#f0ebe7', color:DARK },
    outline: { background:'transparent', color:ACCENT, border:`1.5px solid ${ACCENT}` },
    ghost: { background:'transparent', color:MUTED },
    gold: { background:GOLD, color:'#fff' },
    rose: { background:ROSE, color:'#fff' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...vars[variant], ...s }}>{children}</button>;
};

const BottomSheet = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(2px)' }} />
      <div className="slide-up" style={{ position:'relative', background:CARD, borderRadius:'24px 24px 0 0', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:BORDER, position:'absolute', top:8, left:'50%', transform:'translateX(-50%)' }} />
          <h3 style={{ fontSize:18, fontFamily:'Fraunces,serif', fontWeight:600, marginTop:8 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><Icon name="close" size={20} color={MUTED} /></button>
        </div>
        <div style={{ padding:20, overflowY:'auto', flex:1 }}>{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'success' }) => (
  <div className="fade-up" style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', zIndex:2000,
    background: type === 'success' ? '#2e7d32' : '#c62828', color:'#fff', padding:'12px 24px', borderRadius:50, fontSize:14,
    fontWeight:600, boxShadow:'0 8px 32px rgba(0,0,0,.2)', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
    <Icon name={type === 'success' ? 'check' : 'close'} size={16} color="#fff" />{message}
  </div>
);

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign:'center', padding:'48px 20px' }}>
    <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
    <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>{title}</div>
    <div style={{ fontSize:14, color:MUTED }}>{sub}</div>
  </div>
);

const Skeleton = ({ h = 120, r = 16 }) => <div className="shimmer" style={{ height:h, borderRadius:r, marginBottom:12 }} />;

// ─── AUTH SCREENS ───────────────────────────────────────────────────
function AuthScreen({ onAuth, onDemo }) {
  const [mode, setMode] = useState('login'); // login | signup | confirm | forgot | reset_sent
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill in all fields');
    setSubmitting(true); setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (err) return setError(err.message === 'Email not confirmed' ? 'Please check your email and confirm your account first.' : err.message);
    onAuth(data.user);
  };

  const handleSignup = async () => {
    if (!email || !password || !name) return setError('Name, email & password required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setSubmitting(true); setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, phone } }
    });
    setSubmitting(false);
    if (err) return setError(err.message);
    if (data.user) {
      const code = (name.slice(0,3) + data.user.id.slice(0,4)).toUpperCase();
      const insertData = {
        auth_user_id: data.user.id, name, phone, email, referral_code: code,
        glow_points: 0, total_points_earned: 0, total_bookings: 0, total_spent: 0,
        is_active: true, account_status: 'active',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      // Handle referral
      if (referralCode.trim()) {
        const { data: referrer } = await supabase.from('clients').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single();
        if (referrer) {
          insertData.referred_by = referrer.id;
          await supabase.from('referrals').insert({
            referrer_id: referrer.id, referred_email: email, referred_name: name,
            referral_code: referralCode.trim().toUpperCase(), status: 'signed_up',
          });
        }
      }
      await supabase.from('clients').insert(insertData);
    }
    setMode('confirm');
  };

  const handleForgotPassword = async () => {
    if (!email) return setError('Enter your email address');
    setSubmitting(true); setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setSubmitting(false);
    if (err) return setError(err.message);
    setMode('reset_sent');
  };

  const inputStyle = { width:'100%', padding:'14px 16px', borderRadius:12, border:`1.5px solid ${BORDER}`, fontSize:15, background:CARD, color:DARK, marginBottom:12 };

  return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', flexDirection:'column' }}>
      <style>{css}</style>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${ACCENT}, ${ROSE})`, padding:'60px 24px 40px', borderRadius:'0 0 32px 32px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>✨</div>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:32, fontWeight:700, color:'#fff', marginBottom:8 }}>GlowBook</h1>
        <p style={{ color:'rgba(255,255,255,.85)', fontSize:15 }}>Book beauty services near you</p>
      </div>

      <div className="fade-up" style={{ padding:24, flex:1, display:'flex', flexDirection:'column' }}>
        {mode === 'confirm' ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📧</div>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:22, fontWeight:700, marginBottom:8 }}>Check your email</h2>
            <p style={{ color:MUTED, fontSize:14, lineHeight:1.6, marginBottom:24 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
            </p>
            <Btn full variant="primary" onClick={() => { setMode('login'); setError(''); }}>Go to Login</Btn>
          </div>
        ) : mode === 'reset_sent' ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🔑</div>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:22, fontWeight:700, marginBottom:8 }}>Reset link sent</h2>
            <p style={{ color:MUTED, fontSize:14, lineHeight:1.6, marginBottom:24 }}>
              Check <strong>{email}</strong> for a password reset link.
            </p>
            <Btn full variant="primary" onClick={() => { setMode('login'); setError(''); }}>Back to Login</Btn>
          </div>
        ) : mode === 'forgot' ? (
          <>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:24, fontWeight:700, marginBottom:4 }}>Reset password</h2>
            <p style={{ color:MUTED, fontSize:14, marginBottom:24 }}>Enter your email and we'll send you a reset link</p>
            {error && <div style={{ background:'#fce4ec', color:'#c62828', padding:'12px 16px', borderRadius:12, fontSize:13, fontWeight:500, marginBottom:16 }}>{error}</div>}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} />
            <Btn full variant="primary" disabled={submitting} onClick={handleForgotPassword} style={{ marginBottom:12, padding:'15px', fontSize:16, borderRadius:14 }}>
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </Btn>
            <button onClick={() => { setMode('login'); setError(''); }} style={{ background:'none', border:'none', color:ACCENT, fontSize:14, fontWeight:600, cursor:'pointer', padding:8, textAlign:'center' }}>
              Back to login
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:24, fontWeight:700, marginBottom:4 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color:MUTED, fontSize:14, marginBottom:24 }}>
              {mode === 'login' ? 'Sign in to manage your bookings' : 'Join GlowBook to book beauty services'}
            </p>

            {error && (
              <div style={{ background:'#fce4ec', color:'#c62828', padding:'12px 16px', borderRadius:12, fontSize:13, fontWeight:500, marginBottom:16 }}>{error}</div>
            )}

            {mode === 'signup' && (
              <>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" style={inputStyle} />
              </>
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inputStyle} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())} />
            {mode === 'signup' && (
              <input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Referral code (optional)" style={inputStyle} />
            )}

            <Btn full variant="primary" disabled={submitting} onClick={mode === 'login' ? handleLogin : handleSignup}
              style={{ marginBottom:12, padding:'15px', fontSize:16, borderRadius:14 }}>
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Btn>

            {mode === 'login' && (
              <button onClick={() => { setMode('forgot'); setError(''); }}
                style={{ background:'none', border:'none', color:MUTED, fontSize:13, cursor:'pointer', padding:4, marginBottom:8, textAlign:'center' }}>
                Forgot password?
              </button>
            )}

            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              style={{ background:'none', border:'none', color:ACCENT, fontSize:14, fontWeight:600, cursor:'pointer', padding:8, marginBottom:16, textAlign:'center' }}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'8px 0 16px' }}>
              <div style={{ flex:1, height:1, background:BORDER }} />
              <span style={{ fontSize:12, color:MUTED, fontWeight:500 }}>OR</span>
              <div style={{ flex:1, height:1, background:BORDER }} />
            </div>

            <Btn full variant="secondary" onClick={onDemo} style={{ borderRadius:14 }}>
              Continue as Guest (Demo)
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
function ExplorePage({ branches, services, reviews, branchAvgRating, branchReviews, navigate, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories, favorites, toggleFav }) {
  const staff_data = [];

  const q = searchQuery.toLowerCase();
  const filteredBranches = branches.filter(b =>
    (!q || b.name?.toLowerCase().includes(q) || b.location?.toLowerCase().includes(q)) &&
    (selectedCategory === 'All' || services.some(s => s.category === selectedCategory))
  );

  const filteredServices = services.filter(s =>
    (!q || s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) &&
    (selectedCategory === 'All' || s.category === selectedCategory)
  );

  const [viewMode, setViewMode] = useState('salons'); // salons | services

  return (
    <div className="fade-up">
      {/* Search Header */}
      <div style={{ padding:'52px 20px 16px', background:CARD, borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ flex:1, background:BG, borderRadius:14, display:'flex', alignItems:'center', padding:'0 14px', border:`1px solid ${BORDER}` }}>
            <Icon name="search" size={18} color={MUTED} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              placeholder="Search salons, services..."
              style={{ flex:1, border:'none', background:'none', padding:'12px 10px', fontSize:15, color:DARK }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <Icon name="close" size={16} color={MUTED} />
              </button>
            )}
          </div>
        </div>
        {/* Categories */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)}
              style={{ flexShrink:0, padding:'8px 16px', borderRadius:50, border:'none',
                background: c === selectedCategory ? ACCENT : `${ACCENT}10`, color: c === selectedCategory ? '#fff' : DARK,
                fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {c !== 'All' && <span style={{ marginRight:4 }}>{CATEGORIES_ICONS[c] || '•'}</span>}{c}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ padding:'14px 20px', display:'flex', gap:8 }}>
        <button onClick={() => setViewMode('salons')} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', fontWeight:600, fontSize:13,
          background: viewMode === 'salons' ? DARK : '#f0ebe7', color: viewMode === 'salons' ? '#fff' : DARK, cursor:'pointer' }}>Salons</button>
        <button onClick={() => setViewMode('services')} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', fontWeight:600, fontSize:13,
          background: viewMode === 'services' ? DARK : '#f0ebe7', color: viewMode === 'services' ? '#fff' : DARK, cursor:'pointer' }}>Services</button>
      </div>

      <div style={{ padding:'0 20px 20px' }}>
        {viewMode === 'salons' ? (
          filteredBranches.length ? filteredBranches.map(b => (
            <div key={b.id} onClick={() => navigate('salon', { branch: b })}
              style={{ background:CARD, borderRadius:18, padding:16, marginBottom:12, border:`1px solid ${BORDER}`,
                cursor:'pointer', display:'flex', gap:14, transition:'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ width:72, height:72, borderRadius:16, background:`linear-gradient(135deg, ${ACCENT}40, ${ROSE}40)`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:28 }}>✂</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start' }}>
                  <h3 style={{ fontSize:16, fontWeight:700 }}>{b.name}</h3>
                  <button onClick={e => { e.stopPropagation(); toggleFav(b.id); }}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                    <Icon name="heart" size={18} color={favorites.includes(b.id) ? ROSE : '#ddd'} />
                  </button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:MUTED, margin:'4px 0' }}>
                  <Icon name="map" size={12} color={MUTED} />{b.location || 'Lusaka'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Stars rating={Math.round(+branchAvgRating(b.id))} size={12} />
                  <span style={{ fontSize:12, fontWeight:600 }}>{branchAvgRating(b.id)}</span>
                  <span style={{ fontSize:11, color:MUTED }}>({branchReviews(b.id).length} reviews)</span>
                </div>
              </div>
            </div>
          )) : <EmptyState icon="🔍" title="No salons found" sub="Try a different search" />
        ) : (
          filteredServices.length ? (
            <div style={{ display:'grid', gap:10 }}>
              {filteredServices.map(s => (
                <div key={s.id} style={{ background:CARD, borderRadius:16, padding:16, border:`1px solid ${BORDER}`,
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:16 }}>{CATEGORIES_ICONS[s.category] || '✨'}</span>
                      <span style={{ fontSize:15, fontWeight:600 }}>{s.name}</span>
                    </div>
                    <div style={{ fontSize:12, color:MUTED }}>{s.category} • {s.duration}{s.duration_max !== s.duration ? `–${s.duration_max}` : ''} min</div>
                    {s.description && <p style={{ fontSize:12, color:MUTED, marginTop:4, lineHeight:1.4 }}>{s.description.slice(0, 80)}</p>}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                    <div style={{ fontSize:16, fontWeight:700, color:ACCENT }}>K{s.price}</div>
                    {s.price_max !== s.price && <div style={{ fontSize:11, color:MUTED }}>–K{s.price_max}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="💇" title="No services found" sub="Try a different category" />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SALON DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════
function SalonPage({ branch, services, reviews, staff, branchAvgRating, navigate, goBack, favorites, toggleFav, getClient, client }) {
  const [tab, setTab] = useState('services');
  if (!branch) return null;

  const avg = branchAvgRating(branch.id);
  const bgColor = '#c47d5a';
  const grouped = {};
  services.forEach(s => { if (!grouped[s.category]) grouped[s.category] = []; grouped[s.category].push(s); });

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{ height:220, background:`linear-gradient(135deg, ${bgColor}, ${ROSE})`, position:'relative',
        display:'flex', alignItems:'flex-end', borderRadius:'0 0 28px 28px' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, padding:'48px 20px 0', display:'flex', justifyContent:'space-between' }}>
          <button onClick={goBack} style={{ width:38, height:38, borderRadius:19, background:'rgba(255,255,255,.2)',
            backdropFilter:'blur(8px)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="back" size={20} color="#fff" />
          </button>
          <button onClick={() => toggleFav(branch.id)} style={{ width:38, height:38, borderRadius:19, background:'rgba(255,255,255,.2)',
            backdropFilter:'blur(8px)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="heart" size={20} color={favorites.includes(branch.id) ? '#fff' : 'rgba(255,255,255,.6)'} />
          </button>
        </div>
        <div style={{ padding:'0 20px 20px', width:'100%' }}>
          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:26, fontWeight:700, color:'#fff', marginBottom:4 }}>{branch.name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:12, color:'rgba(255,255,255,.85)', fontSize:13 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon name="map" size={14} color="rgba(255,255,255,.85)" />{branch.location || 'Lusaka'}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon name="star" size={14} color={GOLD} />{avg} ({reviews.length})</span>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div style={{ padding:'16px 20px', display:'flex', gap:10 }}>
        <div style={{ flex:1, background:CARD, borderRadius:14, padding:12, border:`1px solid ${BORDER}`, textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:700, color:ACCENT }}>{services.length}</div>
          <div style={{ fontSize:11, color:MUTED }}>Services</div>
        </div>
        <div style={{ flex:1, background:CARD, borderRadius:14, padding:12, border:`1px solid ${BORDER}`, textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:700, color:GOLD }}>{staff.length}</div>
          <div style={{ fontSize:11, color:MUTED }}>Stylists</div>
        </div>
        <div style={{ flex:1, background:CARD, borderRadius:14, padding:12, border:`1px solid ${BORDER}`, textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:700, color:ROSE }}>{avg}</div>
          <div style={{ fontSize:11, color:MUTED }}>Rating</div>
        </div>
      </div>

      {/* Info Row */}
      {(branch.phone || branch.email || branch.operating_hours) && (
        <div style={{ padding:'0 20px 12px', display:'flex', flexDirection:'column', gap:6 }}>
          {branch.operating_hours && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:MUTED }}>
              <Icon name="clock" size={14} color={MUTED} />{branch.operating_hours}
            </div>
          )}
          {branch.phone && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:MUTED }}>
              <Icon name="phone" size={14} color={MUTED} />{branch.phone}
            </div>
          )}
        </div>
      )}

      {branch.description && (
        <div style={{ padding:'0 20px 16px' }}>
          <p style={{ fontSize:14, color:MUTED, lineHeight:1.6 }}>{branch.description}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ padding:'0 20px', display:'flex', gap:4, marginBottom:16, borderBottom:`1px solid ${BORDER}` }}>
        {['services','team','reviews'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'12px 0', background:'none', border:'none',
            borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
            color: tab === t ? ACCENT : MUTED, fontSize:14, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:'0 20px 100px' }}>
        {/* Services Tab */}
        {tab === 'services' && (
          Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat} style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ fontSize:16 }}>{CATEGORIES_ICONS[cat] || '✨'}</span>
                <h3 style={{ fontSize:16, fontWeight:700 }}>{cat}</h3>
              </div>
              {svcs.map(s => (
                <div key={s.id} style={{ background:CARD, borderRadius:16, padding:16, marginBottom:8, border:`1px solid ${BORDER}`,
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600 }}>{s.name}</div>
                    <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>
                      {s.duration}{s.duration_max !== s.duration ? `–${s.duration_max}` : ''} min
                      {s.deposit ? ` • K${s.deposit} deposit` : ''}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:16, fontWeight:700, color:ACCENT }}>K{s.price}</div>
                      {s.price_max !== s.price && <div style={{ fontSize:11, color:MUTED }}>–K{s.price_max}</div>}
                    </div>
                    <Btn small variant="primary" onClick={() => navigate('booking', { bookingFlow: { step:1, branch, service:s, staff:null, date:null, time:null } })}>Book</Btn>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Team Tab */}
        {tab === 'team' && (
          staff.length ? staff.map(s => (
            <div key={s.id} style={{ background:CARD, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${BORDER}`,
              display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:52, height:52, borderRadius:26, background:`linear-gradient(135deg, ${GOLD}30, ${ACCENT}30)`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:ACCENT, flexShrink:0 }}>
                {s.name?.[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:600 }}>{s.name}</div>
                <div style={{ fontSize:13, color:MUTED }}>{s.role || 'Stylist'}</div>
                {s.specialties?.length > 0 && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                    {(Array.isArray(s.specialties) ? s.specialties : [s.specialties]).map((sp, i) => (
                      <span key={i} style={{ padding:'2px 8px', borderRadius:8, background:`${ACCENT}10`, fontSize:11, fontWeight:500, color:ACCENT }}>{sp}</span>
                    ))}
                  </div>
                )}
              </div>
              {s.rating && (
                <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                  <Icon name="star" size={14} color={GOLD} />
                  <span style={{ fontSize:13, fontWeight:600 }}>{s.rating}</span>
                </div>
              )}
            </div>
          )) : <EmptyState icon="👤" title="No team members listed" sub="Check back later" />
        )}

        {/* Reviews Tab */}
        {tab === 'reviews' && (
          reviews.length ? (
            <>
              <div style={{ background:CARD, borderRadius:16, padding:20, marginBottom:16, border:`1px solid ${BORDER}`, textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:700, fontFamily:'Fraunces,serif', color:DARK }}>{avg}</div>
                <Stars rating={Math.round(+avg)} size={18} />
                <div style={{ fontSize:13, color:MUTED, marginTop:4 }}>{reviews.length} reviews</div>
              </div>
              {reviews.map(r => (
                <div key={r.id} style={{ background:CARD, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${BORDER}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <Stars rating={r.rating_overall} size={14} />
                    <span style={{ fontSize:11, color:MUTED }}>{r.created_at?.slice(0, 10)}</span>
                  </div>
                  <p style={{ fontSize:14, lineHeight:1.6, color:DARK }}>{r.review_text}</p>
                  {r.response_text && (
                    <div style={{ marginTop:10, padding:10, background:`${ACCENT}06`, borderRadius:10, borderLeft:`3px solid ${ACCENT}` }}>
                      <span style={{ fontSize:11, fontWeight:600, color:ACCENT }}>Salon Response:</span>
                      <p style={{ fontSize:13, color:MUTED, marginTop:4, lineHeight:1.5 }}>{r.response_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : <EmptyState icon="⭐" title="No reviews yet" sub="Be the first to review!" />
        )}
      </div>

      {/* Sticky Book Button */}
      <div style={{ position:'fixed', bottom:72, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480,
        padding:'12px 20px', background:'rgba(250,247,245,.92)', backdropFilter:'blur(16px)', borderTop:`1px solid ${BORDER}` }}>
        <Btn full variant="primary" onClick={() => navigate('booking', { bookingFlow: { step:0, branch, service:null, staff:null, date:null, time:null, clientPoints: client?.glow_points || 0 } })}
          style={{ borderRadius:14, padding:'15px 24px', fontSize:16, boxShadow:`0 4px 20px ${ACCENT}40` }}>
          Book Appointment ✨
        </Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BOOKING FLOW
// ═══════════════════════════════════════════════════════════════════════
function BookingFlow({ flow, setBookingFlow, staff, services, createBooking, goBack }) {
  if (!flow) return null;

  const update = data => setBookingFlow(f => ({ ...f, ...data }));
  const step = flow.step || 0;

  // Generate time slots from branch hours
  const openH = parseInt(flow.branch?.open_time?.slice(0,2)) || 8;
  const closeH = parseInt(flow.branch?.close_time?.slice(0,2)) || 17;
  const timeSlots = [];
  for (let h = openH; h <= closeH; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < closeH) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Check booked slots for selected date/staff
  const [bookedSlots, setBookedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  useEffect(() => {
    if (!flow.date) return;
    const q = supabase.from('bookings').select('booking_time').eq('booking_date', flow.date).neq('status', 'cancelled');
    if (flow.staff?.id) q.eq('staff_id', flow.staff.id);
    q.then(({ data }) => setBookedSlots((data || []).map(b => b.booking_time?.slice(0,5))));
    // Check staff blocked times
    if (flow.staff?.id) {
      supabase.from('staff_blocked_times').select('*').eq('staff_id', flow.staff.id).eq('block_date', flow.date)
        .then(({ data }) => {
          if (!data?.length) { setBlockedSlots([]); return; }
          const blocked = [];
          data.forEach(bt => {
            if (!bt.start_time) { timeSlots.forEach(t => blocked.push(t)); } // all day
            else {
              const s = bt.start_time?.slice(0,5), e = bt.end_time?.slice(0,5);
              timeSlots.forEach(t => { if (t >= s && t <= e) blocked.push(t); });
            }
          });
          setBlockedSlots(blocked);
        });
    } else setBlockedSlots([]);
  }, [flow.date, flow.staff]);

  const joinWaitlist = async () => {
    if (!flow.branch?.id || !flow.service?.id) return;
    const clientEl = document.querySelector('[data-client-id]');
    // We need client_id from parent — pass through props or use a callback
    await supabase.from('waitlist').insert({
      client_id: flow.clientId, branch_id: flow.branch.id,
      service_id: flow.service.id, staff_id: flow.staff?.id || null,
      preferred_date: flow.date, preferred_time: flow.time || null,
      status: 'waiting', notes: `Wants ${flow.service.name}`,
      created_at: new Date().toISOString(),
    });
    setWaitlistJoined(true);
  };

  // Generate dates (next 14 days)
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const grouped = {};
  services.forEach(s => { if (!grouped[s.category]) grouped[s.category] = []; grouped[s.category].push(s); });

  const steps = [
    { label: 'Service', done: !!flow.service },
    { label: 'Stylist', done: flow.staff !== null },
    { label: 'Date & Time', done: !!flow.date && !!flow.time },
    { label: 'Confirm', done: false },
  ];

  return (
    <div className="fade-up" style={{ minHeight:'100vh', background:BG }}>
      {/* Header */}
      <div style={{ padding:'48px 20px 16px', background:CARD, borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <button onClick={goBack} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
            <Icon name="back" size={22} color={DARK} />
          </button>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700 }}>Book Appointment</h2>
            <p style={{ fontSize:13, color:MUTED }}>{flow.branch?.name}</p>
          </div>
        </div>
        {/* Progress */}
        <div style={{ display:'flex', gap:4 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex:1 }}>
              <div style={{ height:3, borderRadius:2, background: i <= step ? ACCENT : BORDER, transition:'all .3s' }} />
              <div style={{ fontSize:10, color: i <= step ? ACCENT : MUTED, marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:20, paddingBottom:120 }}>
        {/* Step 0: Select Service */}
        {step === 0 && (
          <div className="fade-up">
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, marginBottom:16 }}>Choose a service</h3>
            {Object.entries(grouped).map(([cat, svcs]) => (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                  <span>{CATEGORIES_ICONS[cat] || '✨'}</span>
                  <h4 style={{ fontSize:14, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:.5 }}>{cat}</h4>
                </div>
                {svcs.map(s => (
                  <div key={s.id} onClick={() => update({ service: s, step: 1 })}
                    style={{ background: flow.service?.id === s.id ? `${ACCENT}08` : CARD, borderRadius:16, padding:16, marginBottom:8,
                      border: flow.service?.id === s.id ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`, cursor:'pointer', transition:'all .2s',
                      display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center', flex:1, minWidth:0 }}>
                      {s.image ? (
                        <img src={s.image} alt="" style={{ width:48, height:48, borderRadius:12, objectFit:'cover', flexShrink:0 }} />
                      ) : (
                        <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg, ${ACCENT}15, ${ROSE}15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{CATEGORIES_ICONS[s.category] || '✨'}</div>
                      )}
                      <div>
                        <div style={{ fontSize:15, fontWeight:600 }}>{s.name}</div>
                        <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{s.duration}{s.duration_max !== s.duration ? `–${s.duration_max}` : ''} min</div>
                      </div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, color:ACCENT }}>K{s.price}{s.price_max !== s.price ? `–${s.price_max}` : ''}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Select Staff */}
        {step === 1 && (() => {
          const svcCat = flow.service?.category?.toLowerCase();
          const svcName = flow.service?.name?.toLowerCase();
          const filteredStaff = staff.filter(s => {
            if (!s.specialties || !svcCat) return true;
            const specs = (Array.isArray(s.specialties) ? s.specialties : [s.specialties]).map(sp => sp.toLowerCase());
            return specs.some(sp => sp.includes(svcCat) || svcCat.includes(sp) || (svcName && sp.includes(svcName)));
          });
          const displayStaff = filteredStaff.length > 0 ? filteredStaff : staff;
          return (
          <div className="fade-up">
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, marginBottom:6 }}>Choose your stylist</h3>
            <p style={{ fontSize:13, color:MUTED, marginBottom:16 }}>Or let us pick the best available stylist for you</p>

            <div onClick={() => update({ staff: { id: null, name: 'Any Available' }, step: 2 })}
              style={{ background: CARD, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${BORDER}`,
                cursor:'pointer', display:'flex', gap:14, alignItems:'center', transition:'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
              <div style={{ width:52, height:52, borderRadius:26, background:`linear-gradient(135deg, ${GOLD}40, ${ACCENT}40)`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="sparkle" size={22} color={ACCENT} />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:600 }}>Any Available Stylist</div>
                <div style={{ fontSize:13, color:MUTED }}>We'll match you with the best fit</div>
              </div>
              <Icon name="chevR" size={18} color={MUTED} style={{ marginLeft:'auto' }} />
            </div>

            {filteredStaff.length < staff.length && filteredStaff.length > 0 && (
              <div style={{ fontSize:12, color:ACCENT, marginBottom:10, padding:'6px 12px', background:`${ACCENT}08`, borderRadius:10 }}>
                ✨ Showing {filteredStaff.length} stylist{filteredStaff.length !== 1 ? 's' : ''} who specialize in {flow.service?.category}
              </div>
            )}

            {displayStaff.map(s => (
              <div key={s.id} onClick={() => update({ staff: s, step: 2 })}
                style={{ background: CARD, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${BORDER}`,
                  cursor:'pointer', display:'flex', gap:14, alignItems:'center', transition:'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                <div style={{ width:52, height:52, borderRadius:26, background:`linear-gradient(135deg, ${GOLD}30, ${ACCENT}30)`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:ACCENT }}>
                  {s.name?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:600 }}>{s.name}</div>
                  <div style={{ fontSize:13, color:MUTED }}>{s.role || 'Stylist'}</div>
                </div>
                {s.rating && (
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <Icon name="star" size={14} color={GOLD} />
                    <span style={{ fontSize:13, fontWeight:600 }}>{s.rating}</span>
                  </div>
                )}
                <Icon name="chevR" size={18} color={MUTED} />
              </div>
            ))}

            <div style={{ marginTop:16 }}>
              <Btn variant="ghost" onClick={() => update({ step: 0 })}>← Back to services</Btn>
            </div>
          </div>
        );})()}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="fade-up">
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, marginBottom:16 }}>Pick a date & time</h3>

            {/* Date Picker */}
            <div style={{ marginBottom:20 }}>
              <h4 style={{ fontSize:14, fontWeight:600, marginBottom:10, color:MUTED }}>DATE</h4>
              <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8 }}>
                {dates.map(d => {
                  const dt = new Date(d + 'T00:00:00');
                  const isToday = d === todayStr();
                  const sel = flow.date === d;
                  return (
                    <div key={d} onClick={() => update({ date: d })}
                      style={{ flexShrink:0, width:64, padding:'10px 0', borderRadius:14, textAlign:'center', cursor:'pointer',
                        background: sel ? ACCENT : CARD, border: sel ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`, transition:'all .2s' }}>
                      <div style={{ fontSize:11, fontWeight:600, color: sel ? 'rgba(255,255,255,.7)' : MUTED }}>{isToday ? 'Today' : DAYS[dt.getDay()]}</div>
                      <div style={{ fontSize:20, fontWeight:700, color: sel ? '#fff' : DARK, margin:'2px 0' }}>{dt.getDate()}</div>
                      <div style={{ fontSize:11, color: sel ? 'rgba(255,255,255,.7)' : MUTED }}>{MONTHS[dt.getMonth()]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Picker */}
            {flow.date && (
              <div className="fade-up">
                <h4 style={{ fontSize:14, fontWeight:600, marginBottom:10, color:MUTED }}>TIME</h4>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                  {timeSlots.map(t => {
                    const sel = flow.time === t;
                    const booked = bookedSlots.includes(t);
                    const blocked = blockedSlots.includes(t);
                    const unavailable = booked || blocked;
                    return (
                      <div key={t} onClick={() => !unavailable && update({ time: t })}
                        style={{ padding:'12px 0', borderRadius:12, textAlign:'center', cursor: unavailable ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:600,
                          background: unavailable ? '#f5f5f5' : sel ? ACCENT : CARD,
                          color: unavailable ? '#bbb' : sel ? '#fff' : DARK,
                          border: sel ? `2px solid ${ACCENT}` : `1px solid ${unavailable ? '#eee' : BORDER}`,
                          textDecoration: unavailable ? 'line-through' : 'none', opacity: unavailable ? 0.6 : 1, transition:'all .2s' }}>
                        {fmtTime(t)}
                        {blocked && !booked && <div style={{ fontSize:9, color:'#999', marginTop:2 }}>off</div>}
                      </div>
                    );
                  })}
                </div>
                {/* All slots booked → waitlist */}
                {bookedSlots.length + blockedSlots.length >= timeSlots.length && !waitlistJoined && flow.clientId && (
                  <div style={{ marginTop:16, background:`${ROSE}10`, borderRadius:14, padding:16, border:`1px solid ${ROSE}20`, textAlign:'center' }}>
                    <p style={{ fontSize:14, fontWeight:600, color:DARK, marginBottom:8 }}>All slots are booked for this day</p>
                    <p style={{ fontSize:12, color:MUTED, marginBottom:12 }}>Join the waitlist and we'll notify you if a spot opens up.</p>
                    <Btn variant="primary" onClick={joinWaitlist} style={{ background:ROSE }}>Join Waitlist 🔔</Btn>
                  </div>
                )}
                {waitlistJoined && (
                  <div style={{ marginTop:12, background:'#e8f5e9', borderRadius:12, padding:12, textAlign:'center' }}>
                    <span style={{ fontSize:13, color:'#2e7d32', fontWeight:600 }}>✓ You're on the waitlist! We'll let you know.</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <Btn variant="ghost" onClick={() => update({ step: 1 })}>← Back</Btn>
              <Btn variant="primary" full disabled={!flow.date || !flow.time} onClick={() => update({ step: 3 })}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="fade-up">
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, marginBottom:20 }}>Confirm Booking</h3>

            <div style={{ background:CARD, borderRadius:20, overflow:'hidden', border:`1px solid ${BORDER}`, marginBottom:20 }}>
              <div style={{ background:`linear-gradient(135deg, ${ACCENT}10, ${ROSE}10)`, padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Icon name="scissors" size={18} color={ACCENT} />
                  <span style={{ fontSize:11, fontWeight:600, color:ACCENT, textTransform:'uppercase', letterSpacing:1 }}>Booking Summary</span>
                </div>
                <h4 style={{ fontSize:18, fontWeight:700, fontFamily:'Fraunces,serif' }}>{flow.service?.name}</h4>
              </div>

              <div style={{ padding:20 }}>
                {[
                  { label: 'Salon', value: flow.branch?.name, icon: 'map' },
                  { label: 'Stylist', value: flow.staff?.name || 'Any Available', icon: 'user' },
                  { label: 'Date', value: flow.date ? fmtDate(flow.date) : '—', icon: 'calendar' },
                  { label: 'Time', value: flow.time ? fmtTime(flow.time) : '—', icon: 'clock' },
                  { label: 'Duration', value: `${flow.service?.duration_min || '—'} min`, icon: 'clock' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${BORDER}` }}>
                    <Icon name={item.icon} size={16} color={MUTED} />
                    <span style={{ fontSize:13, color:MUTED, marginLeft:10, width:80 }}>{item.label}</span>
                    <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{item.value}</span>
                  </div>
                ))}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16 }}>
                  <span style={{ fontSize:14, color:MUTED }}>Total</span>
                  <div style={{ textAlign:'right' }}>
                    {flow.usePoints && flow.pointsToUse > 0 && (
                      <div style={{ fontSize:13, color:MUTED, textDecoration:'line-through' }}>K{flow.service?.price_max || flow.service?.price || 0}</div>
                    )}
                    <span style={{ fontSize:24, fontWeight:700, fontFamily:'Fraunces,serif', color:ACCENT }}>
                      K{Math.max(0, (flow.service?.price_max || flow.service?.price || 0) - (flow.usePoints && flow.pointsToUse ? Math.floor(flow.pointsToUse / 10) : 0))}
                    </span>
                    {flow.usePoints && flow.pointsToUse > 0 && (
                      <div style={{ fontSize:11, color:GOLD, fontWeight:600 }}>−K{Math.floor(flow.pointsToUse / 10)} GlowPoints</div>
                    )}
                  </div>
                </div>
                {flow.service?.deposit > 0 && (
                  <div style={{ fontSize:12, color:MUTED, textAlign:'right', marginTop:2 }}>
                    Deposit required: K{flow.service?.deposit}
                  </div>
                )}
              </div>
            </div>

            {/* Client Notes */}
            <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>Special Requests</div>
              <textarea value={flow.clientNotes || ''} onChange={e => update({ clientNotes: e.target.value })}
                placeholder="E.g. shoulder-length braids, allergic to certain products, preferred style reference..."
                rows={3} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${BORDER}`, fontSize:13, background:BG, color:DARK, resize:'vertical', fontFamily:'inherit' }} />
            </div>

            {/* GlowPoints Redemption */}
            {flow.clientPoints > 0 && (
              <div style={{ background:`linear-gradient(135deg, ${GOLD}08, ${ACCENT}08)`, borderRadius:16, border:`1px solid ${GOLD}20`, padding:16, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: flow.usePoints ? 12 : 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>⭐</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>Use GlowPoints</div>
                      <div style={{ fontSize:12, color:MUTED }}>You have {flow.clientPoints} points (K{Math.floor(flow.clientPoints / 10)} value)</div>
                    </div>
                  </div>
                  <div onClick={() => update({ usePoints: !flow.usePoints, pointsToUse: 0 })}
                    style={{ width:44, height:24, borderRadius:12, background: flow.usePoints ? GOLD : BORDER, cursor:'pointer', position:'relative', transition:'all .2s' }}>
                    <div style={{ width:20, height:20, borderRadius:10, background:'#fff', position:'absolute', top:2, left: flow.usePoints ? 22 : 2, transition:'all .2s' }} />
                  </div>
                </div>
                {flow.usePoints && (() => {
                  const maxPrice = flow.service?.price_max || flow.service?.price || 0;
                  const maxRedeemable = Math.min(flow.clientPoints, maxPrice * 10); // 10 points = K1
                  const pointsVal = Math.floor((flow.pointsToUse || 0) / 10);
                  return (
                    <div>
                      <input type="range" min={0} max={maxRedeemable} step={10} value={flow.pointsToUse || 0}
                        onChange={e => update({ pointsToUse: parseInt(e.target.value) })}
                        style={{ width:'100%', accentColor:GOLD }} />
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:MUTED, marginTop:4 }}>
                        <span>0 pts</span>
                        <span style={{ fontWeight:700, color:GOLD, fontSize:14 }}>−K{pointsVal} discount</span>
                        <span>{maxRedeemable} pts</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Recurring Booking Option */}
            <div style={{ background:CARD, borderRadius:16, border:`1px solid ${BORDER}`, padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: flow.recurring ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>Make it recurring</div>
                  <div style={{ fontSize:12, color:MUTED }}>Auto-book at the same time</div>
                </div>
                <div onClick={() => update({ recurring: !flow.recurring })}
                  style={{ width:44, height:24, borderRadius:12, background: flow.recurring ? ACCENT : BORDER, cursor:'pointer', position:'relative', transition:'all .2s' }}>
                  <div style={{ width:20, height:20, borderRadius:10, background:'#fff', position:'absolute', top:2, left: flow.recurring ? 22 : 2, transition:'all .2s' }} />
                </div>
              </div>
              {flow.recurring && (
                <div>
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    {[['weekly','Weekly'],['biweekly','Every 2 weeks'],['monthly','Monthly']].map(([val,label]) => (
                      <button key={val} onClick={() => update({ recurringType: val })}
                        style={{ flex:1, padding:'8px 4px', borderRadius:10, border:`1.5px solid ${flow.recurringType===val ? ACCENT : BORDER}`, background: flow.recurringType===val ? ACCENT+'15' : 'transparent', color: flow.recurringType===val ? ACCENT : MUTED, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:MUTED }}>
                    <label>Until: <input type="date" value={flow.recurringUntil || ''} onChange={e => update({ recurringUntil: e.target.value })}
                      min={flow.date} style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${BORDER}`, fontSize:12, background:BG, color:DARK, marginLeft:6 }} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Cancellation Policy Notice */}
            <div style={{ background:`${GOLD}08`, borderRadius:12, padding:12, marginBottom:16, border:`1px solid ${GOLD}20` }}>
              <div style={{ fontSize:12, fontWeight:600, color:GOLD, marginBottom:4 }}>Cancellation Policy</div>
              <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>
                Free cancellation up to {flow.branch?.cancellation_hours || 2} hours before your appointment. Late cancellations may incur a fee.
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" onClick={() => update({ step: 2 })}>← Back</Btn>
              <Btn variant="primary" full onClick={() => createBooking(flow)}
                style={{ borderRadius:14, padding:'15px', fontSize:16, boxShadow:`0 4px 20px ${ACCENT}40` }}>
                {flow.recurring ? `Book ${flow.recurringType || 'Weekly'} ✨` : 'Confirm Booking ✨'}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MY BOOKINGS PAGE
// ═══════════════════════════════════════════════════════════════════════

function MyBookingsPage({ upcoming, past, getService, getStaffMember, getBranch, cancelBooking, rescheduleBooking, navigate, selectedBooking, setSelectedBooking }) {
  const [tab, setTab] = useState('upcoming');
  const [cancelTarget, setCancelTarget] = useState(null);

  const BookingCard = ({ bk }) => {
    const svc = getService(bk.service_id);
    const stf = getStaffMember(bk.staff_id);
    const br = getBranch(bk.branch_id);
    const st = STATUS_MAP[bk.status] || STATUS_MAP.pending;

    return (
      <div style={{ background:CARD, borderRadius:18, overflow:'hidden', border:`1px solid ${BORDER}`, marginBottom:12 }}>
        <div style={{ display:'flex', gap:14, padding:16 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:`linear-gradient(135deg, ${ACCENT}20, ${ROSE}20)`,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:24 }}>{CATEGORIES_ICONS[svc?.category] || '✨'}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:4 }}>
              <h4 style={{ fontSize:15, fontWeight:700 }}>{svc?.name || 'Service'}</h4>
              <Badge bg={st.bg} fg={st.fg}>{st.label}</Badge>
            </div>
            <div style={{ fontSize:13, color:MUTED, marginBottom:2 }}>{br?.name || 'Salon'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:MUTED }}>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}><Icon name="calendar" size={12} color={MUTED} />{fmtDate(bk.booking_date)}</span>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}><Icon name="clock" size={12} color={MUTED} />{fmtTime(bk.booking_time)}</span>
            </div>
            {stf && <div style={{ fontSize:12, color:MUTED, marginTop:4 }}>with {stf.name}</div>}
            {bk.client_notes && <div style={{ fontSize:12, color:ACCENT, marginTop:4, fontStyle:'italic' }}>📝 {bk.client_notes.slice(0, 60)}{bk.client_notes.length > 60 ? '...' : ''}</div>}
            {bk.points_used > 0 && <div style={{ fontSize:11, color:GOLD, marginTop:2 }}>⭐ {bk.points_used} pts used (−K{Math.floor(bk.points_used / 10)})</div>}
          </div>
        </div>
        {bk.status === 'confirmed' || bk.status === 'pending' ? (
          <div style={{ borderTop:`1px solid ${BORDER}`, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:15, fontWeight:700, color:ACCENT }}>K{bk.total_amount}</span>
            <div style={{ display:'flex', gap:6 }}>
              {br?.phone && <a href={`https://wa.me/${(br.phone||'').replace(/[^0-9]/g,'').replace(/^0/,'260')}?text=${encodeURIComponent(`Hi, I have a booking for ${svc?.name || 'my appointment'} on ${fmtDate(bk.booking_date)} at ${fmtTime(bk.booking_time)}.`)}`} target="_blank" rel="noopener" style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:10, background:'#25D36620', color:'#25D366', fontSize:12, fontWeight:600, textDecoration:'none', border:'1px solid #25D36640' }}>💬 WhatsApp</a>}
              <Btn small variant="secondary" onClick={() => rescheduleBooking(bk)}>Reschedule</Btn>
              <Btn small variant="outline" onClick={() => setCancelTarget(bk)} style={{ color:'#c62828', borderColor:'#c6282840' }}>Cancel</Btn>
            </div>
          </div>
        ) : (
          <div style={{ borderTop:`1px solid ${BORDER}`, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:15, fontWeight:700, color:ACCENT }}>K{bk.total_amount}</span>
            {bk.status === 'completed' && (
              <Btn small variant="secondary" onClick={() => navigate('salon', { branch: getBranch(bk.branch_id) })}>Rebook</Btn>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-up">
      <div style={{ padding:'52px 20px 0', background:CARD, borderBottom:`1px solid ${BORDER}` }}>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:24, fontWeight:700, marginBottom:16 }}>My Bookings</h1>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={() => setTab('upcoming')} style={{ flex:1, padding:'12px 0', background:'none', border:'none',
            borderBottom: tab === 'upcoming' ? `2px solid ${ACCENT}` : '2px solid transparent',
            color: tab === 'upcoming' ? ACCENT : MUTED, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Upcoming {upcoming.length > 0 && <span style={{ background:ACCENT, color:'#fff', borderRadius:50, padding:'2px 7px', fontSize:11, marginLeft:4 }}>{upcoming.length}</span>}
          </button>
          <button onClick={() => setTab('past')} style={{ flex:1, padding:'12px 0', background:'none', border:'none',
            borderBottom: tab === 'past' ? `2px solid ${ACCENT}` : '2px solid transparent',
            color: tab === 'past' ? ACCENT : MUTED, fontSize:14, fontWeight:600, cursor:'pointer' }}>Past</button>
        </div>
      </div>

      <div style={{ padding:20 }}>
        {tab === 'upcoming' ? (
          upcoming.length ? upcoming.map(b => <BookingCard key={b.id} bk={b} />) :
          <EmptyState icon="📅" title="No upcoming bookings" sub="Book your next glow-up!" />
        ) : (
          past.length ? past.map(b => <BookingCard key={b.id} bk={b} />) :
          <EmptyState icon="📋" title="No past bookings" sub="Your booking history will show here" />
        )}
      </div>

      {/* Cancel Confirmation */}
      <BottomSheet open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Booking">
        {cancelTarget && (() => {
          const br = getBranch(cancelTarget.branch_id);
          const cancelHours = br?.cancellation_hours ?? 2;
          const bookingDT = new Date(`${cancelTarget.booking_date}T${cancelTarget.booking_time || '00:00'}`);
          const hoursUntil = Math.max(0, (bookingDT - new Date()) / (1000 * 60 * 60));
          const isLate = hoursUntil < cancelHours && hoursUntil > 0;
          const feePercent = br?.cancellation_fee_percent || 0;
          const fee = isLate && feePercent > 0 ? Math.round((cancelTarget.total_amount || 0) * feePercent / 100) : 0;
          return (
            <>
              <p style={{ fontSize:14, color:MUTED, lineHeight:1.6, marginBottom:12 }}>
                Are you sure you want to cancel your booking for <strong>{getService(cancelTarget.service_id)?.name}</strong> on {fmtDate(cancelTarget.booking_date)} at {fmtTime(cancelTarget.booking_time)}?
              </p>
              {isLate && feePercent > 0 && (
                <div style={{ background:'#fff3e0', borderRadius:12, padding:12, marginBottom:16, border:'1px solid #ffe0b2' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e65100', marginBottom:4 }}>⚠️ Late Cancellation</div>
                  <div style={{ fontSize:12, color:'#bf360c', lineHeight:1.5 }}>
                    Your appointment is in {Math.round(hoursUntil)}h. Cancelling within {cancelHours}h incurs a {feePercent}% fee of <strong>K{fee}</strong>.
                  </div>
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <Btn full variant="secondary" onClick={() => setCancelTarget(null)}>Keep Booking</Btn>
                <Btn full variant="primary" onClick={() => { cancelBooking(cancelTarget.id); setCancelTarget(null); }}
                  style={{ background:'#c62828' }}>
                  {fee > 0 ? `Cancel (K${fee} fee)` : 'Yes, Cancel'}
                </Btn>
              </div>
            </>
          );
        })()}
      </BottomSheet>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════

function ProfilePage({ client, clientBookings, branches, favorites, getBranch, navigate, showToast, authUser, isDemo, handleLogout }) {
  const totalSpent = clientBookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.total_amount || 0), 0);
  const points = client.glow_points || 0;
  const favBranches = branches.filter(b => favorites.includes(b.id));
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(client.profile_photo || null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: client.name || '', phone: client.phone || '', email: client.email || '' });
  const [saving, setSaving] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '', service_q: 5, cleanliness: 5, value: 5 });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File too large (max 5MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhoto(ev.target.result);
    reader.readAsDataURL(file);
    setPhotoUploading(true);
    try {
      const url = await uploadImage('avatars', 'clients', file);
      setProfilePhoto(url);
      if (client.id) await supabase.from('clients').update({ profile_photo: url, updated_at: new Date().toISOString() }).eq('id', client.id);
      showToast('Photo updated! ✨');
    } catch { setProfilePhoto(client.profile_photo || null); showToast('Upload failed', 'error'); }
    setPhotoUploading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('clients').update({ name: editForm.name, phone: editForm.phone, email: editForm.email, updated_at: new Date().toISOString() }).eq('id', client.id);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Profile updated! ✨'); setEditing(false);
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    const { error } = await supabase.from('reviews').insert({
      client_id: client.id, branch_id: reviewModal.branch_id, service_id: reviewModal.service_id,
      staff_id: reviewModal.staff_id, booking_id: reviewModal.id,
      rating_overall: reviewForm.rating, rating_service_quality: reviewForm.service_q,
      rating_cleanliness: reviewForm.cleanliness, rating_value_for_money: reviewForm.value,
      rating_average: ((reviewForm.rating + reviewForm.service_q + reviewForm.cleanliness + reviewForm.value) / 4),
      review_text: reviewForm.text, is_visible: true, moderation_status: 'approved',
      can_edit_until: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (!error) {
      // Award points
      const pts = 5 + (reviewForm.text?.length > 20 ? 5 : 0);
      await supabase.from('clients').update({ glow_points: (client.glow_points || 0) + pts, total_points_earned: (client.total_points_earned || 0) + pts }).eq('id', client.id);
      showToast(`Review submitted! +${pts} GlowPoints ⭐`);
    } else showToast(error.message, 'error');
    setReviewModal(null); setReviewForm({ rating: 5, text: '', service_q: 5, cleanliness: 5, value: 5 });
  };

  const unreviewedBookings = clientBookings.filter(b => b.status === 'completed' && !b._reviewed);
  // Check which completed bookings have reviews
  const [reviewedIds, setReviewedIds] = useState(new Set());
  useState(() => {
    (async () => {
      const { data } = await supabase.from('reviews').select('booking_id').eq('client_id', client.id);
      if (data) setReviewedIds(new Set(data.map(r => r.booking_id)));
    })();
  });
  const pendingReviews = clientBookings.filter(b => b.status === 'completed' && !reviewedIds.has(b.id));

  const StarRow = ({ value, onChange, label }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
      <span style={{ fontSize:13, color:MUTED }}>{label}</span>
      <div style={{ display:'flex', gap:4 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s} onClick={() => onChange(s)} style={{ fontSize:22, cursor:'pointer', color: s <= value ? '#F59E0B' : BORDER }}>{s <= value ? '★' : '☆'}</span>
        ))}
      </div>
    </div>
  );

  const iStyle = { width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid ${BORDER}`, fontSize:14, background:BG, color:DARK, marginBottom:10 };

  return (
    <div className="fade-up">
      {/* Profile Header */}
      <div style={{ background:`linear-gradient(135deg, ${DARK}, #2a1f23)`, padding:'52px 20px 28px', borderRadius:'0 0 28px 28px', textAlign:'center', marginBottom:20 }}>
        <div style={{ position:'relative', display:'inline-block', marginBottom:12 }}>
          <div onClick={() => !photoUploading && document.getElementById('profile-photo-input').click()}
            style={{ width:80, height:80, borderRadius:40, background: profilePhoto ? 'transparent' : `linear-gradient(135deg, ${ACCENT}, ${ROSE})`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, color:'#fff',
              cursor:'pointer', overflow:'hidden', border:'3px solid rgba(255,255,255,.2)', transition:'all .2s' }}>
            {profilePhoto ? <img src={profilePhoto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : client.name?.[0] || 'G'}
            {photoUploading && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:40 }}>
              <div style={{ width:24, height:24, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>}
          </div>
          <div onClick={() => !photoUploading && document.getElementById('profile-photo-input').click()}
            style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid #2a1f23' }}>
            <span style={{ fontSize:14, color:'#fff' }}>📷</span>
          </div>
          <input id="profile-photo-input" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }} />
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#fff', fontFamily:'Fraunces,serif' }}>{client.name || 'Guest'}</h2>
        {client.phone && <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginTop:4 }}>{client.phone}</p>}
        {client.email && <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginTop:2 }}>{client.email}</p>}
        <button onClick={() => setEditing(true)} style={{ marginTop:10, background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Edit Profile
        </button>
      </div>

      <div style={{ padding:'0 20px' }}>
        {/* Edit Profile Form */}
        {editing && (
          <div style={{ background:CARD, borderRadius:18, padding:20, border:`1px solid ${BORDER}`, marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Edit Profile</h3>
            <input value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} placeholder="Full name" style={iStyle} />
            <input value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} placeholder="Phone" style={iStyle} />
            <input value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))} placeholder="Email" type="email" style={iStyle} />
            <div style={{ display:'flex', gap:10 }}>
              <Btn full variant="secondary" onClick={() => setEditing(false)}>Cancel</Btn>
              <Btn full variant="primary" disabled={saving} onClick={saveProfile}>{saving ? 'Saving...' : 'Save'}</Btn>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          {[[clientBookings.length,'Bookings',ACCENT],['K'+totalSpent,'Spent',GOLD],[points,'GlowPoints',ROSE]].map(([v,l,c]) => (
            <div key={l} style={{ flex:1, background:CARD, borderRadius:16, padding:16, border:`1px solid ${BORDER}`, textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:700, fontFamily:'Fraunces,serif', color:c }}>{v}</div>
              <div style={{ fontSize:12, color:MUTED }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Leave a Review ⭐</h3>
            {pendingReviews.slice(0, 3).map(b => {
              const br = getBranch(b.branch_id);
              return (
                <div key={b.id} onClick={() => { setReviewModal(b); setReviewForm({ rating: 5, text: '', service_q: 5, cleanliness: 5, value: 5 }); }}
                  style={{ background:CARD, borderRadius:14, padding:14, marginBottom:8, border:`1px solid ${BORDER}`, cursor:'pointer', display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg, ${GOLD}30, ${ACCENT}30)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⭐</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{br?.name || 'Salon'}</div>
                    <div style={{ fontSize:12, color:MUTED }}>{b.booking_date} · Tap to review</div>
                  </div>
                  <Icon name="chevR" size={16} color={MUTED} />
                </div>
              );
            })}
          </div>
        )}

        {/* Referral Card */}
        {client.referral_code && (
          <div style={{ background:`linear-gradient(135deg, ${ROSE}15, ${ACCENT}15)`, borderRadius:18, padding:18, marginBottom:20, border:`1px solid ${ROSE}25` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:20 }}>🎁</span>
              <span style={{ fontSize:15, fontWeight:700 }}>Refer a Friend</span>
            </div>
            <p style={{ fontSize:13, color:MUTED, lineHeight:1.5, marginBottom:12 }}>Share your code and earn 50 GlowPoints when they book!</p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ flex:1, background:CARD, borderRadius:12, padding:'10px 14px', fontFamily:'monospace', fontSize:18, fontWeight:700, color:ACCENT, textAlign:'center', letterSpacing:2, border:`1px solid ${BORDER}` }}>
                {client.referral_code}
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(client.referral_code); showToast('Code copied! 📋'); }}
                style={{ padding:'10px 16px', borderRadius:12, background:ACCENT, border:'none', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                Copy
              </button>
            </div>
          </div>
        )}

        {/* GlowPoints Card */}
        <div style={{ background:`linear-gradient(135deg, ${GOLD}, ${ACCENT})`, borderRadius:20, padding:20, marginBottom:20, color:'#fff', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:50, background:'rgba(255,255,255,.1)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <Icon name="gift" size={20} color="#fff" />
            <span style={{ fontSize:14, fontWeight:600 }}>GlowPoints</span>
          </div>
          <div style={{ fontSize:32, fontWeight:700, fontFamily:'Fraunces,serif' }}>{points}</div>
          <p style={{ fontSize:13, opacity:.8, marginTop:4 }}>Earn points with every booking. Redeem for discounts!</p>
        </div>

        {/* Favorite Salons */}
        {favBranches.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Favorite Salons ❤️</h3>
            {favBranches.map(b => (
              <div key={b.id} onClick={() => navigate('salon', { branch: b })}
                style={{ background:CARD, borderRadius:14, padding:14, marginBottom:8, border:`1px solid ${BORDER}`, cursor:'pointer', display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg, ${ACCENT}30, ${ROSE}30)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✂</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{b.name}</div>
                  <div style={{ fontSize:12, color:MUTED }}>{b.location || 'Lusaka'}</div>
                </div>
                <Icon name="chevR" size={16} color={MUTED} />
              </div>
            ))}
          </div>
        )}

        {/* Menu */}
        <div style={{ background:CARD, borderRadius:18, overflow:'hidden', border:`1px solid ${BORDER}`, marginBottom:20 }}>
          {[{ label: 'My Bookings', icon: 'calendar', page: 'bookings' }, { label: 'Explore Salons', icon: 'search', page: 'explore' }].map((item, i) => (
            <div key={item.label} onClick={() => navigate(item.page)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer', borderBottom: i === 0 ? `1px solid ${BORDER}` : 'none' }}>
              <Icon name={item.icon} size={18} color={ACCENT} />
              <span style={{ fontSize:14, fontWeight:500, flex:1 }}>{item.label}</span>
              <Icon name="chevR" size={16} color={MUTED} />
            </div>
          ))}
        </div>

        {/* Status & Auth */}
        {isDemo && (
          <div style={{ background:'#fff3e0', borderRadius:14, padding:14, marginBottom:16, textAlign:'center' }}>
            <span style={{ fontSize:13, color:'#e65100', fontWeight:600 }}>👤 Demo Mode</span>
            <p style={{ fontSize:12, color:'#bf360c', marginTop:4 }}>Sign up to save your bookings</p>
          </div>
        )}
        {authUser && <div style={{ textAlign:'center', marginBottom:8 }}><span style={{ fontSize:12, color:MUTED }}>Signed in as {authUser.email}</span></div>}

        <Btn full variant={isDemo ? 'primary' : 'secondary'} onClick={handleLogout}
          style={{ borderRadius:14, marginBottom:20, ...(isDemo ? {} : { color:'#c62828' }) }}>
          {isDemo ? 'Sign Up for an Account' : 'Sign Out'}
        </Btn>
      </div>

      {/* Review Bottom Sheet */}
      {reviewModal && (
        <BottomSheet open={true} onClose={() => setReviewModal(null)} title="Write a Review">
          <StarRow label="Overall" value={reviewForm.rating} onChange={v => setReviewForm(p => ({...p, rating: v}))} />
          <StarRow label="Service Quality" value={reviewForm.service_q} onChange={v => setReviewForm(p => ({...p, service_q: v}))} />
          <StarRow label="Cleanliness" value={reviewForm.cleanliness} onChange={v => setReviewForm(p => ({...p, cleanliness: v}))} />
          <StarRow label="Value for Money" value={reviewForm.value} onChange={v => setReviewForm(p => ({...p, value: v}))} />
          <textarea value={reviewForm.text} onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
            placeholder="Tell us about your experience..." rows={4}
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${BORDER}`, fontSize:14, background:BG, color:DARK, marginTop:12, marginBottom:6, resize:'vertical' }} />
          <p style={{ fontSize:11, color:MUTED, marginBottom:14 }}>Earn 5 GlowPoints (+ 5 bonus for detailed reviews)</p>
          <Btn full variant="primary" onClick={submitReview}>Submit Review ⭐</Btn>
        </BottomSheet>
      )}
    </div>
  );
}

function HomePage({ branches, services, reviews, staff, branchAvgRating, branchReviews, categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, navigate, favorites, toggleFav, reminders, getService, getBranch, notifications, unreadCount, markAllRead }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const topBranches = [...branches].sort((a, b) => {
    const ra = branchReviews(a.id), rb = branchReviews(b.id);
    const avgA = ra.length ? ra.reduce((s, r) => s + r.rating_overall, 0) / ra.length : 0;
    const avgB = rb.length ? rb.reduce((s, r) => s + r.rating_overall, 0) / rb.length : 0;
    return avgB - avgA;
  });

  const filteredServices = selectedCategory === 'All' ? services : services.filter(s => s.category === selectedCategory);
  const recentReviews = reviews.slice(0, 5);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${ACCENT}, ${ROSE})`, padding:'48px 20px 28px', borderRadius:'0 0 28px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, marginBottom:4 }}>Welcome to</p>
            <h1 style={{ fontFamily:'Fraunces,serif', fontSize:28, fontWeight:700, color:'#fff' }}>GlowBook ✨</h1>
          </div>
          <div onClick={() => setShowNotifs(true)} style={{ width:40, height:40, borderRadius:20, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
            <Icon name="sparkle" size={20} color="#fff" />
            {unreadCount > 0 && <span style={{ position:'absolute', top:-2, right:-2, width:18, height:18, borderRadius:9, background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{unreadCount}</span>}
          </div>
        </div>
        {/* Search */}
        <div style={{ background:'rgba(255,255,255,.95)', borderRadius:14, display:'flex', alignItems:'center', padding:'0 14px', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
          <Icon name="search" size={18} color={MUTED} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search salons, services..."
            onFocus={() => navigate('explore')}
            style={{ flex:1, border:'none', background:'none', padding:'13px 10px', fontSize:15, color:DARK }} />
        </div>
      </div>

      <div style={{ padding:'0 20px' }}>
        {/* Booking Reminders */}
        {reminders && reminders.length > 0 && (
          <div style={{ marginBottom:16 }}>
            {reminders.map(r => {
              const svc = getService?.(r.service_id);
              const br = getBranch?.(r.branch_id);
              return (
                <div key={r.id} onClick={() => navigate('bookings')}
                  style={{ background:`linear-gradient(135deg, ${ACCENT}12, ${ROSE}12)`, borderRadius:16, padding:14, marginBottom:8,
                    border:`1px solid ${ACCENT}25`, cursor:'pointer', display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg, ${ACCENT}30, ${GOLD}30)`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>⏰</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>Upcoming in {r.hoursUntil}h</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{svc?.name || 'Appointment'}</div>
                    <div style={{ fontSize:12, color:MUTED }}>{br?.name} · {fmtTime(r.booking_time)}</div>
                  </div>
                  <Icon name="chevR" size={16} color={ACCENT} />
                </div>
              );
            })}
          </div>
        )}

        {/* Categories */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:16, marginBottom:8 }}>
          {categories.map(c => (
            <button key={c} onClick={() => { setSelectedCategory(c); navigate('explore'); }}
              style={{ flexShrink:0, padding:'10px 18px', borderRadius:50, border:`1.5px solid ${c === selectedCategory ? ACCENT : BORDER}`,
                background: c === selectedCategory ? `${ACCENT}12` : CARD, color: c === selectedCategory ? ACCENT : DARK,
                fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .2s' }}>
              {c !== 'All' && <span>{CATEGORIES_ICONS[c] || '•'}</span>}{c}
            </button>
          ))}
        </div>

        {/* Top Salons */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600 }}>Top Salons</h2>
            <button onClick={() => navigate('explore')} style={{ background:'none', border:'none', color:ACCENT, fontSize:13, fontWeight:600, cursor:'pointer' }}>See all →</button>
          </div>
          <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:8 }}>
            {topBranches.map(b => (
              <SalonCard key={b.id} branch={b} avg={branchAvgRating(b.id)} reviewCount={branchReviews(b.id).length}
                staffCount={staff.filter(s => s.branch_id === b.id).length}
                onClick={() => navigate('salon', { branch: b })} isFav={favorites.includes(b.id)} onFav={() => toggleFav(b.id)} />
            ))}
          </div>
        </div>

        {/* Popular Services */}
        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, marginBottom:14 }}>Popular Services</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {services.slice(0, 6).map(s => (
              <div key={s.id} onClick={() => navigate('explore', { service: s })}
                style={{ background:CARD, borderRadius:16, padding:16, border:`1px solid ${BORDER}`, cursor:'pointer', transition:'all .2s', overflow:'hidden' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                {s.image ? (
                  <img src={s.image} alt="" style={{ width:'100%', height:72, objectFit:'cover', borderRadius:10, marginBottom:10 }} />
                ) : (
                  <div style={{ fontSize:24, marginBottom:8 }}>{CATEGORIES_ICONS[s.category] || '✨'}</div>
                )}
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{s.name}</div>
                <div style={{ fontSize:13, color:MUTED }}>{s.duration}{s.duration_max && s.duration_max !== s.duration ? `–${s.duration_max}` : ''} min</div>
                <div style={{ fontSize:15, fontWeight:700, color:ACCENT, marginTop:6 }}>K{s.price}{s.price_max && s.price_max !== s.price ? `–${s.price_max}` : ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, marginBottom:14 }}>Recent Reviews</h2>
            {recentReviews.map(r => {
              const br = branches.find(b => b.id === r.branch_id);
              return (
                <div key={r.id} style={{ background:CARD, borderRadius:16, padding:16, border:`1px solid ${BORDER}`, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontWeight:600, fontSize:14 }}>{br?.name || 'Salon'}</span>
                    <Stars rating={r.rating_overall} size={12} />
                  </div>
                  <p style={{ fontSize:13, color:MUTED, lineHeight:1.5 }}>{r.review_text?.slice(0, 120)}{r.review_text?.length > 120 ? '...' : ''}</p>
                  {r.response_text && (
                    <div style={{ marginTop:10, padding:10, background:`${ACCENT}08`, borderRadius:10, borderLeft:`3px solid ${ACCENT}` }}>
                      <span style={{ fontSize:11, fontWeight:600, color:ACCENT }}>Response:</span>
                      <p style={{ fontSize:12, color:MUTED, marginTop:4 }}>{r.response_text}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Panel */}
      <BottomSheet open={showNotifs} onClose={() => { setShowNotifs(false); markAllRead(); }} title="Notifications">
        {notifications && notifications.length > 0 ? (
          <div style={{ maxHeight:400, overflowY:'auto' }}>
            {notifications.slice(0, 20).map(n => (
              <div key={n.id} style={{ padding:'12px 0', borderBottom:`1px solid ${BORDER}`, opacity: n.read ? 0.6 : 1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : '🔔'}</span>
                  <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{n.title}</span>
                  {!n.read && <span style={{ width:8, height:8, borderRadius:4, background:ACCENT }} />}
                </div>
                <p style={{ fontSize:13, color:MUTED, lineHeight:1.4, marginLeft:26 }}>{n.body}</p>
                <span style={{ fontSize:11, color:MUTED, marginLeft:26 }}>{n.time?.toLocaleTimeString?.() || ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🔔" title="No notifications" sub="You're all caught up!" />
        )}
      </BottomSheet>
    </div>
  );
}

// ─── SALON CARD ─────────────────────────────────────────────────────
function SalonCard({ branch, avg, reviewCount, staffCount, onClick, isFav, onFav }) {
  const colors = ['#c47d5a','#d4728c','#c9a84c','#7d8cc4','#5aac7d'];
  const bgColor = colors[branch.name?.length % colors.length] || ACCENT;

  return (
    <div onClick={onClick} style={{ flexShrink:0, width:220, background:CARD, borderRadius:20, overflow:'hidden',
      border:`1px solid ${BORDER}`, cursor:'pointer', transition:'all .2s', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
      <div style={{ height:120, background:`linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`, position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:40, opacity:.3 }}>✂</span>
        <button onClick={e => { e.stopPropagation(); onFav(); }}
          style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,.8)', border:'none', borderRadius:50,
            width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <Icon name="heart" size={16} color={isFav ? ROSE : '#999'} />
        </button>
      </div>
      <div style={{ padding:14 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{branch.name}</h3>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:MUTED, marginBottom:8 }}>
          <Icon name="map" size={12} color={MUTED} />{branch.location || 'Lusaka'}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Stars rating={Math.round(+avg)} size={12} />
            <span style={{ fontSize:12, fontWeight:600 }}>{avg}</span>
            <span style={{ fontSize:11, color:MUTED }}>({reviewCount})</span>
          </div>
          <span style={{ fontSize:11, color:MUTED }}>{staffCount} stylists</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// EXPLORE PAGE
// ═══════════════════════════════════════════════════════════════════════


export default function GlowBookClient() {
  // ── AUTH STATE ──
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // ── APP STATE ──
  const [page, setPage] = useState('home');
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingFlow, setBookingFlow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [client, setClient] = useState({ id: null, name: 'Guest', phone: '', email: '' });
  const [navHistory, setNavHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // ── AUTH CHECK ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user || null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setIsDemo(false);
    setClient({ id: null, name: 'Guest', phone: '', email: '' });
    setPage('home');
  };

  // ── DATA FETCH ──
  const fetchAll = async (user) => {
    setLoading(true);
    try {
      const [b, sv, st, cl, rv, bk] = await Promise.all([
        supabase.from('branches').select('*').eq('is_active', true),
        supabase.from('services').select('*').eq('is_active', true).order('category, name'),
        supabase.from('staff').select('*').eq('is_active', true).order('name'),
        supabase.from('clients').select('*'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('booking_date', { ascending: false }),
      ]);
      setBranches(b.data || []);
      setServices(sv.data || []);
      setStaff(st.data || []);
      setClients(cl.data || []);
      setReviews(rv.data || []);
      setBookings(bk.data || []);

      // Find client profile linked to auth user
      if (user) {
        const linked = (cl.data || []).find(c => c.auth_user_id === user.id);
        if (linked) setClient(linked);
        else {
          // Fallback: match by email
          const byEmail = (cl.data || []).find(c => c.email === user.email);
          if (byEmail) {
            // Link this client to auth user
            await supabase.from('clients').update({ auth_user_id: user.id }).eq('id', byEmail.id);
            setClient({ ...byEmail, auth_user_id: user.id });
          } else {
            setClient({ id: null, name: user.user_metadata?.name || user.email, email: user.email, phone: '' });
          }
        }
      } else if (cl.data?.length) {
        // Demo mode: use first client
        setClient(cl.data[0]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (authChecked && (authUser || isDemo)) fetchAll(authUser);
  }, [authChecked, authUser, isDemo]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  // ── NOTIFICATION CENTER ──
  const [notifications, setNotifications] = useState([]);
  const pushNotif = (title, body, type = 'info') => {
    setNotifications(prev => [{ id: Date.now(), title, body, type, time: new Date(), read: false }, ...prev].slice(0, 50));
  };
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // ── REAL-TIME SUBSCRIPTIONS ──
  useEffect(() => {
    if (!client?.id) return;
    const channel = supabase.channel('client-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `client_id=eq.${client.id}` }, payload => {
        if (payload.eventType === 'UPDATE') {
          const b = payload.new;
          if (b.status === 'confirmed') { showToast('Your booking was confirmed! ✅'); pushNotif('Booking Confirmed', `Your appointment on ${b.booking_date} at ${b.booking_time} has been confirmed`, 'success'); }
          else if (b.status === 'cancelled' && b.cancelled_by === 'business') { showToast('A booking was cancelled by the salon', 'error'); pushNotif('Booking Cancelled', `Your appointment on ${b.booking_date} was cancelled by the salon`, 'error'); }
          else if (b.status === 'completed') { pushNotif('Booking Complete', `Your appointment is done! Leave a review to earn GlowPoints ⭐`, 'success'); }
        }
        fetchAll();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `client_id=eq.${client.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [client?.id]);

  // ── BOOKING REMINDERS ──
  const [reminders, setReminders] = useState([]);
  useEffect(() => {
    if (!upcomingBookings.length) { setReminders([]); return; }
    const now = new Date();
    const rem = upcomingBookings.filter(b => {
      const dt = new Date(`${b.booking_date}T${b.booking_time || '09:00'}`);
      const hoursUntil = (dt - now) / (1000 * 60 * 60);
      return hoursUntil > 0 && hoursUntil <= 24;
    }).map(b => {
      const dt = new Date(`${b.booking_date}T${b.booking_time || '09:00'}`);
      const hoursUntil = Math.round((dt - new Date()) / (1000 * 60 * 60));
      return { ...b, hoursUntil };
    });
    setReminders(rem);
  }, [upcomingBookings]);

  // ── NAVIGATION ──
  const navigate = (pg, data) => {
    setNavHistory(h => [...h, page]);
    setPage(pg);
    if (data?.branch) setSelectedBranch(data.branch);
    if (data?.service) setSelectedService(data.service);
    if (data?.booking) setSelectedBooking(data.booking);
    if (data?.bookingFlow) setBookingFlow(data.bookingFlow);
  };
  const goBack = () => {
    const prev = navHistory[navHistory.length - 1] || 'home';
    setNavHistory(h => h.slice(0, -1));
    setPage(prev);
  };

  // ── HELPERS ──
  const getBranch = id => branches.find(b => b.id === id);
  const getService = id => services.find(s => s.id === id);
  const getStaffMember = id => staff.find(s => s.id === id);
  const getClient = id => clients.find(c => c.id === id);
  const branchReviews = bid => reviews.filter(r => r.branch_id === bid);
  const branchStaff = bid => staff.filter(s => s.branch_id === bid);
  const branchAvgRating = bid => {
    const rv = branchReviews(bid);
    return rv.length ? (rv.reduce((s, r) => s + (r.rating_overall || 0), 0) / rv.length).toFixed(1) : '—';
  };
  const clientBookings = bookings.filter(b => b.client_id === client?.id);
  const upcomingBookings = clientBookings.filter(b => b.booking_date >= todayStr() && !['cancelled','completed','no_show'].includes(b.status));
  const pastBookings = clientBookings.filter(b => b.status === 'completed' || b.status === 'no_show' || (b.booking_date < todayStr() && b.status !== 'cancelled'));
  const categories = ['All', ...new Set(services.map(s => s.category).filter(Boolean))];

  const toggleFav = bid => setFavorites(f => f.includes(bid) ? f.filter(x => x !== bid) : [...f, bid]);

  // ── BOOKING ACTIONS ──
  const cancelBooking = async (id) => {
    // Cancellation policy enforcement
    const bk = bookings.find(b => b.id === id);
    if (bk) {
      const br = branches.find(b => b.id === bk.branch_id);
      const cancelHours = br?.cancellation_hours ?? 2;
      const bookingDateTime = new Date(`${bk.booking_date}T${bk.booking_time || '00:00'}`);
      const hoursUntil = (bookingDateTime - new Date()) / (1000 * 60 * 60);
      if (hoursUntil < cancelHours && hoursUntil > 0) {
        const feePercent = br?.cancellation_fee_percent || 0;
        if (feePercent > 0) {
          const fee = Math.round((bk.total_amount || 0) * feePercent / 100);
          showToast(`Late cancellation — K${fee} fee (${feePercent}%) may apply`, 'error');
        }
      }
    }
    const { error } = await supabase.from('bookings').update({
      status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Cancelled by client', cancelled_by: 'client', updated_at: new Date().toISOString()
    }).eq('id', id);
    if (!error) { showToast('Booking cancelled'); fetchAll(); }
    else showToast('Failed to cancel', 'error');
  };

  const createBooking = async (flow) => {
    // Double-booking check
    if (flow.staff?.id) {
      const { data: existing } = await supabase.from('bookings')
        .select('id').eq('staff_id', flow.staff.id)
        .eq('booking_date', flow.date).eq('booking_time', flow.time)
        .neq('status', 'cancelled').limit(1);
      if (existing?.length) {
        showToast('This time slot was just booked. Please pick another.', 'error');
        return;
      }
    }

    // Rescheduling — update existing booking
    if (flow.rescheduleId) {
      const { error } = await supabase.from('bookings').update({
        booking_date: flow.date, booking_time: flow.time, staff_id: flow.staff?.id || null,
        status: 'pending', updated_at: new Date().toISOString(),
      }).eq('id', flow.rescheduleId);
      if (!error) { showToast('Booking rescheduled! 📅'); fetchAll(); setBookingFlow(null); setPage('bookings'); }
      else showToast('Reschedule failed: ' + error.message, 'error');
      return;
    }
    const svc = flow.service;
    const pointsDiscount = flow.usePoints && flow.pointsToUse > 0 ? Math.floor(flow.pointsToUse / 10) : 0;
    const rawAmount = svc.price_max || svc.price || 0;
    const finalAmount = Math.max(0, rawAmount - pointsDiscount);
    const baseData = {
      branch_id: flow.branch.id, client_id: client.id,
      service_id: svc.id, staff_id: flow.staff?.id || null,
      booking_date: flow.date, booking_time: flow.time,
      duration: svc.duration_max || svc.duration || 60,
      total_amount: finalAmount,
      discount_amount: pointsDiscount,
      points_used: flow.pointsToUse || 0,
      client_notes: flow.clientNotes || null,
      status: 'pending',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    // Recurring bookings
    if (flow.recurring && flow.recurringType) {
      const recurringId = crypto.randomUUID();
      const bookings = []; const weeks = flow.recurringType === 'weekly' ? 1 : flow.recurringType === 'biweekly' ? 2 : 4;
      const until = flow.recurringUntil || new Date(new Date(flow.date).getTime() + weeks * 4 * 7 * 86400000).toISOString().slice(0,10);
      let d = new Date(flow.date);
      while (d.toISOString().slice(0,10) <= until) {
        bookings.push({ ...baseData, booking_date: d.toISOString().slice(0,10), recurring_id: recurringId, recurring_type: flow.recurringType, recurring_until: until });
        d = new Date(d.getTime() + weeks * 7 * 86400000);
      }
      const { error } = await supabase.from('bookings').insert(bookings);
      if (!error) { showToast(`${bookings.length} recurring bookings created! 🎉`); fetchAll(); setBookingFlow(null); setPage('bookings'); }
      else showToast('Booking failed: ' + error.message, 'error');
    } else {
      const { error } = await supabase.from('bookings').insert(baseData);
      if (!error) {
        // Deduct GlowPoints if used
        if (flow.pointsToUse > 0 && client.id) {
          await supabase.from('clients').update({ glow_points: Math.max(0, (client.glow_points || 0) - flow.pointsToUse) }).eq('id', client.id);
        }
        showToast('Booking confirmed! 🎉'); fetchAll(); setBookingFlow(null); setPage('bookings');
      }
      else {
        const msg = error.message.includes('unique') || error.message.includes('duplicate') ? 'This time slot was just booked by someone else. Please choose another.' : error.message;
        showToast('Booking failed: ' + msg, 'error');
      }
    }
  };

  // ═══ AUTH GATE ═══
  if (!authChecked) return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{css}</style>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:4, background:ACCENT, animation:`pulse 1.2s ease ${i*.2}s infinite` }} />)}
      </div>
    </div>
  );

  if (!authUser && !isDemo) return (
    <AuthScreen
      onAuth={(user) => setAuthUser(user)}
      onDemo={() => setIsDemo(true)}
    />
  );

  // ═══ LOADING STATE ═══
  if (loading) return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:36, fontFamily:'Fraunces,serif', fontWeight:700, color:ACCENT }}>GlowBook</div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:4, background:ACCENT, animation:`pulse 1.2s ease ${i*.2}s infinite` }} />)}
      </div>
    </div>
  );

  // ═══ RENDER PAGES ═══
  const pages = {
    home: <HomePage {...{ branches, services, reviews, staff, branchAvgRating, branchReviews, categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, navigate, favorites, toggleFav, reminders, getService: id => services.find(s => s.id === id), getBranch: id => branches.find(b => b.id === id), notifications, unreadCount, markAllRead }} />,
    explore: <ExplorePage {...{ branches, services, reviews, branchAvgRating, branchReviews, navigate, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories, favorites, toggleFav }} />,
    salon: <SalonPage {...{ branch: selectedBranch, services, reviews: branchReviews(selectedBranch?.id), staff: branchStaff(selectedBranch?.id), branchAvgRating, navigate, goBack, favorites, toggleFav, getClient, client }} />,
    booking: <BookingFlow {...{ flow: {...bookingFlow, clientId: client?.id}, setBookingFlow, staff: branchStaff(bookingFlow?.branch?.id), services, createBooking, goBack, navigate }} />,
    bookings: <MyBookingsPage {...{ upcoming: upcomingBookings, past: pastBookings, getService, getStaffMember, getBranch, cancelBooking, rescheduleBooking: (bk) => {
      const svc = getService(bk.service_id); const br = getBranch(bk.branch_id); const stf = getStaffMember(bk.staff_id);
      setBookingFlow({ step: 2, branch: br, service: svc, staff: stf || { id: null, name: 'Any Available' }, date: null, time: null, rescheduleId: bk.id, clientPoints: client?.glow_points || 0 });
      setPage('booking');
    }, navigate, selectedBooking, setSelectedBooking }} />,
    profile: <ProfilePage {...{ client, clientBookings, branches, favorites, getBranch, navigate, showToast, authUser, isDemo, handleLogout }} />,
  };

  return (
    <div style={{ minHeight:'100vh', background:BG, maxWidth:480, margin:'0 auto', position:'relative', paddingBottom:72 }}>
      <style>{css}</style>
      {pages[page] || pages.home}
      {/* Bottom Nav */}
      <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480,
        background:'rgba(255,255,255,.92)', backdropFilter:'blur(16px)', borderTop:`1px solid ${BORDER}`,
        display:'flex', justifyContent:'space-around', padding:'8px 0 env(safe-area-inset-bottom, 8px)', zIndex:900 }}>
        {[
          { id:'home', icon:'home', label:'Home' },
          { id:'explore', icon:'search', label:'Explore' },
          { id:'bookings', icon:'calendar', label:'Bookings' },
          { id:'profile', icon:'user', label:'Profile' },
        ].map(n => (
          <button key={n.id} onClick={() => { setNavHistory([]); setPage(n.id); }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none',
              cursor:'pointer', padding:'4px 16px', borderRadius:12, transition:'all .2s',
              color: page === n.id ? ACCENT : MUTED }}>
            <Icon name={n.icon} size={22} color={page === n.id ? ACCENT : MUTED} />
            <span style={{ fontSize:11, fontWeight: page === n.id ? 700 : 500 }}>{n.label}</span>
          </button>
        ))}
      </nav>
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

