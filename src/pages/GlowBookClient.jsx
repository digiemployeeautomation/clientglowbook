import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const ACCENT = '#c47d5a';
const GOLD = '#c9a84c';
const ROSE = '#d4728c';
const BG = '#faf7f5';
const DARK = '#1a1215';
const CARD = '#ffffff';
const MUTED = '#8a7e7a';
const BORDER = '#ede8e4';
const SIDEBAR_W = 260;

const STATUS_MAP = {
  confirmed: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Confirmed' },
  pending: { bg: '#fff3e0', fg: '#e65100', label: 'Pending' },
  completed: { bg: '#e3f2fd', fg: '#1565c0', label: 'Completed' },
  cancelled: { bg: '#fce4ec', fg: '#c62828', label: 'Cancelled' },
  arrived: { bg: '#e0f7fa', fg: '#00695c', label: 'Arrived' },
  in_progress: { bg: '#f3e5f5', fg: '#7b1fa2', label: 'In Progress' },
  no_show: { bg: '#fce4ec', fg: '#880e4f', label: 'No Show' },
};

const CATEGORIES_ICONS = { Braids:'braids', Hair:'hair', Nails:'nails', Skincare:'skincare', Spa:'spa', Makeup:'makeup' };
const CatIcon = ({cat,size=18}) => { const n=CATEGORIES_ICONS[cat]; return n ? <Icon name={n} size={size} color={ACCENT}/> : <Icon name="sparkle" size={size} color={ACCENT}/> };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = d => { const dt = new Date(d + 'T00:00:00'); return `${DAYS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]}`; };
const fmtTime = t => { const [h,m] = t.split(':'); const hr = +h; return `${hr > 12 ? hr-12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Fuzzy Search ──
// Handles misspellings by combining: trigram similarity, Levenshtein distance, and contains-check
function fuzzyMatch(query, text) {
  if (!query || !text) return !query;
  const q = query.toLowerCase().trim(), t = text.toLowerCase();
  if (t.includes(q)) return true; // exact substring
  // split into words — match if ANY word fuzzy-matches any word in text
  const qWords = q.split(/\s+/), tWords = t.split(/\s+/);
  return qWords.every(qw => tWords.some(tw => {
    if (tw.includes(qw) || qw.includes(tw)) return true;
    // Levenshtein with threshold based on word length
    const maxDist = qw.length <= 3 ? 1 : qw.length <= 6 ? 2 : 3;
    let prev = Array.from({length:tw.length+1},(_,i)=>i);
    for (let i=1;i<=qw.length;i++){
      const curr=[i];
      for(let j=1;j<=tw.length;j++) curr[j]=Math.min(prev[j]+1,curr[j-1]+1,prev[j-1]+(qw[i-1]!==tw[j-1]?1:0));
      prev=curr;
    }
    if(prev[tw.length]<=maxDist) return true;
    // starts-with prefix only for short queries (avoids "stylist" matching "studio")
    if(qw.length>=2 && qw.length<=4 && tw.startsWith(qw)) return true;
    return false;
  }));
}

// ── Filter & Sort helpers ──
function filterAndSort({items, type, query, category, minRating, priceMin, priceMax, location, sortBy, branches, reviews, bookings, branchAvgRating, services}) {
  let list = [...items];
  if (type === 'branches') {
    // Fuzzy text search on name + location
    if (query) list = list.filter(b => fuzzyMatch(query, b.name) || fuzzyMatch(query, b.location));
    // Category: keep branches that have at least one service in that category
    if (category && category !== 'All') list = list.filter(b => services.some(s => (s.branch_id === b.id || !s.branch_id) && s.category === category));
    // Min rating
    if (minRating > 0) list = list.filter(b => { const avg = parseFloat(branchAvgRating(b.id)); return !isNaN(avg) && avg >= minRating; });
    // Price range: keep branches that have at least one service in range
    if (priceMin > 0 || priceMax < 9999) list = list.filter(b => services.some(s => (s.branch_id === b.id || !s.branch_id) && s.price >= priceMin && s.price <= priceMax));
    // Location area
    if (location && location !== 'All') list = list.filter(b => fuzzyMatch(location, b.location));
    // Sort
    if (sortBy === 'rating') list.sort((a,b) => parseFloat(branchAvgRating(b.id)||0) - parseFloat(branchAvgRating(a.id)||0));
    else if (sortBy === 'price_low') list.sort((a,b) => { const pa = Math.min(...services.filter(s=>s.branch_id===a.id||!s.branch_id).map(s=>s.price||999)); const pb = Math.min(...services.filter(s=>s.branch_id===b.id||!s.branch_id).map(s=>s.price||999)); return pa-pb; });
    else if (sortBy === 'price_high') list.sort((a,b) => { const pa = Math.max(...services.filter(s=>s.branch_id===a.id||!s.branch_id).map(s=>s.price||0)); const pb = Math.max(...services.filter(s=>s.branch_id===b.id||!s.branch_id).map(s=>s.price||0)); return pb-pa; });
    else if (sortBy === 'popular') list.sort((a,b) => (bookings||[]).filter(bk=>bk.branch_id===b.id).length - (bookings||[]).filter(bk=>bk.branch_id===a.id).length);
    else if (sortBy === 'newest') list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    // Services
    if (query) list = list.filter(s => fuzzyMatch(query, s.name) || fuzzyMatch(query, s.category) || fuzzyMatch(query, s.description));
    if (category && category !== 'All') list = list.filter(s => s.category === category);
    if (priceMin > 0) list = list.filter(s => s.price >= priceMin);
    if (priceMax < 9999) list = list.filter(s => s.price <= priceMax);
    if (sortBy === 'price_low') list.sort((a,b) => a.price - b.price);
    else if (sortBy === 'price_high') list.sort((a,b) => b.price - a.price);
    else if (sortBy === 'popular') list.sort((a,b) => (bookings||[]).filter(bk=>bk.service_id===b.id).length - (bookings||[]).filter(bk=>bk.service_id===a.id).length);
    else if (sortBy === 'newest') list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
}

function useBreakpoint() {
  const [bp, setBp] = useState('mobile');
  useEffect(() => {
    const check = () => { const w = window.innerWidth; setBp(w >= 1024 ? 'desktop' : w >= 640 ? 'tablet' : 'mobile'); };
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  html{font-size:16px;-webkit-text-size-adjust:100%}
  body{font-family:'DM Sans',system-ui,sans-serif;background:${BG};color:${DARK};-webkit-font-smoothing:antialiased;line-height:1.5;overflow-x:hidden}
  input,textarea,select,button{font-family:inherit;font-size:inherit}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fade-up{animation:fadeUp .35s ease both}
  .slide-up{animation:slideUp .3s cubic-bezier(.16,1,.3,1) both}
  ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px}
  input:focus,textarea:focus,select:focus{outline:none;border-color:${ACCENT}!important;box-shadow:0 0 0 3px ${ACCENT}22}
  .gb-grid-services{display:grid;gap:12px;grid-template-columns:1fr}
  @media(min-width:640px){.gb-grid-services{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1024px){.gb-grid-services{grid-template-columns:repeat(3,1fr)}}
  .gb-grid-pop{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
  @media(min-width:640px){.gb-grid-pop{grid-template-columns:repeat(3,1fr)}}
  @media(min-width:1024px){.gb-grid-pop{grid-template-columns:repeat(4,1fr)}}
  .gb-grid-stats{display:grid;gap:12px;grid-template-columns:repeat(3,1fr)}
  @media(max-width:400px){.gb-grid-stats{grid-template-columns:1fr}}
  .gb-salon-list{display:grid;gap:14px;grid-template-columns:1fr}
  @media(min-width:640px){.gb-salon-list{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1024px){.gb-salon-list{grid-template-columns:repeat(3,1fr)}}
  .gb-time-grid{display:grid;gap:8px;grid-template-columns:repeat(3,1fr)}
  @media(min-width:640px){.gb-time-grid{grid-template-columns:repeat(4,1fr)}}
  @media(min-width:1024px){.gb-time-grid{grid-template-columns:repeat(5,1fr)}}
  .gb-booking-layout{display:block}
  @media(min-width:1024px){.gb-booking-layout{display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start}}
  .gb-profile-layout{display:block}
  @media(min-width:768px){.gb-profile-layout{display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:start}}
  .touch-target{min-height:44px;min-width:44px;display:flex;align-items:center;justify-content:center}
  .gb-filter-panel{background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:16px;margin-bottom:16px;animation:fadeUp .25s ease both}
  .gb-filter-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
  .gb-filter-row:last-child{margin-bottom:0}
  .gb-filter-label{font-size:12px;font-weight:600;color:${MUTED};min-width:60px;flex-shrink:0}
  .gb-filter-input{border:1px solid ${BORDER};border-radius:10px;padding:8px 12px;font-size:13px;background:${BG};color:${DARK};min-height:36px;outline:none}
  .gb-filter-input:focus{border-color:${ACCENT};box-shadow:0 0 0 3px ${ACCENT}18}
  .gb-filter-select{border:1px solid ${BORDER};border-radius:10px;padding:8px 12px;font-size:13px;background:${BG};color:${DARK};min-height:36px;outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a7e7a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
  .gb-star-filter{display:flex;gap:2px;cursor:pointer}
  .gb-star-filter span{font-size:20px;transition:transform .15s}
  .gb-star-filter span:hover{transform:scale(1.2)}
  .gb-sort-btn{padding:7px 14px;border-radius:50px;border:1px solid ${BORDER};background:${CARD};color:${DARK};font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;min-height:34px;transition:all .15s}
  .gb-sort-btn.active{background:${ACCENT};color:#fff;border-color:${ACCENT}}
  .gb-filter-toggle{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;border:1px solid ${BORDER};background:${CARD};color:${DARK};font-size:13px;font-weight:600;cursor:pointer;min-height:40px;transition:all .15s}
  .gb-filter-toggle.has-filters{border-color:${ACCENT};color:${ACCENT};background:${ACCENT}08}
  .gb-filter-badge{background:${ACCENT};color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 5px}
  .gb-clear-btn{background:none;border:none;color:${ACCENT};font-size:12px;font-weight:600;cursor:pointer;padding:4px 8px;min-height:30px}
`;

async function uploadImage(bucket, folder, file) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl:'3600', upsert:false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

const Icon = ({ name, size = 20, color = DARK, ...p }) => {
  const paths = {
    home:<><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></>,
    search:<><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
    calendar:<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    user:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    star:<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z" fill={color}/></>,
    clock:<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    map:<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></>,
    phone:<><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
    back:<><path d="M19 12H5M12 19l-7-7 7-7"/></>,
    close:<><path d="M18 6L6 18M6 6l12 12"/></>,
    check:<><path d="M20 6L9 17l-5-5"/></>,
    heart:<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
    sparkle:<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>,
    gift:<><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 010-5C9 3 12 6 12 8M16.5 8a2.5 2.5 0 000-5C15 3 12 6 12 8"/></>,
    chevR:<><path d="M9 18l6-6-6-6"/></>,
    scissors:<><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></>,
    menu:<><path d="M3 12h18M3 6h18M3 18h18"/></>,
    bell:<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    logout:<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    braids:<><path d="M12 2c0 4-3 6-3 10s3 6 3 10"/><path d="M12 2c0 4 3 6 3 10s-3 6-3 10"/><path d="M8 6h8M8 12h8M8 18h8"/></>,
    hair:<><path d="M20 7c0-2.8-3.6-5-8-5S4 4.2 4 7c0 1.5.8 2.8 2 3.8V21h2v-4h8v4h2V10.8c1.2-1 2-2.3 2-3.8z"/><path d="M8 13v-2M12 13v-3M16 13v-2"/></>,
    nails:<><path d="M8 21V11a4 4 0 018 0v10"/><path d="M8 14h8"/><path d="M10 7v4M12 6v5M14 7v4"/></>,
    skincare:<><path d="M12 22c4-2 7-6 7-11V5l-7-3-7 3v6c0 5 3 9 7 11z"/><circle cx="12" cy="11" r="2"/><path d="M12 9v-2"/></>,
    spa:<><path d="M12 22c-4.97 0-9-2.24-9-5v-1c0-2.76 4.03-5 9-5s9 2.24 9 5v1c0 2.76-4.03 5-9 5z"/><path d="M12 11C9 11 7 8 7 5a5 5 0 0110 0c0 3-2 6-5 6z"/></>,
    makeup:<><path d="M9.5 2l-1 7.5c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5L14.5 2"/><path d="M12 13v9"/><path d="M8 22h8"/><circle cx="12" cy="5" r="1"/></>,
    dollar:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    share:<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></>,
    copy:<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    points:<><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7L2 9.4h7.6z" fill={color} stroke="none"/></>,
    filter:<><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
    sort:<><path d="M3 6h18M6 12h12M9 18h6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{paths[name]}</svg>;
};

const Badge = ({children,bg,fg}) => <span style={{display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,background:bg,color:fg,whiteSpace:'nowrap'}}>{children}</span>;

const Stars = ({rating,size=14}) => <span style={{display:'inline-flex',gap:1}}>{[1,2,3,4,5].map(i=><svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=rating?GOLD:'none'} stroke={i<=rating?GOLD:'#ccc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z"/></svg>)}</span>;

const Btn = ({children,variant='primary',full,small,disabled,onClick,style:s}) => {
  const base = {display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,border:'none',cursor:disabled?'not-allowed':'pointer',borderRadius:12,fontWeight:600,transition:'all .2s',opacity:disabled?.5:1,width:full?'100%':'auto',padding:small?'8px 16px':'13px 24px',fontSize:small?13:15,minHeight:44};
  const vars = {primary:{background:ACCENT,color:'#fff'},secondary:{background:'#f0ebe7',color:DARK},outline:{background:'transparent',color:ACCENT,border:`1.5px solid ${ACCENT}`},ghost:{background:'transparent',color:MUTED},gold:{background:GOLD,color:'#fff'},rose:{background:ROSE,color:'#fff'}};
  return <button onClick={onClick} disabled={disabled} style={{...base,...vars[variant],...s}}>{children}</button>;
};

const BottomSheet = ({open,onClose,title,children}) => {
  if(!open) return null;
  return <div style={{position:'fixed',inset:0,zIndex:1100,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
    <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.45)',backdropFilter:'blur(2px)'}}/>
    <div className="slide-up" style={{position:'relative',background:CARD,borderRadius:'24px 24px 0 0',maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'16px 20px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{width:40,height:4,borderRadius:2,background:BORDER,position:'absolute',top:8,left:'50%',transform:'translateX(-50%)'}}/>
        <h3 style={{fontSize:18,fontFamily:'Fraunces,serif',fontWeight:600,marginTop:8}}>{title}</h3>
        <button onClick={onClose} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="close" size={20} color={MUTED}/></button>
      </div>
      <div style={{padding:20,overflowY:'auto',flex:1}}>{children}</div>
    </div>
  </div>;
};

const Toast = ({message,type='success'}) => <div className="fade-up" style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:2000,background:type==='success'?'#2e7d32':'#c62828',color:'#fff',padding:'12px 24px',borderRadius:50,fontSize:14,fontWeight:600,boxShadow:'0 8px 32px rgba(0,0,0,.2)',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',maxWidth:'90vw'}}><Icon name={type==='success'?'check':'close'} size={16} color="#fff"/>{message}</div>;

const EmptyState = ({icon,title,sub}) => <div style={{textAlign:'center',padding:'48px 20px'}}><div style={{fontSize:40,marginBottom:12}}>{icon}</div><div style={{fontSize:16,fontWeight:600,marginBottom:4}}>{title}</div><div style={{fontSize:14,color:MUTED}}>{sub}</div></div>;

function FilterPanel({filters,setFilters,locations,showPanel,setShowPanel,resultCount}) {
  const {minRating=0,priceMin=0,priceMax=9999,location='All',sortBy='rating'} = filters;
  const activeCount = (minRating>0?1:0)+(priceMin>0?1:0)+(priceMax<9999?1:0)+(location!=='All'?1:0);
  const uf = (k,v) => setFilters(f=>({...f,[k]:v}));
  const clearAll = () => setFilters(f=>({...f,minRating:0,priceMin:0,priceMax:9999,location:'All',sortBy:'rating'}));

  return (
    <div>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <button className={`gb-filter-toggle ${activeCount>0?'has-filters':''}`} onClick={()=>setShowPanel(!showPanel)}>
          <Icon name="filter" size={16} color={activeCount>0?ACCENT:MUTED}/>
          Filters
          {activeCount>0&&<span className="gb-filter-badge">{activeCount}</span>}
        </button>
        {/* Sort pills always visible */}
        <div style={{display:'flex',gap:6,overflowX:'auto',flex:1}}>
          {[{id:'rating',label:'Top Rated'},{id:'popular',label:'Most Popular'},{id:'price_low',label:'Price ↑'},{id:'price_high',label:'Price ↓'},{id:'newest',label:'Newest'}].map(s=>
            <button key={s.id} className={`gb-sort-btn ${sortBy===s.id?'active':''}`} onClick={()=>uf('sortBy',s.id)}>{s.label}</button>
          )}
        </div>
      </div>
      {showPanel&&<div className="gb-filter-panel" style={{marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <span style={{fontSize:14,fontWeight:700,color:DARK}}>Filters</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {activeCount>0&&<button className="gb-clear-btn" onClick={clearAll}>Clear all</button>}
            <span style={{fontSize:12,color:MUTED}}>{resultCount} result{resultCount!==1?'s':''}</span>
          </div>
        </div>

        {/* Rating filter */}
        <div className="gb-filter-row">
          <span className="gb-filter-label">Rating</span>
          <div className="gb-star-filter">
            {[1,2,3,4,5].map(i=>(
              <span key={i} onClick={()=>uf('minRating',minRating===i?0:i)} style={{color:i<=minRating?GOLD:'#ddd',cursor:'pointer',fontSize:22,lineHeight:1}}>{i<=minRating?'★':'☆'}</span>
            ))}
            {minRating>0&&<span style={{fontSize:12,color:MUTED,marginLeft:6}}>{minRating}+ stars</span>}
          </div>
        </div>

        {/* Price range */}
        <div className="gb-filter-row">
          <span className="gb-filter-label">Price</span>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:13,color:MUTED}}>K</span>
            <input type="number" className="gb-filter-input" placeholder="Min" value={priceMin||''} onChange={e=>uf('priceMin',parseInt(e.target.value)||0)} style={{width:80}}/>
            <span style={{color:MUTED}}>—</span>
            <input type="number" className="gb-filter-input" placeholder="Max" value={priceMax>=9999?'':priceMax} onChange={e=>uf('priceMax',parseInt(e.target.value)||9999)} style={{width:80}}/>
          </div>
          {/* Quick price buttons */}
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {[{l:'Under K50',min:0,max:50},{l:'K50–150',min:50,max:150},{l:'K150–300',min:150,max:300},{l:'K300+',min:300,max:9999}].map(p=>
              <button key={p.l} className={`gb-sort-btn ${priceMin===p.min&&priceMax===p.max?'active':''}`} onClick={()=>{uf('priceMin',p.min);uf('priceMax',p.max);}}>{p.l}</button>
            )}
          </div>
        </div>

        {/* Location filter */}
        <div className="gb-filter-row">
          <span className="gb-filter-label">Area</span>
          <select className="gb-filter-select" value={location} onChange={e=>uf('location',e.target.value)}>
            <option value="All">All areas</option>
            {locations.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>}
    </div>
  );
}

const Toggle = ({value,onChange}) => <div onClick={onChange} style={{width:44,height:26,borderRadius:13,background:value?ACCENT:BORDER,cursor:'pointer',position:'relative',transition:'all .2s',flexShrink:0}}><div style={{width:22,height:22,borderRadius:11,background:'#fff',position:'absolute',top:2,left:value?20:2,transition:'all .2s',boxShadow:'0 1px 3px rgba(0,0,0,.15)'}}/></div>;

const NAV_ITEMS = [{id:'home',icon:'home',label:'Home'},{id:'explore',icon:'search',label:'Explore'},{id:'bookings',icon:'calendar',label:'Bookings'},{id:'profile',icon:'user',label:'Profile'}];

function AppShell({page,setPage,children,client,unreadCount,onNotifClick,onLogout,bp}) {
  const [drawerOpen,setDrawerOpen] = useState(false);
  const navTo = id => {setPage(id);setDrawerOpen(false)};

  const Sidebar = () => (
    <aside style={{position:'fixed',top:0,left:0,bottom:0,width:SIDEBAR_W,background:CARD,borderRight:`1px solid ${BORDER}`,display:'flex',flexDirection:'column',zIndex:100,overflowY:'auto'}}>
      <div style={{padding:'24px 20px 16px',display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:36,height:36,borderRadius:12,background:`linear-gradient(135deg,${ACCENT},${ROSE})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,fontWeight:700}}>✨</div>
        <span style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:700,color:DARK}}>GlowBook</span>
      </div>
      <nav style={{flex:1,padding:'8px 12px'}}>
        {NAV_ITEMS.map(n=><button key={n.id} onClick={()=>navTo(n.id)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',borderRadius:12,border:'none',cursor:'pointer',marginBottom:4,transition:'all .15s',background:page===n.id?`${ACCENT}12`:'transparent',color:page===n.id?ACCENT:MUTED,fontSize:14,fontWeight:page===n.id?600:500,textAlign:'left'}}>
          <Icon name={n.icon} size={20} color={page===n.id?ACCENT:MUTED}/>{n.label}
          {n.id==='bookings'&&unreadCount>0&&<span style={{marginLeft:'auto',background:ROSE,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10}}>{unreadCount}</span>}
        </button>)}
      </nav>
      <div style={{padding:16,borderTop:`1px solid ${BORDER}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 4px'}}>
          <div style={{width:36,height:36,borderRadius:18,background:`linear-gradient(135deg,${ACCENT},${ROSE})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14,flexShrink:0}}>{client?.name?.[0]||'G'}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{client?.name||'Guest'}</div>
            <div style={{fontSize:11,color:MUTED}}>{client?.email||''}</div>
          </div>
          <button onClick={onLogout} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="logout" size={18} color={MUTED}/></button>
        </div>
      </div>
    </aside>
  );

  const Drawer = () => (
    <div style={{position:'fixed',inset:0,zIndex:1050,display:drawerOpen?'flex':'none'}}>
      <div onClick={()=>setDrawerOpen(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(2px)'}}/>
      <div style={{position:'relative',width:280,maxWidth:'80vw',background:CARD,height:'100%',display:'flex',flexDirection:'column',animation:drawerOpen?'slideIn .25s ease':'none',boxShadow:'4px 0 24px rgba(0,0,0,.1)'}}>
        <div style={{padding:'20px 20px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${ACCENT},${ROSE})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>✨</div>
            <span style={{fontFamily:'Fraunces,serif',fontSize:18,fontWeight:700}}>GlowBook</span>
          </div>
          <button onClick={()=>setDrawerOpen(false)} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="close" size={22} color={MUTED}/></button>
        </div>
        <div style={{padding:'12px 20px 16px',borderBottom:`1px solid ${BORDER}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:44,height:44,borderRadius:22,background:`linear-gradient(135deg,${ACCENT},${ROSE})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18}}>{client?.name?.[0]||'G'}</div>
            <div><div style={{fontSize:15,fontWeight:600}}>{client?.name||'Guest'}</div><div style={{fontSize:12,color:MUTED}}>{client?.glow_points||0} GlowPoints ⭐</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:'12px 12px',overflowY:'auto'}}>
          {NAV_ITEMS.map(n=><button key={n.id} onClick={()=>navTo(n.id)} style={{display:'flex',alignItems:'center',gap:14,width:'100%',padding:'14px 16px',borderRadius:12,border:'none',cursor:'pointer',marginBottom:4,minHeight:48,background:page===n.id?`${ACCENT}12`:'transparent',color:page===n.id?ACCENT:DARK,fontSize:15,fontWeight:page===n.id?600:500,textAlign:'left'}}>
            <Icon name={n.icon} size={22} color={page===n.id?ACCENT:MUTED}/>{n.label}
          </button>)}
        </nav>
        <div style={{padding:16,borderTop:`1px solid ${BORDER}`}}>
          <Btn full variant="secondary" onClick={()=>{setDrawerOpen(false);onLogout()}} style={{borderRadius:12,color:'#c62828'}}>Sign Out</Btn>
        </div>
      </div>
    </div>
  );

  const TopBar = () => (
    <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORDER}`,padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',height:56}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setDrawerOpen(true)} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="menu" size={24} color={DARK}/></button>
        <span style={{fontFamily:'Fraunces,serif',fontSize:18,fontWeight:700,color:DARK}}>GlowBook</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        <button onClick={onNotifClick} className="touch-target" style={{background:'none',border:'none',cursor:'pointer',position:'relative'}}>
          <Icon name="bell" size={22} color={MUTED}/>
          {unreadCount>0&&<span style={{position:'absolute',top:6,right:6,width:8,height:8,borderRadius:4,background:'#EF4444'}}/>}
        </button>
      </div>
    </header>
  );

  const isDesktop = bp === 'desktop';
  return (
    <div style={{minHeight:'100vh',background:BG}}>
      {isDesktop?<Sidebar/>:<><TopBar/><Drawer/></>}
      <main style={{marginLeft:isDesktop?SIDEBAR_W:0,minHeight:isDesktop?'100vh':'auto'}}>{children}</main>
    </div>
  );
}

function AuthScreen({onAuth}) {
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [referralCode,setReferralCode]=useState('');
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const bp=useBreakpoint();

  const handleLogin=async()=>{
    if(!email||!password)return setError('Please fill in all fields');
    setSubmitting(true);setError('');
    const{data,error:err}=await supabase.auth.signInWithPassword({email,password});
    setSubmitting(false);
    if(err)return setError(err.message==='Email not confirmed'?'Check your email to confirm.':err.message);
    onAuth(data.user);
  };

  const handleSignup=async()=>{
    if(!email||!password||!name)return setError('Name, email & password required');
    if(password.length<6)return setError('Password min 6 chars');
    setSubmitting(true);setError('');
    const{data,error:err}=await supabase.auth.signUp({email,password,options:{data:{name,phone}}});
    setSubmitting(false);
    if(err)return setError(err.message);
    if(data.user){
      const code=(name.slice(0,3)+data.user.id.slice(0,4)).toUpperCase();
      const ins={auth_user_id:data.user.id,name,phone,email,referral_code:code,glow_points:0,total_points_earned:0,total_bookings:0,total_spent:0,is_active:true,account_status:'active',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      if(referralCode.trim()){
        const{data:ref}=await supabase.from('clients').select('id').eq('referral_code',referralCode.trim().toUpperCase()).single();
        if(ref){ins.referred_by=ref.id;await supabase.from('referrals').insert({referrer_id:ref.id,referred_email:email,referred_name:name,referral_code:referralCode.trim().toUpperCase(),status:'signed_up'})}
      }
      await supabase.from('clients').insert(ins);
    }
    setMode('confirm');
  };

  const handleForgot=async()=>{
    if(!email)return setError('Enter your email');
    setSubmitting(true);setError('');
    const{error:err}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    setSubmitting(false);
    if(err)return setError(err.message);
    setMode('reset_sent');
  };

  const iStyle={width:'100%',padding:'14px 16px',borderRadius:12,border:`1.5px solid ${BORDER}`,fontSize:15,background:CARD,color:DARK,marginBottom:12,minHeight:48};
  const isWide=bp!=='mobile';

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:isWide?'row':'column'}}>
      <style>{css}</style>
      <div style={{background:`linear-gradient(135deg,${ACCENT},${ROSE})`,padding:isWide?'60px 48px':'52px 24px 36px',borderRadius:isWide?0:'0 0 32px 32px',textAlign:isWide?'left':'center',flex:isWide?'0 0 45%':'none',display:'flex',flexDirection:'column',justifyContent:'center',minHeight:isWide?'100vh':'auto'}}>
        <div style={{fontSize:isWide?56:48,marginBottom:8}}>✨</div>
        <h1 style={{fontFamily:'Fraunces,serif',fontSize:isWide?40:32,fontWeight:700,color:'#fff',marginBottom:8}}>GlowBook</h1>
        <p style={{color:'rgba(255,255,255,.85)',fontSize:isWide?18:15,maxWidth:360}}>Book beauty services near you</p>
      </div>
      <div className="fade-up" style={{padding:isWide?'48px 56px':'24px',flex:1,display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:isWide?480:'100%'}}>
        {mode==='confirm'?(
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{fontSize:56,marginBottom:16}}>📧</div>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:22,fontWeight:700,marginBottom:8}}>Check your email</h2>
            <p style={{color:MUTED,fontSize:14,lineHeight:1.6,marginBottom:24}}>Confirmation link sent to <strong>{email}</strong>.</p>
            <Btn full variant="primary" onClick={()=>{setMode('login');setError('')}}>Go to Login</Btn>
          </div>
        ):mode==='reset_sent'?(
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{fontSize:56,marginBottom:16}}>🔑</div>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:22,fontWeight:700,marginBottom:8}}>Reset link sent</h2>
            <p style={{color:MUTED,fontSize:14,marginBottom:24}}>Check <strong>{email}</strong>.</p>
            <Btn full variant="primary" onClick={()=>{setMode('login');setError('')}}>Back to Login</Btn>
          </div>
        ):mode==='forgot'?(
          <>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:24,fontWeight:700,marginBottom:4}}>Reset password</h2>
            <p style={{color:MUTED,fontSize:14,marginBottom:24}}>Enter your email for a reset link</p>
            {error&&<div style={{background:'#fce4ec',color:'#c62828',padding:'12px 16px',borderRadius:12,fontSize:13,fontWeight:500,marginBottom:16}}>{error}</div>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={iStyle} onKeyDown={e=>e.key==='Enter'&&handleForgot()}/>
            <Btn full variant="primary" disabled={submitting} onClick={handleForgot} style={{marginBottom:12}}>{submitting?'Sending...':'Send Reset Link'}</Btn>
            <button onClick={()=>{setMode('login');setError('')}} style={{background:'none',border:'none',color:ACCENT,fontSize:14,fontWeight:600,cursor:'pointer',padding:8,textAlign:'center'}}>Back to login</button>
          </>
        ):(
          <>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:24,fontWeight:700,marginBottom:4}}>{mode==='login'?'Welcome back':'Create account'}</h2>
            <p style={{color:MUTED,fontSize:14,marginBottom:24}}>{mode==='login'?'Sign in to manage bookings':'Join GlowBook'}</p>
            {error&&<div style={{background:'#fce4ec',color:'#c62828',padding:'12px 16px',borderRadius:12,fontSize:13,fontWeight:500,marginBottom:16}}>{error}</div>}
            {mode==='signup'&&<><input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={iStyle}/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone (optional)" style={iStyle}/></>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={iStyle}/>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={iStyle} onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleSignup())}/>
            {mode==='signup'&&<input value={referralCode} onChange={e=>setReferralCode(e.target.value)} placeholder="Referral code (optional)" style={iStyle}/>}
            <Btn full variant="primary" disabled={submitting} onClick={mode==='login'?handleLogin:handleSignup} style={{marginBottom:12}}>{submitting?'Please wait...':mode==='login'?'Sign In':'Create Account'}</Btn>
            {mode==='login'&&<button onClick={()=>{setMode('forgot');setError('')}} style={{background:'none',border:'none',color:MUTED,fontSize:13,cursor:'pointer',padding:4,marginBottom:8,textAlign:'center'}}>Forgot password?</button>}
            <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}} style={{background:'none',border:'none',color:ACCENT,fontSize:14,fontWeight:600,cursor:'pointer',padding:8,marginBottom:16,textAlign:'center'}}>{mode==='login'?"Don't have an account? Sign up":'Already have an account? Sign in'}</button>
          </>
        )}
      </div>
    </div>
  );
}

