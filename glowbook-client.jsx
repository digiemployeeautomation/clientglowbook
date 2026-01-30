import React, { useState } from 'react';

// Sample Data
const salonsData = [
  {
    id: 1, name: "Lumiere Beauty Studio", location: "Kabulonga, Lusaka",
    rating: 4.8, reviewCount: 124, loyaltyMultiplier: 2, featured: true,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
    staff: [
      { id: 1, name: "Grace Banda", role: "Senior Stylist", rating: 4.9, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { id: 2, name: "Mercy Phiri", role: "Braiding Expert", rating: 4.8, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" }
    ],
    services: [
      { id: 101, name: "Box Braids", duration: 180, price: 350, deposit: 100, category: "Braids", popular: true, description: "Classic box braids", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200" },
      { id: 102, name: "Knotless Braids", duration: 240, price: 450, deposit: 150, category: "Braids", popular: true, description: "Gentle knotless technique", image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=200" },
      { id: 103, name: "Deep Conditioning", duration: 45, price: 150, deposit: 50, category: "Treatment", description: "Moisture treatment", image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200" }
    ],
    reviews: [{ id: 1, author: "Linda M.", rating: 5, date: "2025-01-15", text: "Amazing service!", service: "Knotless Braids" }],
    availability: { "2025-01-30": ["09:00", "10:00", "14:00", "15:00"], "2025-01-31": ["09:00", "10:00", "13:00"] }
  },
  {
    id: 2, name: "Glow Skincare Spa", location: "Woodlands, Lusaka",
    rating: 4.9, reviewCount: 67, loyaltyMultiplier: 2.5, featured: true,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400",
    coverImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    staff: [{ id: 6, name: "Natasha Zulu", role: "Lead Aesthetician", rating: 4.9, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150" }],
    services: [
      { id: 301, name: "Express Facial", duration: 30, price: 100, deposit: 30, category: "Facials", description: "Quick refresh facial", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200" },
      { id: 302, name: "Full Body Massage", duration: 60, price: 250, deposit: 80, category: "Massage", popular: true, description: "Relaxing massage", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200" }
    ],
    reviews: [{ id: 6, author: "Janet P.", rating: 5, date: "2025-01-18", text: "Most relaxing experience!", service: "Full Body Massage" }],
    availability: { "2025-01-30": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"] }
  }
];

export default function GlowBookClient() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([1]);
  const [bookingDate, setBookingDate] = useState(null);
  const [bookingTime, setBookingTime] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const navigate = (view, salonId = null) => {
    if (salonId) {
      setSelectedSalon(salonsData.find(s => s.id === salonId));
      setSelectedServices([]);
      setBookingDate(null);
      setBookingTime(null);
      setSelectedStaff(null);
    }
    setCurrentView(view);
  };

  const toggleFavorite = (id, e) => {
    e?.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleService = (service) => {
    setSelectedServices(prev => prev.find(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]);
  };

  const categories = ['All', 'Braids', 'Facials', 'Massage', 'Treatment'];
  const filteredSalons = salonsData.filter(salon => {
    const matchesSearch = !searchQuery || salon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || salon.services.some(s => s.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Styles matching original HTML exactly
  const styles = {
    app: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#FFFFFF', position: 'relative', boxShadow: '0 0 60px rgba(0,0,0,0.08)', fontFamily: "'DM Sans', -apple-system, sans-serif" },
    hero: { background: 'linear-gradient(165deg, #1A1A1A 0%, #2D2D2D 100%)', padding: '28px 24px 36px', color: '#FFFFFF', position: 'relative', overflow: 'hidden' },
    heroGlow: { position: 'absolute', top: '-50%', right: '-30%', width: 300, height: 300, background: 'radial-gradient(circle, #B8860B 0%, transparent 70%)', opacity: 0.15 },
    logo: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 },
    logoSpan: { color: '#D4A84B', fontWeight: 500 },
    userAvatar: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #B8860B 0%, #996F0A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, border: '2px solid rgba(255,255,255,0.2)' },
    heroGreeting: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 600, marginBottom: 8, letterSpacing: -0.5, lineHeight: 1.2 },
    searchBox: { background: '#FFFFFF', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' },
    sectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#171717' },
    catChip: { padding: '12px 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.25s ease', border: '2px solid #E8E8E8', background: '#FFFFFF', color: '#525252' },
    catChipActive: { background: '#1A1A1A', borderColor: '#1A1A1A', color: '#FFFFFF' },
    salonCard: { background: '#FFFFFF', borderRadius: 24, overflow: 'hidden', marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #F5F5F5' },
    favoriteBtn: { position: 'absolute', top: 14, right: 14, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    favoriteBtnActive: { background: '#FFE5E5' },
    badge: { padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 },
    badgeOpen: { background: 'rgba(45, 106, 79, 0.9)', color: '#FFFFFF' },
    badgeFeatured: { background: 'rgba(184, 134, 11, 0.95)', color: '#FFFFFF' },
    salonName: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#171717', lineHeight: 1.3 },
    tag: { padding: '6px 14px', background: '#FDF8ED', color: '#996F0A', borderRadius: 8, fontSize: 12, fontWeight: 600 },
    pageHeader: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#FFFFFF', borderBottom: '1px solid #F5F5F5', position: 'sticky', top: 0, zIndex: 50 },
    backBtn: { width: 44, height: 44, borderRadius: 16, border: 'none', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#404040' },
    iconBtn: { width: 44, height: 44, borderRadius: 16, border: 'none', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#525252' },
  };

  return (
    <div style={{ background: '#FFFBF5', minHeight: '100vh' }}>
      <div style={styles.app}>
        
        {/* HOME VIEW */}
        {currentView === 'home' && (
          <div style={{ paddingBottom: 24 }}>
            {/* Hero */}
            <div style={styles.hero}>
              <div style={styles.heroGlow} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <div style={styles.logo}>Glow<span style={styles.logoSpan}>Book</span></div>
                  <div style={styles.userAvatar}>S</div>
                </div>
                <div style={styles.heroGreeting}>Hello, Sarah</div>
                <p style={{ fontSize: 15, opacity: 0.75, marginBottom: 24 }}>Find and book beauty services near you</p>
                <div style={styles.searchBox}>
                  <svg width="20" height="20" fill="none" stroke="#A3A3A3" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input type="text" placeholder="Search salons, services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', fontSize: 15, outline: 'none', background: 'transparent', color: '#171717', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div style={{ padding: '24px 0 16px' }}>
              <div style={{ padding: '0 24px', marginBottom: 16 }}>
                <div style={styles.sectionTitle}>Categories</div>
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '0 24px', overflowX: 'auto' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ ...styles.catChip, ...(selectedCategory === cat ? styles.catChipActive : {}) }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Salons */}
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={styles.sectionTitle}>Popular Salons</div>
                <span style={{ fontSize: 14, color: '#B8860B', fontWeight: 600, cursor: 'pointer' }}>See all</span>
              </div>
              {filteredSalons.map(salon => (
                <div key={salon.id} onClick={() => navigate('salon', salon.id)} style={styles.salonCard}>
                  <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                    <img src={salon.coverImage} alt={salon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#E8E8E8' }} />
                    <button onClick={(e) => toggleFavorite(salon.id, e)} style={{ ...styles.favoriteBtn, ...(favorites.includes(salon.id) ? styles.favoriteBtnActive : {}) }}>
                      <svg width="20" height="20" fill={favorites.includes(salon.id) ? "#9B2226" : "none"} stroke={favorites.includes(salon.id) ? "#9B2226" : "#525252"} strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 8 }}>
                      <span style={{ ...styles.badge, ...styles.badgeOpen }}>Open</span>
                      {salon.featured && <span style={{ ...styles.badge, ...styles.badgeFeatured }}>Featured</span>}
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={styles.salonName}>{salon.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#262626' }}>
                        <svg width="16" height="16" fill="#B8860B" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {salon.rating}
                        <span style={{ color: '#A3A3A3', fontWeight: 500 }}>({salon.reviewCount})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#737373', fontSize: 14, marginBottom: 14 }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {salon.location}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[...new Set(salon.services.map(s => s.category))].slice(0, 3).map(cat => (
                        <span key={cat} style={styles.tag}>{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SALON DETAIL VIEW */}
        {currentView === 'salon' && selectedSalon && (
          <div style={{ paddingBottom: 24 }}>
            {/* Header */}
            <div style={styles.pageHeader}>
              <button onClick={() => navigate('home')} style={styles.backBtn}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, flex: 1 }}>{selectedSalon.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={styles.iconBtn}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </button>
                <button onClick={(e) => toggleFavorite(selectedSalon.id, e)} style={{ ...styles.iconBtn, ...(favorites.includes(selectedSalon.id) ? { background: '#FFE5E5', color: '#9B2226' } : {}) }}>
                  <svg width="20" height="20" fill={favorites.includes(selectedSalon.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
              <img src={selectedSalon.coverImage} alt={selectedSalon.name} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#E8E8E8' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
            </div>

            {/* Salon Profile */}
            <div style={{ padding: '0 24px', marginTop: -60, position: 'relative', zIndex: 10 }}>
              <img src={selectedSalon.image} alt={selectedSalon.name} style={{ width: 100, height: 100, borderRadius: 24, border: '4px solid #FFFFFF', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', objectFit: 'cover', background: '#FDF8ED', marginBottom: 16 }} />
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#171717', letterSpacing: -0.5, lineHeight: 1.2 }}>{selectedSalon.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#737373', fontSize: 15, marginBottom: 16 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {selectedSalon.location}
              </div>
              
              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, padding: '20px 0', borderTop: '1px solid #F5F5F5', borderBottom: '1px solid #F5F5F5', margin: '20px 0' }}>
                <div><div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="16" height="16" fill="#B8860B" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{selectedSalon.rating}</div><div style={{ fontSize: 13, color: '#737373', marginTop: 2 }}>Rating</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 700 }}>{selectedSalon.reviewCount}</div><div style={{ fontSize: 13, color: '#737373', marginTop: 2 }}>Reviews</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 700 }}>{selectedSalon.services.length}</div><div style={{ fontSize: 13, color: '#737373', marginTop: 2 }}>Services</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 700, color: '#B8860B' }}>{selectedSalon.loyaltyMultiplier}x</div><div style={{ fontSize: 13, color: '#737373', marginTop: 2 }}>Points</div></div>
              </div>
            </div>

            {/* Date Selection */}
            <div style={{ padding: '0 24px', marginBottom: 20 }}>
              <div style={{ background: '#F5EFE6', borderRadius: 16, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Select Date</div>
                  <span style={{ fontSize: 12, color: '#B8860B', fontWeight: 600 }}>Real-time availability</span>
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                  {Object.entries(selectedSalon.availability || {}).map(([date, times]) => {
                    const d = new Date(date);
                    const isSelected = bookingDate === date;
                    return (
                      <button key={date} onClick={() => setBookingDate(date)} style={{ flexShrink: 0, padding: '12px 16px', borderRadius: 16, textAlign: 'center', minWidth: 70, cursor: 'pointer', border: 'none', background: isSelected ? '#B8860B' : '#FFFFFF', color: isSelected ? '#FFFFFF' : '#171717' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.7 }}>{d.toLocaleDateString('en', { weekday: 'short' })}</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{d.getDate()}</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{times.length} slots</div>
                      </button>
                    );
                  })}
                </div>
                {bookingDate && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E8E8E8' }}>
                    <div style={{ fontSize: 13, color: '#737373', marginBottom: 10 }}>Available Times</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(selectedSalon.availability[bookingDate] || []).map(time => (
                        <button key={time} onClick={() => setBookingTime(time)} style={{ padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: bookingTime === time ? '#B8860B' : '#FFFFFF', color: bookingTime === time ? '#FFFFFF' : '#404040' }}>{time}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Staff Selection */}
            <div style={{ padding: '20px 0' }}>
              <div style={{ padding: '0 24px', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600 }}>Choose Stylist</div>
              </div>
              <div style={{ display: 'flex', gap: 16, padding: '0 24px', overflowX: 'auto' }}>
                <div onClick={() => setSelectedStaff(null)} style={{ flexShrink: 0, width: 100, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F5F5F5', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${!selectedStaff ? '#B8860B' : '#E8E8E8'}`, boxShadow: !selectedStaff ? '0 0 0 3px #FDF8ED' : 'none' }}>
                    <svg width="28" height="28" fill="none" stroke="#A3A3A3" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#171717' }}>Any Stylist</div>
                </div>
                {selectedSalon.staff.map(staff => (
                  <div key={staff.id} onClick={() => setSelectedStaff(staff)} style={{ flexShrink: 0, width: 100, textAlign: 'center', cursor: 'pointer' }}>
                    <img src={staff.avatar} alt={staff.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: `3px solid ${selectedStaff?.id === staff.id ? '#B8860B' : '#E8E8E8'}`, boxShadow: selectedStaff?.id === staff.id ? '0 0 0 3px #FDF8ED' : 'none' }} />
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#171717', marginBottom: 2 }}>{staff.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 12, color: '#737373' }}>{staff.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, color: '#525252', marginTop: 4 }}>
                      <svg width="12" height="12" fill="#B8860B" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {staff.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div style={{ padding: '0 24px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Services</div>
              {selectedSalon.services.map(service => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <div key={service.id} style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', gap: 16, border: `2px solid ${isSelected ? '#B8860B' : '#F5F5F5'}`, boxShadow: isSelected ? '0 0 0 3px #FDF8ED' : 'none' }}>
                    <img src={service.image} alt={service.name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{service.name}</div>
                        {service.popular && <span style={{ background: '#B8860B', color: '#FFFFFF', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>Popular</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#737373', margin: '0 0 8px', lineHeight: 1.4 }}>{service.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <span style={{ color: '#525252', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {service.duration}min
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>K{service.price}</div>
                        <div style={{ fontSize: 12, color: '#737373' }}>K{service.deposit} deposit</div>
                      </div>
                      <button onClick={() => toggleService(service)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: isSelected ? '#B8860B' : '#F5F5F5', color: isSelected ? '#FFFFFF' : '#525252', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 500 }}>
                        {isSelected ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> : '+'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Cart - Only shows when services are selected */}
            {selectedServices.length > 0 && (
              <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 48px)', maxWidth: 432, zIndex: 100 }}>
                <div style={{ background: '#1A1A1A', borderRadius: 20, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}>
                  <div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16 }}>{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>K{selectedServices.reduce((sum, s) => sum + s.price, 0)} total</div>
                  </div>
                  <button style={{ background: '#B8860B', color: '#FFFFFF', border: 'none', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Book Now</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