function HomePage({branches,services,reviews,staff,bookings,branchAvgRating,branchReviews,categories,selectedCategory,setSelectedCategory,searchQuery,setSearchQuery,navigate,favorites,toggleFav,reminders,getService,getBranch,bp,filters,setFilters,showFilterPanel,setShowFilterPanel,locations}) {
  const filteredBranches = filterAndSort({items:branches,type:'branches',query:searchQuery,category:selectedCategory,minRating:filters.minRating,priceMin:filters.priceMin,priceMax:filters.priceMax,location:filters.location,sortBy:filters.sortBy,branches,reviews,bookings,branchAvgRating,services});
  const filteredServices = filterAndSort({items:services,type:'services',query:searchQuery,category:selectedCategory,minRating:0,priceMin:filters.priceMin,priceMax:filters.priceMax,location:'All',sortBy:filters.sortBy,branches,reviews,bookings,branchAvgRating,services});
  const recentReviews=reviews.slice(0,4);
  const pad=bp==='desktop'?'32px':'20px';
  const hasActiveFilters = searchQuery || filters.minRating>0 || filters.priceMin>0 || filters.priceMax<9999 || (filters.location&&filters.location!=='All');

  return (
    <div className="fade-up">
      <div style={{background:`linear-gradient(135deg,${ACCENT},${ROSE})`,padding:bp==='desktop'?'40px 32px':'28px 20px',borderRadius:bp==='desktop'?0:'0 0 24px 24px'}}>
        <div style={{maxWidth:720}}>
          <p style={{color:'rgba(255,255,255,.8)',fontSize:14,marginBottom:4}}>Welcome to</p>
          <h1 style={{fontFamily:'Fraunces,serif',fontSize:bp==='desktop'?32:26,fontWeight:700,color:'#fff',marginBottom:16}}>GlowBook ✨</h1>
          <div style={{background:'rgba(255,255,255,.95)',borderRadius:14,display:'flex',alignItems:'center',padding:'0 14px',boxShadow:'0 4px 20px rgba(0,0,0,.08)'}}>
            <Icon name="search" size={18} color={MUTED}/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search salons, services..." onFocus={()=>navigate('explore')} style={{flex:1,border:'none',background:'none',padding:'14px 10px',fontSize:15,color:DARK,minHeight:48}}/>
            {searchQuery&&<button onClick={()=>setSearchQuery('')} style={{background:'none',border:'none',cursor:'pointer',padding:4}}><Icon name="close" size={16} color={MUTED}/></button>}
          </div>
        </div>
      </div>
      <div style={{padding:`16px ${pad} 32px`}}>
        {reminders?.length>0&&<div style={{marginBottom:20}}>{reminders.map(r=>{const svc=getService?.(r.service_id);const br=getBranch?.(r.branch_id);return(
          <div key={r.id} onClick={()=>navigate('bookings')} style={{background:`linear-gradient(135deg,${ACCENT}12,${ROSE}12)`,borderRadius:16,padding:14,marginBottom:8,border:`1px solid ${ACCENT}25`,cursor:'pointer',display:'flex',gap:12,alignItems:'center'}}>
            <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${ACCENT}30,${GOLD}30)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>⏰</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:ACCENT}}>Upcoming in {r.hoursUntil}h</div><div style={{fontSize:14,fontWeight:600}}>{svc?.name||'Appointment'}</div><div style={{fontSize:12,color:MUTED}}>{br?.name} · {fmtTime(r.booking_time)}</div></div>
            <Icon name="chevR" size={16} color={ACCENT}/>
          </div>
        )})}</div>}
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:16,marginBottom:8}}>
          {categories.map(c=><button key={c} onClick={()=>{setSelectedCategory(c);if(c!=='All')navigate('explore');}} style={{flexShrink:0,padding:'10px 18px',borderRadius:50,border:`1.5px solid ${c===selectedCategory?ACCENT:BORDER}`,background:c===selectedCategory?`${ACCENT}12`:CARD,color:c===selectedCategory?ACCENT:DARK,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,minHeight:44}}>{c!=='All'&&<CatIcon cat={c}/>}{c}</button>)}
        </div>

        {/* Filter bar on home too */}
        <div style={{marginBottom:20}}>
          <FilterPanel filters={filters} setFilters={setFilters} locations={locations} showPanel={showFilterPanel} setShowPanel={setShowFilterPanel} resultCount={filteredBranches.length}/>
        </div>

        <div style={{marginBottom:28}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600}}>{hasActiveFilters?`Results (${filteredBranches.length})`:'Top Salons'}</h2>
            <button onClick={()=>navigate('explore')} style={{background:'none',border:'none',color:ACCENT,fontSize:13,fontWeight:600,cursor:'pointer',minHeight:44,display:'flex',alignItems:'center'}}>See all →</button>
          </div>
          {filteredBranches.length>0?<div className="gb-salon-list">
            {filteredBranches.slice(0,bp==='desktop'?6:4).map(b=>{
              const colors=['#c47d5a','#d4728c','#c9a84c','#7d8cc4','#5aac7d'];
              const bgC=colors[b.name?.length%colors.length]||'#c47d5a';
              const avg=branchAvgRating(b.id);
              return(
                <div key={b.id} onClick={()=>navigate('salon',{branch:b})} style={{background:CARD,borderRadius:18,overflow:'hidden',border:`1px solid ${BORDER}`,cursor:'pointer',transition:'transform .2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  <div style={{height:100,background:b.images?.[0]?`url(${b.images[0]}) center/cover`:`linear-gradient(135deg,${bgC},${bgC}dd)`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {!b.images?.[0]&&<span style={{fontSize:36,opacity:.25}}>✂</span>}
                    <button onClick={e=>{e.stopPropagation();toggleFav(b.id)}} style={{position:'absolute',top:10,right:10,background:'rgba(255,255,255,.8)',border:'none',borderRadius:50,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><Icon name="heart" size={16} color={favorites.includes(b.id)?ROSE:'#999'}/></button>
                  </div>
                  <div style={{padding:14}}>
                    <h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>{b.name}</h3>
                    <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:MUTED,marginBottom:6}}><Icon name="map" size={12} color={MUTED}/>{b.location||'Lusaka'}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}><Stars rating={Math.round(+avg)} size={12}/><span style={{fontSize:12,fontWeight:600}}>{avg}</span><span style={{fontSize:11,color:MUTED}}>({branchReviews(b.id).length})</span></div>
                      {services.filter(s=>s.branch_id===b.id||!s.branch_id).length>0&&<span style={{fontSize:11,color:MUTED}}>· from K{Math.min(...services.filter(s=>s.branch_id===b.id||!s.branch_id).map(s=>s.price))}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>:<EmptyState icon="🔍" title="No salons match" sub="Try adjusting your filters"/>}
        </div>
        <div style={{marginBottom:28}}>
          <h2 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600,marginBottom:14}}>{hasActiveFilters?`Services (${filteredServices.length})`:'Popular Services'}</h2>
          {filteredServices.length>0?<div className="gb-grid-pop">
            {filteredServices.slice(0,bp==='desktop'?8:6).map(s=>(
              <div key={s.id} onClick={()=>navigate('explore',{service:s})} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`,cursor:'pointer',transition:'transform .2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{marginBottom:8}}><CatIcon cat={s.category} size={24}/></div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4,lineHeight:1.3}}>{s.name}</div>
                <div style={{fontSize:13,color:MUTED}}>{s.duration}{s.duration_max&&s.duration_max!==s.duration?`–${s.duration_max}`:''} min</div>
                <div style={{fontSize:15,fontWeight:700,color:ACCENT,marginTop:6}}>K{s.price}{s.price_max&&s.price_max!==s.price?`–${s.price_max}`:''}</div>
              </div>
            ))}
          </div>:<EmptyState icon="💇" title="No services match" sub="Try adjusting filters"/>}
        </div>
        {!hasActiveFilters&&recentReviews.length>0&&(
          <div style={{marginBottom:28}}>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600,marginBottom:14}}>Recent Reviews</h2>
            <div style={{display:'grid',gap:12,gridTemplateColumns:bp==='desktop'?'repeat(2,1fr)':'1fr'}}>
              {recentReviews.map(r=>{const br=branches.find(b=>b.id===r.branch_id);return(
                <div key={r.id} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><span style={{fontWeight:600,fontSize:14}}>{br?.name||'Salon'}</span><Stars rating={r.rating_overall} size={12}/></div>
                  <p style={{fontSize:13,color:MUTED,lineHeight:1.5}}>{r.review_text?.slice(0,120)}{r.review_text?.length>120?'...':''}</p>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExplorePage({branches,services,reviews,bookings,branchAvgRating,branchReviews,navigate,searchQuery,setSearchQuery,selectedCategory,setSelectedCategory,categories,favorites,toggleFav,bp,filters,setFilters,showFilterPanel,setShowFilterPanel,locations}) {
  const [viewMode,setViewMode]=useState('salons');
  const pad=bp==='desktop'?'32px':'20px';

  const filteredBranches = filterAndSort({items:branches,type:'branches',query:searchQuery,category:selectedCategory,minRating:filters.minRating,priceMin:filters.priceMin,priceMax:filters.priceMax,location:filters.location,sortBy:filters.sortBy,branches,reviews,bookings,branchAvgRating,services});
  const filteredServices = filterAndSort({items:services,type:'services',query:searchQuery,category:selectedCategory,minRating:0,priceMin:filters.priceMin,priceMax:filters.priceMax,location:'All',sortBy:filters.sortBy,branches,reviews,bookings,branchAvgRating,services});
  const resultCount = viewMode==='salons'?filteredBranches.length:filteredServices.length;

  // Fuzzy search suggestion when no results
  const hasSuggestion = searchQuery && resultCount===0;

  return (
    <div className="fade-up">
      <div style={{padding:`20px ${pad} 16px`,background:CARD,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,maxWidth:640}}>
          <div style={{flex:1,background:BG,borderRadius:14,display:'flex',alignItems:'center',padding:'0 14px',border:`1px solid ${BORDER}`}}>
            <Icon name="search" size={18} color={MUTED}/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} autoFocus placeholder="Search salons, services..." style={{flex:1,border:'none',background:'none',padding:'12px 10px',fontSize:15,color:DARK,minHeight:44}}/>
            {searchQuery&&<button onClick={()=>setSearchQuery('')} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="close" size={16} color={MUTED}/></button>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
          {categories.map(c=><button key={c} onClick={()=>setSelectedCategory(c)} style={{flexShrink:0,padding:'8px 16px',borderRadius:50,border:'none',background:c===selectedCategory?ACCENT:`${ACCENT}10`,color:c===selectedCategory?'#fff':DARK,fontSize:13,fontWeight:600,cursor:'pointer',minHeight:36}}>{c!=='All'&&<span style={{marginRight:4}}><CatIcon cat={c}/></span>}{c}</button>)}
        </div>
      </div>
      <div style={{padding:`14px ${pad} 0`}}>
        <FilterPanel filters={filters} setFilters={setFilters} locations={locations} showPanel={showFilterPanel} setShowPanel={setShowFilterPanel} resultCount={resultCount}/>
      </div>
      <div style={{padding:`10px ${pad}`,display:'flex',gap:8,maxWidth:300}}>
        {['salons','services'].map(v=><button key={v} onClick={()=>setViewMode(v)} style={{flex:1,padding:'10px',borderRadius:10,border:'none',fontWeight:600,fontSize:13,minHeight:40,background:viewMode===v?DARK:'#f0ebe7',color:viewMode===v?'#fff':DARK,cursor:'pointer',textTransform:'capitalize'}}>{v} ({v==='salons'?filteredBranches.length:filteredServices.length})</button>)}
      </div>
      <div style={{padding:`0 ${pad} 32px`}}>
        {hasSuggestion && <div style={{textAlign:'center',padding:'32px 16px'}}>
          <div style={{fontSize:32,marginBottom:8}}>🔍</div>
          <div style={{fontSize:15,fontWeight:600,color:DARK,marginBottom:4}}>No results for "{searchQuery}"</div>
          <div style={{fontSize:13,color:MUTED,marginBottom:12}}>Check for typos or try a different spelling</div>
          {branches.length>0&&<div style={{fontSize:12,color:MUTED}}>Try: {branches.slice(0,3).map(b=>b.name).join(', ')}</div>}
        </div>}
        {!hasSuggestion && (viewMode==='salons'?(filteredBranches.length?
          <div className="gb-salon-list">
            {filteredBranches.map(b=>(
              <div key={b.id} onClick={()=>navigate('salon',{branch:b})} style={{background:CARD,borderRadius:18,padding:16,border:`1px solid ${BORDER}`,cursor:'pointer',display:'flex',gap:14,transition:'transform .15s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{width:64,height:64,borderRadius:14,background:`linear-gradient(135deg,${ACCENT}40,${ROSE}40)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:24,overflow:'hidden'}}>
                  {b.images?.[0]?<img src={b.images[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'✂'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}><h3 style={{fontSize:15,fontWeight:700}}>{b.name}</h3><button onClick={e=>{e.stopPropagation();toggleFav(b.id)}} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="heart" size={18} color={favorites.includes(b.id)?ROSE:'#ddd'}/></button></div>
                  <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:MUTED,margin:'3px 0'}}><Icon name="map" size={12} color={MUTED}/>{b.location||'Lusaka'}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}><Stars rating={Math.round(+branchAvgRating(b.id))} size={12}/><span style={{fontSize:12,fontWeight:600}}>{branchAvgRating(b.id)}</span><span style={{fontSize:11,color:MUTED}}>({branchReviews(b.id).length})</span></div>
                    {services.filter(s=>s.branch_id===b.id||!s.branch_id).length>0&&<span style={{fontSize:11,color:MUTED}}>· from K{Math.min(...services.filter(s=>s.branch_id===b.id||!s.branch_id).map(s=>s.price))}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        :<EmptyState icon="🔍" title="No salons found" sub="Try adjusting your filters"/>)
        :(filteredServices.length?
          <div className="gb-grid-services">
            {filteredServices.map(s=>(
              <div key={s.id} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><CatIcon cat={s.category} size={16}/><span style={{fontSize:15,fontWeight:600}}>{s.name}</span></div><div style={{fontSize:12,color:MUTED}}>{s.category} • {s.duration}{s.duration_max!==s.duration?`–${s.duration_max}`:''} min</div></div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}><div style={{fontSize:16,fontWeight:700,color:ACCENT}}>K{s.price}</div>{s.price_max!==s.price&&<div style={{fontSize:11,color:MUTED}}>–K{s.price_max}</div>}</div>
              </div>
            ))}
          </div>
        :<EmptyState icon="💇" title="No services found" sub="Try adjusting your filters"/>))}
      </div>
    </div>
  );
}

function SalonPage({branch,services,reviews,staff,branchAvgRating,navigate,goBack,favorites,toggleFav,client,bp}) {
  const [tab,setTab]=useState('services');
  if(!branch) return null;
  const avg=branchAvgRating(branch.id);
  const grouped={};
  services.forEach(s=>{if(!grouped[s.category])grouped[s.category]=[];grouped[s.category].push(s)});
  const pad=bp==='desktop'?'32px':'20px';

  return (
    <div className="fade-up">
      <div style={{height:bp==='desktop'?200:180,background:`linear-gradient(135deg,${ACCENT},${ROSE})`,position:'relative',display:'flex',alignItems:'flex-end',borderRadius:bp==='desktop'?0:'0 0 24px 24px'}}>
        {bp!=='desktop'&&<div style={{position:'absolute',top:12,left:12,right:12,display:'flex',justifyContent:'space-between'}}>
          <button onClick={goBack} className="touch-target" style={{width:40,height:40,borderRadius:20,background:'rgba(255,255,255,.2)',backdropFilter:'blur(8px)',border:'none',cursor:'pointer'}}><Icon name="back" size={20} color="#fff"/></button>
          <button onClick={()=>toggleFav(branch.id)} className="touch-target" style={{width:40,height:40,borderRadius:20,background:'rgba(255,255,255,.2)',backdropFilter:'blur(8px)',border:'none',cursor:'pointer'}}><Icon name="heart" size={20} color={favorites.includes(branch.id)?'#fff':'rgba(255,255,255,.6)'}/></button>
        </div>}
        <div style={{padding:`0 ${pad} 20px`,width:'100%'}}>
          <h1 style={{fontFamily:'Fraunces,serif',fontSize:bp==='desktop'?28:24,fontWeight:700,color:'#fff',marginBottom:4}}>{branch.name}</h1>
          <div style={{display:'flex',alignItems:'center',gap:12,color:'rgba(255,255,255,.85)',fontSize:13,flexWrap:'wrap'}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}><Icon name="map" size={14} color="rgba(255,255,255,.85)"/>{branch.location||'Lusaka'}</span>
            <span style={{display:'flex',alignItems:'center',gap:4}}><Icon name="star" size={14} color={GOLD}/>{avg} ({reviews.length})</span>
          </div>
        </div>
      </div>
      <div style={{padding:`16px ${pad}`}}>
        <div className="gb-grid-stats">{[[services.length,'Services',ACCENT],[staff.length,'Stylists',GOLD],[avg,'Rating',ROSE]].map(([v,l,c])=><div key={l} style={{background:CARD,borderRadius:14,padding:12,border:`1px solid ${BORDER}`,textAlign:'center'}}><div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:11,color:MUTED}}>{l}</div></div>)}</div>
      </div>
      <div style={{padding:`0 ${pad}`,display:'flex',gap:4,marginBottom:16,borderBottom:`1px solid ${BORDER}`,maxWidth:400}}>
        {['services','team','reviews'].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'12px 0',background:'none',border:'none',borderBottom:tab===t?`2px solid ${ACCENT}`:'2px solid transparent',color:tab===t?ACCENT:MUTED,fontSize:14,fontWeight:600,cursor:'pointer',textTransform:'capitalize',minHeight:44}}>{t}</button>)}
      </div>
      <div style={{padding:`0 ${pad} 100px`}}>
        {tab==='services'&&Object.entries(grouped).map(([cat,svcs])=>(
          <div key={cat} style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}><CatIcon cat={cat} size={16}/><h3 style={{fontSize:16,fontWeight:700}}>{cat}</h3></div>
            <div className="gb-grid-services">{svcs.map(s=>(
              <div key={s.id} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:600}}>{s.name}</div><div style={{fontSize:12,color:MUTED,marginTop:2}}>{s.duration}{s.duration_max!==s.duration?`–${s.duration_max}`:''} min{s.deposit?` • K${s.deposit} dep`:''}</div></div>
                <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                  <div style={{textAlign:'right'}}><div style={{fontSize:16,fontWeight:700,color:ACCENT}}>K{s.price}</div>{s.price_max!==s.price&&<div style={{fontSize:11,color:MUTED}}>–K{s.price_max}</div>}</div>
                  <Btn small variant="primary" onClick={()=>navigate('booking',{bookingFlow:{step:1,branch,service:s,staff:null,date:null,time:null}})}>Book</Btn>
                </div>
              </div>
            ))}</div>
          </div>
        ))}
        {tab==='team'&&(staff.length?
          <div className="gb-grid-services">{staff.map(s=>(
            <div key={s.id} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`,display:'flex',gap:14,alignItems:'center'}}>
              <div style={{width:48,height:48,borderRadius:24,background:`linear-gradient(135deg,${GOLD}30,${ACCENT}30)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:ACCENT,flexShrink:0}}>{s.name?.[0]}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:600}}>{s.name}</div><div style={{fontSize:13,color:MUTED}}>{s.role||'Stylist'}</div></div>
              {s.rating&&<div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}><Icon name="star" size={14} color={GOLD}/><span style={{fontSize:13,fontWeight:600}}>{s.rating}</span></div>}
            </div>
          ))}</div>
        :<EmptyState icon="👤" title="No team members" sub="Check back later"/>)}
        {tab==='reviews'&&(reviews.length?
          <>
            <div style={{background:CARD,borderRadius:16,padding:20,marginBottom:16,border:`1px solid ${BORDER}`,textAlign:'center',maxWidth:280}}>
              <div style={{fontSize:36,fontWeight:700,fontFamily:'Fraunces,serif',color:DARK}}>{avg}</div>
              <Stars rating={Math.round(+avg)} size={18}/><div style={{fontSize:13,color:MUTED,marginTop:4}}>{reviews.length} reviews</div>
            </div>
            <div style={{display:'grid',gap:10,gridTemplateColumns:bp==='desktop'?'repeat(2,1fr)':'1fr'}}>
              {reviews.map(r=>(
                <div key={r.id} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><Stars rating={r.rating_overall} size={14}/><span style={{fontSize:11,color:MUTED}}>{r.created_at?.slice(0,10)}</span></div>
                  <p style={{fontSize:14,lineHeight:1.6,color:DARK}}>{r.review_text}</p>
                  {r.response_text&&<div style={{marginTop:10,padding:10,background:`${ACCENT}06`,borderRadius:10,borderLeft:`3px solid ${ACCENT}`}}><span style={{fontSize:11,fontWeight:600,color:ACCENT}}>Response:</span><p style={{fontSize:13,color:MUTED,marginTop:4}}>{r.response_text}</p></div>}
                </div>
              ))}
            </div>
          </>
        :<EmptyState icon="⭐" title="No reviews yet" sub="Be the first!"/>)}
      </div>
      <div style={{position:'fixed',bottom:0,left:bp==='desktop'?SIDEBAR_W:0,right:0,padding:'12px 20px',background:'rgba(250,247,245,.92)',backdropFilter:'blur(16px)',borderTop:`1px solid ${BORDER}`,zIndex:90}}>
        <div style={{maxWidth:480}}><Btn full variant="primary" onClick={()=>navigate('booking',{bookingFlow:{step:0,branch,service:null,staff:null,date:null,time:null}})} style={{borderRadius:14,fontSize:16,boxShadow:`0 4px 20px ${ACCENT}40`}}>Book Appointment ✨</Btn></div>
      </div>
    </div>
  );
}

function BookingFlow({flow,setBookingFlow,staff,services,createBooking,goBack,bp}) {
  if(!flow) return null;
  const update=data=>setBookingFlow(f=>({...f,...data}));
  const step=flow.step||0;
  const pad=bp==='desktop'?'32px':'20px';
  const openH=parseInt(flow.branch?.open_time?.slice(0,2))||8;const openM=parseInt(flow.branch?.open_time?.slice(3,5))||0;
  const closeH=parseInt(flow.branch?.close_time?.slice(0,2))||17;const closeM=parseInt(flow.branch?.close_time?.slice(3,5))||0;
  const interval=flow.branch?.slot_interval||30;
  const timeSlots=[];
  for(let m=openH*60+openM;m<closeH*60+closeM;m+=interval){const h=Math.floor(m/60),mi=m%60;timeSlots.push(`${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`);}
  const [bookedSlots,setBookedSlots]=useState([]);
  const [blockedSlots,setBlockedSlots]=useState([]);

  useEffect(()=>{
    if(!flow.date)return;
    if(flow.staff?.id){
      // Specific staff: show their booked slots
      supabase.from('bookings').select('booking_time').eq('booking_date',flow.date).eq('staff_id',flow.staff.id).neq('status','cancelled')
        .then(({data})=>setBookedSlots((data||[]).map(b=>b.booking_time?.slice(0,5))));
      supabase.from('staff_blocked_times').select('*').eq('staff_id',flow.staff.id).eq('block_date',flow.date).then(({data})=>{
        if(!data?.length){setBlockedSlots([]);return}
        const bl=[];data.forEach(bt=>{if(!bt.start_time)timeSlots.forEach(t=>bl.push(t));else{const s=bt.start_time?.slice(0,5),e=bt.end_time?.slice(0,5);timeSlots.forEach(t=>{if(t>=s&&t<=e)bl.push(t)})}});setBlockedSlots(bl);
      });
    }else{
      // Any Available: slot is full only when ALL staff at this branch are booked
      const branchStaff=staff.filter(s=>s.branch_id===flow.branch?.id&&s.is_active!==false);
      const totalStaff=Math.max(branchStaff.length,1);
      supabase.from('bookings').select('booking_time').eq('booking_date',flow.date).eq('branch_id',flow.branch?.id).neq('status','cancelled')
        .then(({data})=>{
          const counts={};(data||[]).forEach(b=>{const t=b.booking_time?.slice(0,5);counts[t]=(counts[t]||0)+1});
          setBookedSlots(Object.entries(counts).filter(([,c])=>c>=totalStaff).map(([t])=>t));
        });
      setBlockedSlots([]);
    }
  },[flow.date,flow.staff]);

  const dates=[];for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()+i);dates.push(d.toISOString().slice(0,10))}
  const grouped={};services.forEach(s=>{if(!grouped[s.category])grouped[s.category]=[];grouped[s.category].push(s)});
  const steps=[{label:'Service'},{label:'Stylist'},{label:'Date & Time'},{label:'Confirm'}];

  return (
    <div className="fade-up">
      <div style={{padding:`20px ${pad} 16px`,background:CARD,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <button onClick={goBack} className="touch-target" style={{background:'none',border:'none',cursor:'pointer'}}><Icon name="back" size={22} color={DARK}/></button>
          <div><h2 style={{fontSize:18,fontWeight:700}}>Book Appointment</h2><p style={{fontSize:13,color:MUTED}}>{flow.branch?.name}</p></div>
        </div>
        <div style={{display:'flex',gap:4,maxWidth:400}}>{steps.map((s,i)=><div key={i} style={{flex:1}}><div style={{height:3,borderRadius:2,background:i<=step?ACCENT:BORDER}}/><div style={{fontSize:10,color:i<=step?ACCENT:MUTED,marginTop:4,fontWeight:600}}>{s.label}</div></div>)}</div>
      </div>
      <div style={{padding:`20px ${pad} 120px`,maxWidth:800}}>
        {step===0&&(
          <div className="fade-up">
            <h3 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600,marginBottom:16}}>Choose a service</h3>
            {Object.entries(grouped).map(([cat,svcs])=>(
              <div key={cat} style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}><CatIcon cat={cat}/><h4 style={{fontSize:14,fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:.5}}>{cat}</h4></div>
                <div className="gb-grid-services">{svcs.map(s=>(
                  <div key={s.id} onClick={()=>update({service:s,step:1})} style={{background:flow.service?.id===s.id?`${ACCENT}08`:CARD,borderRadius:16,padding:16,border:flow.service?.id===s.id?`2px solid ${ACCENT}`:`1px solid ${BORDER}`,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',minHeight:60}}>
                    <div style={{display:'flex',gap:12,alignItems:'center',flex:1,minWidth:0}}>
                      <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${ACCENT}15,${ROSE}15)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><CatIcon cat={s.category} size={20}/></div>
                      <div><div style={{fontSize:15,fontWeight:600}}>{s.name}</div><div style={{fontSize:12,color:MUTED,marginTop:2}}>{s.duration}{s.duration_max!==s.duration?`–${s.duration_max}`:''} min</div></div>
                    </div>
                    <div style={{fontSize:16,fontWeight:700,color:ACCENT,flexShrink:0}}>K{s.price}</div>
                  </div>
                ))}</div>
              </div>
            ))}
          </div>
        )}
        {step===1&&(()=>{
          const svcCat=flow.service?.category?.toLowerCase();
          const filtered=staff.filter(s=>{if(!s.specialties||!svcCat)return true;const specs=(Array.isArray(s.specialties)?s.specialties:[s.specialties]).map(sp=>sp.toLowerCase());return specs.some(sp=>sp.includes(svcCat)||svcCat.includes(sp))});
          const display=filtered.length>0?filtered:staff;
          return(
            <div className="fade-up">
              <h3 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600,marginBottom:6}}>Choose your stylist</h3>
              <p style={{fontSize:13,color:MUTED,marginBottom:16}}>Or let us pick the best</p>
              <div className="gb-grid-services">
                <div onClick={()=>update({staff:{id:null,name:'Any Available'},step:2})} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`,cursor:'pointer',display:'flex',gap:14,alignItems:'center',minHeight:72}}>
                  <div style={{width:48,height:48,borderRadius:24,background:`linear-gradient(135deg,${GOLD}40,${ACCENT}40)`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="sparkle" size={22} color={ACCENT}/></div>
                  <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>Any Available</div><div style={{fontSize:13,color:MUTED}}>Best match for you</div></div>
                  <Icon name="chevR" size={18} color={MUTED}/>
                </div>
                {display.map(s=>(
                  <div key={s.id} onClick={()=>update({staff:s,step:2})} style={{background:CARD,borderRadius:16,padding:16,border:`1px solid ${BORDER}`,cursor:'pointer',display:'flex',gap:14,alignItems:'center',minHeight:72}}>
                    <div style={{width:48,height:48,borderRadius:24,background:`linear-gradient(135deg,${GOLD}30,${ACCENT}30)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:ACCENT}}>{s.name?.[0]}</div>
                    <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{s.name}</div><div style={{fontSize:13,color:MUTED}}>{s.role||'Stylist'}</div></div>
                    {s.rating&&<div style={{display:'flex',alignItems:'center',gap:3}}><Icon name="star" size={14} color={GOLD}/><span style={{fontSize:13,fontWeight:600}}>{s.rating}</span></div>}
                    <Icon name="chevR" size={18} color={MUTED}/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16}}><Btn variant="ghost" onClick={()=>update({step:0})}>← Back</Btn></div>
            </div>
          );
        })()}
        {step===2&&(
          <div className="fade-up">
            <h3 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600,marginBottom:16}}>Pick a date & time</h3>
            <div style={{marginBottom:20}}>
              <h4 style={{fontSize:14,fontWeight:600,marginBottom:10,color:MUTED}}>DATE</h4>
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
                {dates.map(d=>{const dt=new Date(d+'T00:00:00');const isToday=d===todayStr();const sel=flow.date===d;return(
                  <div key={d} onClick={()=>update({date:d})} style={{flexShrink:0,width:64,padding:'10px 0',borderRadius:14,textAlign:'center',cursor:'pointer',minHeight:72,background:sel?ACCENT:CARD,border:sel?`2px solid ${ACCENT}`:`1px solid ${BORDER}`}}>
                    <div style={{fontSize:11,fontWeight:600,color:sel?'rgba(255,255,255,.7)':MUTED}}>{isToday?'Today':DAYS[dt.getDay()]}</div>
                    <div style={{fontSize:20,fontWeight:700,color:sel?'#fff':DARK,margin:'2px 0'}}>{dt.getDate()}</div>
                    <div style={{fontSize:11,color:sel?'rgba(255,255,255,.7)':MUTED}}>{MONTHS[dt.getMonth()]}</div>
                  </div>
                )})}
              </div>
            </div>
            {flow.date&&(
              <div className="fade-up">
                <h4 style={{fontSize:14,fontWeight:600,marginBottom:10,color:MUTED}}>TIME</h4>
                <div className="gb-time-grid">
                  {timeSlots.map(t=>{const sel=flow.time===t;const unavail=bookedSlots.includes(t)||blockedSlots.includes(t);return(
                    <div key={t} onClick={()=>!unavail&&update({time:t})} style={{padding:'12px 0',borderRadius:12,textAlign:'center',cursor:unavail?'not-allowed':'pointer',fontSize:14,fontWeight:600,minHeight:44,display:'flex',alignItems:'center',justifyContent:'center',background:unavail?'#f5f5f5':sel?ACCENT:CARD,color:unavail?'#bbb':sel?'#fff':DARK,border:sel?`2px solid ${ACCENT}`:`1px solid ${unavail?'#eee':BORDER}`,opacity:unavail?.6:1}}>
                      {fmtTime(t)}
                    </div>
                  )})}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:10,marginTop:20}}><Btn variant="ghost" onClick={()=>update({step:1})}>← Back</Btn><Btn variant="primary" full disabled={!flow.date||!flow.time} onClick={()=>update({step:3})}>Continue</Btn></div>
          </div>
        )}
        {step===3&&(
          <div className="fade-up gb-booking-layout">
            <div>
              <h3 style={{fontFamily:'Fraunces,serif',fontSize:20,fontWeight:600,marginBottom:20}}>Confirm Booking</h3>
              <div style={{background:CARD,borderRadius:20,overflow:'hidden',border:`1px solid ${BORDER}`,marginBottom:20}}>
                <div style={{background:`linear-gradient(135deg,${ACCENT}10,${ROSE}10)`,padding:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><Icon name="scissors" size={18} color={ACCENT}/><span style={{fontSize:11,fontWeight:600,color:ACCENT,textTransform:'uppercase',letterSpacing:1}}>Summary</span></div>
                  <h4 style={{fontSize:18,fontWeight:700,fontFamily:'Fraunces,serif'}}>{flow.service?.name}</h4>
                </div>
                <div style={{padding:20}}>
                  {[{label:'Salon',value:flow.branch?.name,icon:'map'},{label:'Stylist',value:flow.staff?.name||'Any Available',icon:'user'},{label:'Date',value:flow.date?fmtDate(flow.date):'—',icon:'calendar'},{label:'Time',value:flow.time?fmtTime(flow.time):'—',icon:'clock'}].map(item=>(
                    <div key={item.label} style={{display:'flex',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${BORDER}`}}><Icon name={item.icon} size={16} color={MUTED}/><span style={{fontSize:13,color:MUTED,marginLeft:10,width:70}}>{item.label}</span><span style={{fontSize:14,fontWeight:600,flex:1}}>{item.value}</span></div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:16}}>
                    <span style={{fontSize:14,color:MUTED}}>Total</span>
                    <span style={{fontSize:24,fontWeight:700,fontFamily:'Fraunces,serif',color:ACCENT}}>K{flow.service?.price_max||flow.service?.price||0}</span>
                  </div>
                </div>
              </div>
              <div style={{background:CARD,borderRadius:16,border:`1px solid ${BORDER}`,padding:16,marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Special Requests</div>
                <textarea value={flow.clientNotes||''} onChange={e=>update({clientNotes:e.target.value})} placeholder="E.g. shoulder-length braids..." rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1.5px solid ${BORDER}`,fontSize:13,background:BG,color:DARK,resize:'vertical',fontFamily:'inherit',minHeight:80}}/>
              </div>
            </div>
            <div>
              <div style={{background:`linear-gradient(135deg,${GOLD}08,${ACCENT}08)`,borderRadius:16,border:`1px solid ${GOLD}20`,padding:16,marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>⭐</span><div><div style={{fontSize:14,fontWeight:600}}>You'll earn {Math.floor((flow.service?.price_max||flow.service?.price||0)/10)} GlowPoints</div><div style={{fontSize:12,color:MUTED}}>Points awarded when your appointment is completed</div></div></div>
              </div>
              <div style={{background:CARD,borderRadius:16,border:`1px solid ${BORDER}`,padding:16,marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:flow.recurring?12:0}}>
                  <div><div style={{fontSize:14,fontWeight:600}}>Recurring</div><div style={{fontSize:12,color:MUTED}}>Auto-book same time</div></div>
                  <Toggle value={flow.recurring} onChange={()=>update({recurring:!flow.recurring})}/>
                </div>
                {flow.recurring&&(
                  <div>
                    <div style={{display:'flex',gap:8,marginBottom:10}}>
                      {[['weekly','Weekly'],['biweekly','Bi-weekly'],['monthly','Monthly']].map(([val,label])=><button key={val} onClick={()=>update({recurringType:val})} style={{flex:1,padding:'8px 4px',borderRadius:10,border:`1.5px solid ${flow.recurringType===val?ACCENT:BORDER}`,background:flow.recurringType===val?ACCENT+'15':'transparent',color:flow.recurringType===val?ACCENT:MUTED,fontSize:12,fontWeight:600,cursor:'pointer',minHeight:36}}>{label}</button>)}
                    </div>
                    <label style={{fontSize:12,color:MUTED}}>Until: <input type="date" value={flow.recurringUntil||''} onChange={e=>update({recurringUntil:e.target.value})} min={flow.date} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${BORDER}`,fontSize:12,background:BG,color:DARK,marginLeft:6}}/></label>
                  </div>
                )}
              </div>
              <div style={{background:`${GOLD}08`,borderRadius:12,padding:12,marginBottom:16,border:`1px solid ${GOLD}20`}}>
                <div style={{fontSize:12,fontWeight:600,color:GOLD,marginBottom:4}}>Cancellation Policy</div>
                <div style={{fontSize:12,color:MUTED,lineHeight:1.5}}>Free cancellation up to {flow.branch?.cancellation_hours||2}h before. Late cancellations may incur a fee.</div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <Btn variant="secondary" onClick={()=>update({step:2})}>← Back</Btn>
                <Btn variant="primary" full onClick={()=>createBooking(flow)} style={{borderRadius:14,fontSize:16,boxShadow:`0 4px 20px ${ACCENT}40`}}>
                  {flow.recurring?`Book ${flow.recurringType||'Weekly'} ✨`:'Confirm Booking ✨'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MyBookingsPage({upcoming,past,getService,getStaffMember,getBranch,cancelBooking,rescheduleBooking,navigate,bp}) {
  const [tab,setTab]=useState('upcoming');
  const [cancelTarget,setCancelTarget]=useState(null);
  const pad=bp==='desktop'?'32px':'20px';

  const BookingCard = ({bk}) => {
    const svc=getService(bk.service_id);const stf=getStaffMember(bk.staff_id);const br=getBranch(bk.branch_id);
    const st=STATUS_MAP[bk.status]||STATUS_MAP.pending;
    return(
      <div style={{background:CARD,borderRadius:18,overflow:'hidden',border:`1px solid ${BORDER}`}}>
        <div style={{display:'flex',gap:14,padding:16}}>
          <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${ACCENT}20,${ROSE}20)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><CatIcon cat={svc?.category} size={22}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:4,gap:8}}><h4 style={{fontSize:15,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{svc?.name||'Service'}</h4><Badge bg={st.bg} fg={st.fg}>{st.label}</Badge></div>
            <div style={{fontSize:13,color:MUTED,marginBottom:2}}>{br?.name||'Salon'}</div>
            <div style={{display:'flex',alignItems:'center',gap:12,fontSize:12,color:MUTED,flexWrap:'wrap'}}>
              <span style={{display:'flex',alignItems:'center',gap:3}}><Icon name="calendar" size={12} color={MUTED}/>{fmtDate(bk.booking_date)}</span>
              <span style={{display:'flex',alignItems:'center',gap:3}}><Icon name="clock" size={12} color={MUTED}/>{fmtTime(bk.booking_time)}</span>
            </div>
            {stf&&<div style={{fontSize:12,color:MUTED,marginTop:3}}>with {stf.name}</div>}
          </div>
        </div>
        <div style={{borderTop:`1px solid ${BORDER}`,padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <span style={{fontSize:15,fontWeight:700,color:ACCENT}}>K{bk.total_amount}</span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {(bk.status==='confirmed'||bk.status==='pending')&&<><Btn small variant="secondary" onClick={()=>rescheduleBooking(bk)}>Reschedule</Btn><Btn small variant="outline" onClick={()=>setCancelTarget(bk)} style={{color:'#c62828',borderColor:'#c6282840'}}>Cancel</Btn></>}
            {bk.status==='completed'&&<Btn small variant="secondary" onClick={()=>navigate('salon',{branch:getBranch(bk.branch_id)})}>Rebook</Btn>}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div className="fade-up">
      <div style={{padding:`20px ${pad} 0`,background:CARD,borderBottom:`1px solid ${BORDER}`}}>
        <h1 style={{fontFamily:'Fraunces,serif',fontSize:24,fontWeight:700,marginBottom:16}}>My Bookings</h1>
        <div style={{display:'flex',gap:4,maxWidth:300}}>
          {['upcoming','past'].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'12px 0',background:'none',border:'none',borderBottom:tab===t?`2px solid ${ACCENT}`:'2px solid transparent',color:tab===t?ACCENT:MUTED,fontSize:14,fontWeight:600,cursor:'pointer',textTransform:'capitalize',minHeight:44}}>
            {t} {t==='upcoming'&&upcoming.length>0&&<span style={{background:ACCENT,color:'#fff',borderRadius:50,padding:'2px 7px',fontSize:11,marginLeft:4}}>{upcoming.length}</span>}
          </button>)}
        </div>
      </div>
      <div style={{padding:`20px ${pad} 32px`}}>
        <div style={{display:'grid',gap:12,gridTemplateColumns:bp==='desktop'?'repeat(2,1fr)':'1fr'}}>
          {(tab==='upcoming'?upcoming:past).map(b=><BookingCard key={b.id} bk={b}/>)}
        </div>
        {!(tab==='upcoming'?upcoming:past).length&&<EmptyState icon={tab==='upcoming'?'📅':'📋'} title={tab==='upcoming'?'No upcoming bookings':'No past bookings'} sub={tab==='upcoming'?'Book your next glow-up!':'History will show here'}/>}
      </div>
      <BottomSheet open={!!cancelTarget} onClose={()=>setCancelTarget(null)} title="Cancel Booking">
        {cancelTarget&&(()=>{
          const br=getBranch(cancelTarget.branch_id);const cancelHours=br?.cancellation_hours??2;
          const bookingDT=new Date(`${cancelTarget.booking_date}T${cancelTarget.booking_time||'00:00'}`);
          const hoursUntil=Math.max(0,(bookingDT-new Date())/3600000);
          const isLate=hoursUntil<cancelHours&&hoursUntil>0;
          const feePercent=br?.cancellation_fee_percent||0;
          const fee=isLate&&feePercent>0?Math.round((cancelTarget.total_amount||0)*feePercent/100):0;
          return(<>
            <p style={{fontSize:14,color:MUTED,lineHeight:1.6,marginBottom:12}}>Cancel <strong>{getService(cancelTarget.service_id)?.name}</strong> on {fmtDate(cancelTarget.booking_date)} at {fmtTime(cancelTarget.booking_time)}?</p>
            {isLate&&feePercent>0&&<div style={{background:'#fff3e0',borderRadius:12,padding:12,marginBottom:16,border:'1px solid #ffe0b2'}}><div style={{fontSize:13,fontWeight:700,color:'#e65100',marginBottom:4}}>⚠️ Late Cancellation</div><div style={{fontSize:12,color:'#bf360c'}}>Fee: K{fee} ({feePercent}%)</div></div>}
            <div style={{display:'flex',gap:10}}><Btn full variant="secondary" onClick={()=>setCancelTarget(null)}>Keep</Btn><Btn full variant="primary" onClick={()=>{cancelBooking(cancelTarget.id);setCancelTarget(null)}} style={{background:'#c62828'}}>{fee>0?`Cancel (K${fee})`:'Yes, Cancel'}</Btn></div>
          </>);
        })()}
      </BottomSheet>
    </div>
  );
}

function ProfilePage({client,clientBookings,branches,favorites,getBranch,navigate,showToast,authUser,handleLogout,bp}) {
  const totalSpent=clientBookings.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.total_amount||0),0);
  const points=client.glow_points||0;
  const favBranches=branches.filter(b=>favorites.includes(b.id));
  const [editing,setEditing]=useState(false);
  const [editForm,setEditForm]=useState({name:client.name||'',phone:client.phone||'',email:client.email||''});
  const [saving,setSaving]=useState(false);
  const [reviewModal,setReviewModal]=useState(null);
  const [reviewForm,setReviewForm]=useState({rating:5,text:'',service_q:5,cleanliness:5,value:5});
  const [reviewedIds,setReviewedIds]=useState(new Set());
  const pad=bp==='desktop'?'32px':'20px';

  useEffect(()=>{(async()=>{const{data}=await supabase.from('reviews').select('booking_id').eq('client_id',client.id);if(data)setReviewedIds(new Set(data.map(r=>r.booking_id)))})()},[client.id]);
  const pendingReviews=clientBookings.filter(b=>b.status==='completed'&&!reviewedIds.has(b.id));

  const saveProfile=async()=>{
    setSaving(true);
    const{error}=await supabase.from('clients').update({name:editForm.name,phone:editForm.phone,email:editForm.email,updated_at:new Date().toISOString()}).eq('id',client.id);
    setSaving(false);
    if(error){showToast(error.message,'error');return}
    showToast('Profile updated! ✨');setEditing(false);
  };

  const submitReview=async()=>{
    if(!reviewModal)return;
    const{error}=await supabase.from('reviews').insert({client_id:client.id,branch_id:reviewModal.branch_id,service_id:reviewModal.service_id,staff_id:reviewModal.staff_id,booking_id:reviewModal.id,rating_overall:reviewForm.rating,rating_service_quality:reviewForm.service_q,rating_cleanliness:reviewForm.cleanliness,rating_value_for_money:reviewForm.value,rating_average:((reviewForm.rating+reviewForm.service_q+reviewForm.cleanliness+reviewForm.value)/4),review_text:reviewForm.text,is_visible:true,moderation_status:'approved',can_edit_until:new Date(Date.now()+7*86400000).toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
    if(!error){const pts=5+(reviewForm.text?.length>20?5:0);await supabase.from('clients').update({glow_points:(client.glow_points||0)+pts,total_points_earned:(client.total_points_earned||0)+pts}).eq('id',client.id);showToast(`Review submitted! +${pts} pts ⭐`)}
    else showToast(error.message,'error');
    setReviewModal(null);
  };

  const StarRow=({value,onChange,label})=>(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:13,color:MUTED}}>{label}</span><div style={{display:'flex',gap:4}}>{[1,2,3,4,5].map(s=><span key={s} onClick={()=>onChange(s)} style={{fontSize:22,cursor:'pointer',color:s<=value?'#F59E0B':BORDER,minWidth:28,textAlign:'center'}}>{s<=value?'★':'☆'}</span>)}</div></div>);
  const iStyle={width:'100%',padding:'12px 16px',borderRadius:12,border:`1.5px solid ${BORDER}`,fontSize:14,background:BG,color:DARK,marginBottom:10,minHeight:44};

  return(
    <div className="fade-up">
      <div style={{padding:`20px ${pad} 32px`}}>
        <div className="gb-profile-layout">
          <div>
            <div style={{background:`linear-gradient(135deg,${DARK},#2a1f23)`,padding:'28px 20px',borderRadius:20,textAlign:'center',marginBottom:20}}>
              <div style={{width:72,height:72,borderRadius:36,background:`linear-gradient(135deg,${ACCENT},${ROSE})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'#fff',margin:'0 auto 12px',border:'3px solid rgba(255,255,255,.2)'}}>{client.name?.[0]||'G'}</div>
              <h2 style={{fontSize:20,fontWeight:700,color:'#fff',fontFamily:'Fraunces,serif'}}>{client.name||'Guest'}</h2>
              {client.email&&<p style={{fontSize:13,color:'rgba(255,255,255,.6)',marginTop:4}}>{client.email}</p>}
              <button onClick={()=>setEditing(true)} style={{marginTop:10,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',minHeight:32}}>Edit Profile</button>
            </div>
            <div className="gb-grid-stats" style={{marginBottom:20}}>
              {[[clientBookings.length,'Bookings',ACCENT],['K'+totalSpent,'Spent',GOLD],[points,'Points',ROSE]].map(([v,l,c])=>(
                <div key={l} style={{background:CARD,borderRadius:16,padding:14,border:`1px solid ${BORDER}`,textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,fontFamily:'Fraunces,serif',color:c}}>{v}</div><div style={{fontSize:11,color:MUTED}}>{l}</div></div>
              ))}
            </div>
            <div style={{background:`linear-gradient(135deg,${GOLD},${ACCENT})`,borderRadius:18,padding:20,marginBottom:20,color:'#fff',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:40,background:'rgba(255,255,255,.1)'}}/>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><Icon name="gift" size={20} color="#fff"/><span style={{fontSize:14,fontWeight:600}}>GlowPoints</span></div>
              <div style={{fontSize:28,fontWeight:700,fontFamily:'Fraunces,serif'}}>{points}</div>
              <p style={{fontSize:12,opacity:.8,marginTop:4}}>Earn with every booking, redeem for discounts!</p>
            </div>
            {client.referral_code&&(
              <div style={{background:`linear-gradient(135deg,${ROSE}15,${ACCENT}15)`,borderRadius:18,padding:18,marginBottom:20,border:`1px solid ${ROSE}25`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontSize:20}}>🎁</span><span style={{fontSize:15,fontWeight:700}}>Refer a Friend</span></div>
                <p style={{fontSize:13,color:MUTED,lineHeight:1.5,marginBottom:12}}>Share your code — earn 50 pts when they book!</p>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{flex:1,background:CARD,borderRadius:12,padding:'10px 14px',fontFamily:'monospace',fontSize:18,fontWeight:700,color:ACCENT,textAlign:'center',letterSpacing:2,border:`1px solid ${BORDER}`}}>{client.referral_code}</div>
                  <button onClick={()=>{navigator.clipboard?.writeText(client.referral_code);showToast('Copied! 📋')}} style={{padding:'10px 16px',borderRadius:12,background:ACCENT,border:'none',color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',minHeight:44}}>Copy</button>
                </div>
              </div>
            )}
          </div>
          <div>
            {editing&&(
              <div style={{background:CARD,borderRadius:18,padding:20,border:`1px solid ${BORDER}`,marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Edit Profile</h3>
                <input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} placeholder="Full name" style={iStyle}/>
                <input value={editForm.phone} onChange={e=>setEditForm(p=>({...p,phone:e.target.value}))} placeholder="Phone" style={iStyle}/>
                <input value={editForm.email} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} placeholder="Email" type="email" style={iStyle}/>
                <div style={{display:'flex',gap:10}}><Btn full variant="secondary" onClick={()=>setEditing(false)}>Cancel</Btn><Btn full variant="primary" disabled={saving} onClick={saveProfile}>{saving?'Saving...':'Save'}</Btn></div>
              </div>
            )}
            {pendingReviews.length>0&&(
              <div style={{marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>Leave a Review ⭐</h3>
                {pendingReviews.slice(0,3).map(b=>{const br=getBranch(b.branch_id);return(
                  <div key={b.id} onClick={()=>{setReviewModal(b);setReviewForm({rating:5,text:'',service_q:5,cleanliness:5,value:5})}} style={{background:CARD,borderRadius:14,padding:14,marginBottom:8,border:`1px solid ${BORDER}`,cursor:'pointer',display:'flex',gap:12,alignItems:'center',minHeight:60}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${GOLD}30,${ACCENT}30)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⭐</div>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{br?.name||'Salon'}</div><div style={{fontSize:12,color:MUTED}}>{b.booking_date} · Tap to review</div></div>
                    <Icon name="chevR" size={16} color={MUTED}/>
                  </div>
                )})}
              </div>
            )}
            {favBranches.length>0&&(
              <div style={{marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>Favorites ❤️</h3>
                {favBranches.map(b=>(
                  <div key={b.id} onClick={()=>navigate('salon',{branch:b})} style={{background:CARD,borderRadius:14,padding:14,marginBottom:8,border:`1px solid ${BORDER}`,cursor:'pointer',display:'flex',gap:12,alignItems:'center',minHeight:60}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${ACCENT}30,${ROSE}30)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✂</div>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{b.name}</div><div style={{fontSize:12,color:MUTED}}>{b.location||'Lusaka'}</div></div>
                    <Icon name="chevR" size={16} color={MUTED}/>
                  </div>
                ))}
              </div>
            )}
            {bp!=='desktop'&&<Btn full variant="secondary" onClick={handleLogout} style={{borderRadius:14,marginBottom:20,color:'#c62828'}}>Sign Out</Btn>}
          </div>
        </div>
      </div>
      {reviewModal&&(
        <BottomSheet open={true} onClose={()=>setReviewModal(null)} title="Write a Review">
          <StarRow label="Overall" value={reviewForm.rating} onChange={v=>setReviewForm(p=>({...p,rating:v}))}/>
          <StarRow label="Service Quality" value={reviewForm.service_q} onChange={v=>setReviewForm(p=>({...p,service_q:v}))}/>
          <StarRow label="Cleanliness" value={reviewForm.cleanliness} onChange={v=>setReviewForm(p=>({...p,cleanliness:v}))}/>
          <StarRow label="Value for Money" value={reviewForm.value} onChange={v=>setReviewForm(p=>({...p,value:v}))}/>
          <textarea value={reviewForm.text} onChange={e=>setReviewForm(p=>({...p,text:e.target.value}))} placeholder="Tell us about your experience..." rows={4} style={{width:'100%',padding:'12px 14px',borderRadius:12,border:`1.5px solid ${BORDER}`,fontSize:14,background:BG,color:DARK,marginTop:12,marginBottom:6,resize:'vertical',minHeight:100}}/>
          <p style={{fontSize:11,color:MUTED,marginBottom:14}}>Earn 5 pts (+5 bonus for detailed reviews)</p>
          <Btn full variant="primary" onClick={submitReview}>Submit Review ⭐</Btn>
        </BottomSheet>
      )}
    </div>
  );
}

export default function GlowBookClient() {
  const bp = useBreakpoint();
  const [authUser,setAuthUser] = useState(null);
  const [authChecked,setAuthChecked] = useState(false);
  const [page,setPage] = useState('home');
  const [branches,setBranches] = useState([]);
  const [services,setServices] = useState([]);
  const [staff,setStaff] = useState([]);
  const [clients,setClients] = useState([]);
  const [reviews,setReviews] = useState([]);
  const [bookings,setBookings] = useState([]);
  const [loading,setLoading] = useState(true);
  const [toast,setToast] = useState(null);
  const [selectedBranch,setSelectedBranch] = useState(null);
  const [bookingFlow,setBookingFlow] = useState(null);
  const [searchQuery,setSearchQuery] = useState('');
  const [selectedCategory,setSelectedCategory] = useState('All');
  const [filters,setFilters] = useState({minRating:0,priceMin:0,priceMax:9999,location:'All',sortBy:'rating'});
  const [showFilterPanel,setShowFilterPanel] = useState(false);
  const [client,setClient] = useState({id:null,name:'Guest',phone:'',email:''});
  const [navHistory,setNavHistory] = useState([]);
  const [favorites,setFavorites] = useState([]);
  const [notifications,setNotifications] = useState([]);
  const [showNotifs,setShowNotifs] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {setAuthUser(session?.user||null);setAuthChecked(true)});
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => {setAuthUser(session?.user||null)});
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);setClient({id:null,name:'Guest',phone:'',email:''});setPage('home');
  };

  const fetchAll = async (user) => {
    setLoading(true);
    try {
      const [b,sv,st,cl,rv,bk] = await Promise.all([
        supabase.from('branches').select('*').eq('is_active',true),
        supabase.from('services').select('*').eq('is_active',true).order('category, name'),
        supabase.from('staff').select('*').eq('is_active',true).order('name'),
        supabase.from('clients').select('*'),
        supabase.from('reviews').select('*').order('created_at',{ascending:false}),
        supabase.from('bookings').select('*').order('booking_date',{ascending:false}),
      ]);
      setBranches(b.data||[]);setServices(sv.data||[]);setStaff(st.data||[]);setClients(cl.data||[]);setReviews(rv.data||[]);setBookings(bk.data||[]);
      if(user){
        const linked=(cl.data||[]).find(c=>c.auth_user_id===user.id);
        if(linked) setClient(linked);
        else{
          const byEmail=(cl.data||[]).find(c=>c.email===user.email);
          if(byEmail){await supabase.from('clients').update({auth_user_id:user.id}).eq('id',byEmail.id);setClient({...byEmail,auth_user_id:user.id})}
          else setClient({id:null,name:user.user_metadata?.name||user.email,email:user.email,phone:''});
        }
      } else if(cl.data?.length) setClient(cl.data[0]);
    } catch(e){console.error(e)}
    setLoading(false);
  };

  useEffect(() => {if(authChecked&&authUser) fetchAll(authUser)}, [authChecked,authUser]);

  const showToastFn = (msg,type='success') => {setToast({msg,type});setTimeout(()=>setToast(null),2500)};
  const pushNotif = (title,body,type='info') => {setNotifications(prev=>[{id:Date.now(),title,body,type,time:new Date(),read:false},...prev].slice(0,50))};
  const unreadCount = notifications.filter(n=>!n.read).length;
  const markAllRead = () => setNotifications(prev=>prev.map(n=>({...n,read:true})));

  useEffect(() => {
    if(!client?.id) return;
    const channel = supabase.channel('client-realtime')
      .on('postgres_changes',{event:'*',schema:'public',table:'bookings',filter:`client_id=eq.${client.id}`},payload=>{
        if(payload.eventType==='UPDATE'){
          const b=payload.new;
          if(b.status==='confirmed'){showToastFn('Booking confirmed! ✅');pushNotif('Confirmed',`Appointment on ${b.booking_date} confirmed`,'success')}
          else if(b.status==='cancelled'&&b.cancelled_by==='business'){showToastFn('Booking cancelled by salon','error');pushNotif('Cancelled',`Appointment on ${b.booking_date} was cancelled`,'error')}
          else if(b.status==='completed'){
            const earned=Math.max(1,Math.floor((b.total_amount||0)/10));
            supabase.from('clients').update({glow_points:(client.glow_points||0)+earned,total_points_earned:(client.total_points_earned||0)+earned,total_bookings:(client.total_bookings||0)+1,total_spent:(client.total_spent||0)+(b.total_amount||0),updated_at:new Date().toISOString()}).eq('id',client.id).then(()=>{});
            showToastFn(`+${earned} GlowPoints earned! ⭐`);pushNotif('Complete',`You earned ${earned} GlowPoints! Leave a review for bonus points ⭐`,'success');
          }
        }
        fetchAll();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [client?.id]);

  const getBranch = id => branches.find(b=>b.id===id);
  const getService = id => services.find(s=>s.id===id);
  const getStaffMember = id => staff.find(s=>s.id===id);
  const branchReviews = bid => reviews.filter(r=>r.branch_id===bid);
  const branchStaff = bid => staff.filter(s=>s.branch_id===bid);
  const branchAvgRating = bid => {const rv=branchReviews(bid);return rv.length?(rv.reduce((s,r)=>s+(r.rating_overall||0),0)/rv.length).toFixed(1):'—'};
  const clientBookings = bookings.filter(b=>b.client_id===client?.id);
  const upcomingBookings = clientBookings.filter(b=>b.booking_date>=todayStr()&&!['cancelled','completed','no_show'].includes(b.status));
  const pastBookings = clientBookings.filter(b=>b.status==='completed'||b.status==='no_show'||(b.booking_date<todayStr()&&b.status!=='cancelled'));
  const categories = ['All',...new Set(services.map(s=>s.category).filter(Boolean))];
  const locations = [...new Set(branches.map(b=>b.location).filter(Boolean))].sort();

  const [reminders,setReminders] = useState([]);
  useEffect(() => {
    if(!upcomingBookings.length){setReminders([]);return}
    const now=new Date();
    setReminders(upcomingBookings.filter(b=>{const dt=new Date(`${b.booking_date}T${b.booking_time||'09:00'}`);return(dt-now)/3600000>0&&(dt-now)/3600000<=24}).map(b=>({...b,hoursUntil:Math.round((new Date(`${b.booking_date}T${b.booking_time||'09:00'}`)-new Date())/3600000)})));
  }, [upcomingBookings.length]);

  const navigate = (pg,data) => {setNavHistory(h=>[...h,page]);setPage(pg);if(data?.branch)setSelectedBranch(data.branch);if(data?.bookingFlow)setBookingFlow(data.bookingFlow)};
  const goBack = () => {const prev=navHistory[navHistory.length-1]||'home';setNavHistory(h=>h.slice(0,-1));setPage(prev)};
  const toggleFav = bid => setFavorites(f=>f.includes(bid)?f.filter(x=>x!==bid):[...f,bid]);

  const cancelBooking = async (id) => {
    const bk=bookings.find(b=>b.id===id);
    if(bk){const br=branches.find(b=>b.id===bk.branch_id);const ch=br?.cancellation_hours??2;const dt=new Date(`${bk.booking_date}T${bk.booking_time||'00:00'}`);const hu=(dt-new Date())/3600000;if(hu<ch&&hu>0&&(br?.cancellation_fee_percent||0)>0)showToastFn('Late cancellation fee may apply','error')}
    const{error}=await supabase.from('bookings').update({status:'cancelled',cancelled_at:new Date().toISOString(),cancellation_reason:'Cancelled by client',cancelled_by:'client',updated_at:new Date().toISOString()}).eq('id',id);
    if(!error){showToastFn('Booking cancelled');fetchAll()}else showToastFn('Failed','error');
  };

  const createBooking = async (flow) => {
    // Double-booking guard
    if(flow.staff?.id){
      const{data:ex}=await supabase.from('bookings').select('id').eq('staff_id',flow.staff.id).eq('booking_date',flow.date).eq('booking_time',flow.time).neq('status','cancelled').limit(1);
      if(ex?.length){showToastFn('Slot just booked — pick another','error');return}
    }else{
      // "Any Available" - check if all staff are booked at this slot
      const branchStaff=staff.filter(s=>s.branch_id===flow.branch?.id&&s.is_active!==false);
      const{data:ex}=await supabase.from('bookings').select('id').eq('branch_id',flow.branch.id).eq('booking_date',flow.date).eq('booking_time',flow.time).neq('status','cancelled');
      if((ex?.length||0)>=Math.max(branchStaff.length,1)){showToastFn('All stylists booked at this time — pick another','error');return}
    }
    if(flow.rescheduleId){
      const{error}=await supabase.from('bookings').update({booking_date:flow.date,booking_time:flow.time,staff_id:flow.staff?.id||null,status:'pending',updated_at:new Date().toISOString()}).eq('id',flow.rescheduleId);
      if(!error){showToastFn('Rescheduled! 📅');fetchAll();setBookingFlow(null);setPage('bookings')}else showToastFn('Failed: '+error.message,'error');return;
    }
    const svc=flow.service;
    const baseData={branch_id:flow.branch.id,client_id:client.id,service_id:svc.id,staff_id:flow.staff?.id||null,booking_date:flow.date,booking_time:flow.time,duration:svc.duration_max||svc.duration||60,total_amount:svc.price_max||svc.price||0,client_notes:flow.clientNotes||null,status:'pending',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    if(flow.recurring&&flow.recurringType){
      const rid=crypto.randomUUID();const weeks=flow.recurringType==='weekly'?1:flow.recurringType==='biweekly'?2:4;
      const until=flow.recurringUntil||new Date(new Date(flow.date).getTime()+weeks*4*7*86400000).toISOString().slice(0,10);
      // Check availability for all recurring dates
      const allDates=[];let d=new Date(flow.date);while(d.toISOString().slice(0,10)<=until){allDates.push(d.toISOString().slice(0,10));d=new Date(d.getTime()+weeks*7*86400000)}
      const{data:existing}=await supabase.from('bookings').select('booking_date,booking_time').eq('branch_id',flow.branch.id).eq('booking_time',flow.time).in('booking_date',allDates).neq('status','cancelled');
      const conflictDates=new Set((existing||[]).map(b=>b.booking_date));
      const bks=allDates.filter(dt=>!conflictDates.has(dt)).map(dt=>({...baseData,booking_date:dt,recurring_id:rid,recurring_type:flow.recurringType,recurring_until:until}));
      if(!bks.length){showToastFn('All recurring dates are already booked','error');return}
      const skipped=allDates.length-bks.length;
      const{error}=await supabase.from('bookings').insert(bks);
      if(!error){showToastFn(`${bks.length} bookings created!${skipped?' ('+skipped+' skipped — conflicts)':''} 🎉`);fetchAll();setBookingFlow(null);setPage('bookings')}else showToastFn('Failed: '+error.message,'error');
    }else{
      const{error}=await supabase.from('bookings').insert(baseData);
      if(!error){showToastFn('Booking confirmed! 🎉');fetchAll();setBookingFlow(null);setPage('bookings')}
      else showToastFn('Failed: '+error.message,'error');
    }
  };

  const rescheduleBooking = (bk) => {
    const svc=getService(bk.service_id);const br=getBranch(bk.branch_id);const stf=getStaffMember(bk.staff_id);
    setBookingFlow({step:2,branch:br,service:svc,staff:stf||{id:null,name:'Any Available'},date:null,time:null,rescheduleId:bk.id});
    setPage('booking');
  };

  // Auth gate
  if(!authChecked) return(<div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center'}}><style>{css}</style><div style={{display:'flex',gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:4,background:ACCENT,animation:`pulse 1.2s ease ${i*.2}s infinite`}}/>)}</div></div>);
  if(!authUser) return <AuthScreen onAuth={u=>setAuthUser(u)}/>;
  if(loading) return(<div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}><style>{css}</style><div style={{fontSize:36,fontFamily:'Fraunces,serif',fontWeight:700,color:ACCENT}}>GlowBook</div><div style={{display:'flex',gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:4,background:ACCENT,animation:`pulse 1.2s ease ${i*.2}s infinite`}}/>)}</div></div>);

  const pages = {
    home: <HomePage {...{branches,services,reviews,staff,bookings,branchAvgRating,branchReviews,categories,selectedCategory,setSelectedCategory,searchQuery,setSearchQuery,navigate,favorites,toggleFav,reminders,getService,getBranch,bp,filters,setFilters,showFilterPanel,setShowFilterPanel,locations}}/>,
    explore: <ExplorePage {...{branches,services,reviews,bookings,branchAvgRating,branchReviews,navigate,searchQuery,setSearchQuery,selectedCategory,setSelectedCategory,categories,favorites,toggleFav,bp,filters,setFilters,showFilterPanel,setShowFilterPanel,locations}}/>,
    salon: <SalonPage {...{branch:selectedBranch,services:services.filter(s=>s.branch_id===selectedBranch?.id||!s.branch_id),reviews:branchReviews(selectedBranch?.id),staff:branchStaff(selectedBranch?.id),branchAvgRating,navigate,goBack,favorites,toggleFav,client,bp}}/>,
    booking: <BookingFlow {...{flow:{...bookingFlow,clientId:client?.id},setBookingFlow,staff:branchStaff(bookingFlow?.branch?.id),services:services.filter(s=>s.branch_id===bookingFlow?.branch?.id||!s.branch_id),createBooking,goBack,bp}}/>,
    bookings: <MyBookingsPage {...{upcoming:upcomingBookings,past:pastBookings,getService,getStaffMember,getBranch,cancelBooking,rescheduleBooking,navigate,bp}}/>,
    profile: <ProfilePage {...{client,clientBookings,branches,favorites,getBranch,navigate,showToast:showToastFn,authUser,handleLogout,bp}}/>,
  };

  return(
    <>
      <style>{css}</style>
      <AppShell page={page} setPage={pg=>{setNavHistory([]);setPage(pg)}} client={client} unreadCount={unreadCount} onNotifClick={()=>setShowNotifs(true)} onLogout={handleLogout} bp={bp}>
        {pages[page]||pages.home}
      </AppShell>
      {toast&&<Toast message={toast.msg} type={toast.type}/>}
      <BottomSheet open={showNotifs} onClose={()=>{setShowNotifs(false);markAllRead()}} title="Notifications">
        {notifications.length>0?(
          <div style={{maxHeight:400,overflowY:'auto'}}>
            {notifications.slice(0,20).map(n=>(
              <div key={n.id} style={{padding:'12px 0',borderBottom:`1px solid ${BORDER}`,opacity:n.read?0.6:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:14}}>{n.type==='success'?'✅':n.type==='error'?'❌':'🔔'}</span>
                  <span style={{fontSize:14,fontWeight:600,flex:1}}>{n.title}</span>
                  {!n.read&&<span style={{width:8,height:8,borderRadius:4,background:ACCENT}}/>}
                </div>
                <p style={{fontSize:13,color:MUTED,lineHeight:1.4,marginLeft:26}}>{n.body}</p>
              </div>
            ))}
          </div>
        ):<EmptyState icon="🔔" title="No notifications" sub="You're all caught up!"/>}
      </BottomSheet>
    </>
  );
}
