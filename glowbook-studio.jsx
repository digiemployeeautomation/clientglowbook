import React, { useState, useRef } from 'react';

// Styles - Original warm cream/brown color scheme
const styles = {
  colors: {
    primary: '#B8860B',
    primaryDark: '#996F0A',
    primaryLight: '#D4A84B',
    primary50: '#FDF8ED',
    accent: '#1A1A1A',
    success: '#2D6A4F',
    successLight: '#D8F3DC',
    error: '#9B2226',
    errorLight: '#FFE5E5',
    cream: '#FFFBF5',
    creamDark: '#F5EFE6',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#E8E8E8',
    gray300: '#D4D4D4',
    gray400: '#A3A3A3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#171717',
    white: '#FFFFFF',
  }
};

// Sample Business Data
const initialBusiness = {
  id: 1, name: "Lumière Beauty Studio", location: "Kabulonga, Lusaka", phone: "+260971234567", email: "hello@lumiere.zm",
  rating: 4.8, reviewCount: 124,
  image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
  coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
  hours: { mon: { open: '08:00', close: '18:00', isOpen: true }, tue: { open: '08:00', close: '18:00', isOpen: true }, wed: { open: '08:00', close: '18:00', isOpen: true }, thu: { open: '08:00', close: '20:00', isOpen: true }, fri: { open: '08:00', close: '20:00', isOpen: true }, sat: { open: '09:00', close: '17:00', isOpen: true }, sun: { open: '10:00', close: '15:00', isOpen: true } },
  gallery: ["https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400", "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400", "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400"],
  staff: [
    { id: 1, name: "Grace Banda", role: "Senior Stylist", rating: 4.9, reviews: 87, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", color: '#B8860B' },
    { id: 2, name: "Mercy Phiri", role: "Braiding Expert", rating: 4.8, reviews: 64, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", color: '#2D6A4F' }
  ],
  services: [
    { id: 101, name: "Box Braids", duration: 180, price: 350, deposit: 100, category: "Braids", popular: true, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200", bookings: 45 },
    { id: 102, name: "Knotless Braids", duration: 240, price: 450, deposit: 150, category: "Braids", popular: true, image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=200", bookings: 58 },
    { id: 103, name: "Cornrows", duration: 120, price: 200, deposit: 50, category: "Braids", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200", bookings: 32 },
    { id: 104, name: "Deep Conditioning", duration: 45, price: 150, deposit: 50, category: "Treatment", image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200", bookings: 41 }
  ],
  reviews: [
    { id: 1, author: "Linda M.", rating: 5, date: "2025-01-15", text: "Amazing service! Grace did my knotless braids perfectly.", service: "Knotless Braids", reply: null },
    { id: 2, author: "Sarah K.", rating: 4, date: "2025-01-10", text: "Great atmosphere and friendly staff.", service: "Box Braids", reply: "Thank you Sarah!" }
  ],
  bookings: [
    { id: 1001, code: 'GB1001', customer: { name: "Mary Tembo", phone: "0971234567" }, services: [{ name: "Box Braids", price: 350 }], staff: { id: 1, name: "Grace Banda" }, date: "2025-01-30", time: "09:00", status: "confirmed", totalPrice: 350, deposit: 100 },
    { id: 1002, code: 'GB1002', customer: { name: "Angela Mwanza", phone: "0972345678" }, services: [{ name: "Knotless Braids", price: 450 }], staff: { id: 2, name: "Mercy Phiri" }, date: "2025-01-30", time: "14:00", status: "pending", totalPrice: 450, deposit: 150 },
    { id: 1003, code: 'GB1003', customer: { name: "Ruth Zulu", phone: "0973456789" }, services: [{ name: "Deep Conditioning", price: 150 }], staff: null, date: "2025-01-31", time: "10:00", status: "pending", totalPrice: 150, deposit: 50 }
  ],
  analytics: {
    revenue: { current: 15420, previous: 12850, change: 20 },
    bookings: { current: 48, previous: 42, change: 14 },
    newCustomers: { current: 12, previous: 8, change: 50 },
    avgRating: { current: 4.8, previous: 4.7, change: 2 },
    revenueByDay: [
      { day: 'Mon', revenue: 1850 }, { day: 'Tue', revenue: 2100 }, { day: 'Wed', revenue: 1920 },
      { day: 'Thu', revenue: 2450 }, { day: 'Fri', revenue: 2880 }, { day: 'Sat', revenue: 2750 }, { day: 'Sun', revenue: 1470 }
    ],
    revenueByService: [
      { name: 'Knotless Braids', revenue: 5400, percentage: 35 },
      { name: 'Box Braids', revenue: 3850, percentage: 25 },
      { name: 'Cornrows', revenue: 1850, percentage: 12 },
      { name: 'Treatment', revenue: 1235, percentage: 8 }
    ],
    forecast: { nextWeek: 16800, nextMonth: 68500, growth: 15 }
  }
};

export default function GlowBookStudio() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [business, setBusiness] = useState(initialBusiness);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const c = styles.colors;
  const updateBusiness = (updates) => setBusiness(prev => ({ ...prev, ...updates }));

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: c.white, borderRadius: '24px', padding: '48px 40px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 48px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '32px', fontWeight: 700, margin: 0 }}>
            Glow<span style={{ color: c.primary }}>Book</span>
          </h1>
          <span style={{ display: 'inline-block', background: c.accent, color: c.white, fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', marginTop: '8px', letterSpacing: '1px' }}>STUDIO</span>
          <p style={{ color: c.gray500, marginTop: '24px', marginBottom: '32px' }}>Business Dashboard</p>
          
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: c.gray700, marginBottom: '8px' }}>Select Business</label>
            <select style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `1px solid ${c.gray200}`, fontSize: '15px', outline: 'none', background: c.white }}>
              <option>Lumière Beauty Studio</option>
            </select>
          </div>
          
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: c.gray700, marginBottom: '8px' }}>Access Code</label>
            <input type="password" defaultValue="1234" placeholder="Enter access code" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `1px solid ${c.gray200}`, fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            <p style={{ fontSize: '13px', color: c.gray400, marginTop: '8px' }}>Demo: Use code "1234"</p>
          </div>
          
          <button onClick={() => setIsLoggedIn(true)} style={{ width: '100%', padding: '18px', borderRadius: '14px', border: 'none', background: c.primary, color: c.white, fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
            Access Dashboard
          </button>
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'bookings', icon: '📅', label: 'Bookings', badge: business.bookings.filter(b => b.status === 'pending').length },
    { id: 'calendar', icon: '🗓️', label: 'Calendar' },
    { id: 'services', icon: '✂️', label: 'Services' },
    { id: 'staff', icon: '👥', label: 'Staff' },
    { id: 'gallery', icon: '🖼️', label: 'Gallery' },
    { id: 'reviews', icon: '⭐', label: 'Reviews' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: c.gray900 }}>
      {/* Sidebar */}
      <aside style={{ width: sidebarCollapsed ? '80px' : '260px', background: c.accent, color: c.white, display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', flexShrink: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>✨</div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 700 }}>Glow<span style={{ color: c.primaryLight }}>Book</span></div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>Studio</div>
              </div>
            )}
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: 'none', background: currentView === item.id ? 'rgba(184,134,11,0.2)' : 'transparent', color: currentView === item.id ? c.primaryLight : 'rgba(255,255,255,0.7)', cursor: 'pointer', marginBottom: '4px', textAlign: 'left', position: 'relative', fontSize: '15px', fontWeight: currentView === item.id ? 600 : 400 }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.badge > 0 && <span style={{ position: 'absolute', right: '12px', background: c.error, color: c.white, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
            <img src={business.image} style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{business.name}</div>
                <div style={{ fontSize: '12px', color: c.success, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.success }} />Open Now
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ position: 'absolute', right: '-12px', top: '80px', width: '24px', height: '24px', borderRadius: '50%', border: `1px solid ${c.gray200}`, background: c.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', color: c.gray600 }}>
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: c.cream }}>
        {/* Header */}
        <header style={{ background: c.white, borderBottom: `1px solid ${c.gray100}`, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>{currentView}</h1>
            <p style={{ fontSize: '14px', color: c.gray500, margin: 0 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ width: '44px', height: '44px', borderRadius: '14px', border: 'none', background: c.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', fontSize: '18px' }}>
              🔔
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: c.error }} />
            </button>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 700 }}>L</div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {currentView === 'dashboard' && <DashboardView business={business} colors={c} setCurrentView={setCurrentView} />}
          {currentView === 'bookings' && <BookingsView business={business} colors={c} updateBusiness={updateBusiness} />}
          {currentView === 'calendar' && <CalendarView business={business} colors={c} />}
          {currentView === 'services' && <ServicesView business={business} colors={c} updateBusiness={updateBusiness} />}
          {currentView === 'staff' && <StaffView business={business} colors={c} />}
          {currentView === 'gallery' && <GalleryView business={business} colors={c} updateBusiness={updateBusiness} />}
          {currentView === 'reviews' && <ReviewsView business={business} colors={c} />}
          {currentView === 'analytics' && <AnalyticsView business={business} colors={c} />}
          {currentView === 'settings' && <SettingsView business={business} colors={c} updateBusiness={updateBusiness} />}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

// Dashboard View
function DashboardView({ business, colors: c, setCurrentView }) {
  const { analytics, bookings } = business;
  const stats = [
    { label: 'Revenue', value: `K${analytics.revenue.current.toLocaleString()}`, change: analytics.revenue.change, icon: '💰', bg: c.successLight, color: c.success },
    { label: 'Bookings', value: analytics.bookings.current, change: analytics.bookings.change, icon: '📅', bg: '#E0F2FE', color: '#0369A1' },
    { label: 'New Customers', value: analytics.newCustomers.current, change: analytics.newCustomers.change, icon: '👤', bg: '#F3E8FF', color: '#7C3AED' },
    { label: 'Avg Rating', value: analytics.avgRating.current, change: analytics.avgRating.change, icon: '⭐', bg: c.primary50, color: c.primary }
  ];
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const todayBookings = bookings.filter(b => b.date === '2025-01-30');

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: c.white, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{stat.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: stat.change >= 0 ? c.success : c.error }}>
                {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '14px', color: c.gray500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts & Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Revenue Chart */}
        <div style={{ background: c.white, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, margin: 0 }}>Revenue This Week</h3>
            <select style={{ padding: '8px 16px', borderRadius: '10px', border: `1px solid ${c.gray200}`, fontSize: '14px', outline: 'none' }}><option>This Week</option></select>
          </div>
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            {analytics.revenueByDay.map((day, i) => {
              const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue));
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={day.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: c.gray500 }}>K{(day.revenue / 1000).toFixed(1)}k</div>
                  <div style={{ width: '100%', height: `${height}%`, minHeight: '20px', background: i === 4 ? c.primary : c.creamDark, borderRadius: '8px 8px 0 0', transition: 'height 0.3s ease' }} />
                  <div style={{ fontSize: '13px', color: c.gray500, fontWeight: 500 }}>{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forecast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, borderRadius: '20px', padding: '24px', color: c.white }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', opacity: 0.9 }}>🎯 Revenue Forecast</div>
            <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>K{analytics.forecast.nextWeek.toLocaleString()}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Expected next week</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '14px' }}>
              <span>↑</span> {analytics.forecast.growth}% growth projected
            </div>
          </div>

          {/* Pending */}
          <div style={{ background: c.white, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontWeight: 700, margin: 0 }}>Pending Approval</h4>
              <span style={{ background: c.errorLight, color: c.error, fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px' }}>{pendingBookings.length}</span>
            </div>
            {pendingBookings.slice(0, 2).map(booking => (
              <div key={booking.id} style={{ background: c.cream, borderRadius: '14px', padding: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 700, fontSize: '14px' }}>{booking.customer.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{booking.customer.name}</div>
                  <div style={{ fontSize: '13px', color: c.gray500 }}>{booking.services[0].name}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: c.successLight, color: c.success, cursor: 'pointer', fontWeight: 700 }}>✓</button>
                  <button style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: c.errorLight, color: c.error, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={() => setCurrentView('bookings')} style={{ width: '100%', padding: '12px', background: c.cream, border: 'none', borderRadius: '12px', fontSize: '14px', color: c.gray600, cursor: 'pointer', fontWeight: 500, marginTop: '8px' }}>View All</button>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div style={{ background: c.white, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, margin: 0 }}>Today's Schedule</h3>
          <button onClick={() => setCurrentView('calendar')} style={{ color: c.primary, background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>View Calendar →</button>
        </div>
        {todayBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: c.gray500 }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
            <p>No bookings scheduled for today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todayBookings.map(booking => (
              <div key={booking.id} style={{ background: c.cream, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: c.white, padding: '12px 16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{booking.time}</div>
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 700 }}>{booking.customer.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{booking.customer.name}</div>
                  <div style={{ fontSize: '14px', color: c.gray500 }}>{booking.services.map(s => s.name).join(', ')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>K{booking.totalPrice}</div>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: booking.status === 'confirmed' ? c.successLight : c.primary50, color: booking.status === 'confirmed' ? c.success : c.primary }}>{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Bookings View
function BookingsView({ business, colors: c, updateBusiness }) {
  const [filter, setFilter] = useState('all');
  const filteredBookings = business.bookings.filter(b => filter === 'all' || b.status === filter);
  const updateBookingStatus = (id, status) => updateBusiness({ bookings: business.bookings.map(b => b.id === id ? { ...b, status } : b) });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {['all', 'pending', 'confirmed', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: filter === f ? c.primary : c.white, color: filter === f ? c.white : c.gray600, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', boxShadow: filter === f ? 'none' : '0 2px 8px rgba(0,0,0,0.06)' }}>
            {f} <span style={{ marginLeft: '6px', opacity: 0.7 }}>({f === 'all' ? business.bookings.length : business.bookings.filter(b => b.status === f).length})</span>
          </button>
        ))}
      </div>
      
      <div style={{ background: c.white, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: c.cream }}>
              <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: c.gray600 }}>Customer</th>
              <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: c.gray600 }}>Service</th>
              <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: c.gray600 }}>Date & Time</th>
              <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: c.gray600 }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: c.gray600 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: c.gray600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking.id} style={{ borderBottom: `1px solid ${c.gray100}` }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 700, fontSize: '14px' }}>{booking.customer.name.charAt(0)}</div>
                    <div><div style={{ fontWeight: 600 }}>{booking.customer.name}</div><div style={{ fontSize: '13px', color: c.gray500 }}>{booking.code}</div></div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>{booking.services.map(s => s.name).join(', ')}</td>
                <td style={{ padding: '16px 20px' }}><div>{new Date(booking.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</div><div style={{ fontSize: '13px', color: c.gray500 }}>{booking.time}</div></td>
                <td style={{ padding: '16px 20px' }}><div style={{ fontWeight: 700 }}>K{booking.totalPrice}</div><div style={{ fontSize: '13px', color: c.gray500 }}>K{booking.deposit} paid</div></td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: booking.status === 'confirmed' ? c.successLight : booking.status === 'pending' ? c.primary50 : '#E0F2FE', color: booking.status === 'confirmed' ? c.success : booking.status === 'pending' ? c.primary : '#0369A1' }}>{booking.status}</span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {booking.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: c.successLight, color: c.success, cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
                      <button onClick={() => updateBookingStatus(booking.id, 'cancelled')} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: c.errorLight, color: c.error, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => updateBookingStatus(booking.id, 'completed')} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#E0F2FE', color: '#0369A1', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Calendar View
function CalendarView({ business, colors: c }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const getWeekDates = () => {
    const start = new Date('2025-01-26');
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  };
  const weekDates = getWeekDates();
  const getBookingsForSlot = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    return business.bookings.filter(b => b.date === dateStr && parseInt(b.time.split(':')[0]) === hour);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: c.white, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: `1px solid ${c.gray100}` }}>
          <div style={{ padding: '16px', background: c.cream }} />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date('2025-01-30').toDateString();
            return (
              <div key={i} style={{ padding: '16px', textAlign: 'center', background: isToday ? c.primary : c.cream, color: isToday ? c.white : c.gray900 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, opacity: 0.7 }}>{days[date.getDay()]}</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {hours.map(hour => (
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: `1px solid ${c.gray100}` }}>
              <div style={{ padding: '16px', background: c.cream, textAlign: 'center', fontSize: '14px', color: c.gray500 }}>{hour}:00</div>
              {weekDates.map((date, i) => {
                const bookings = getBookingsForSlot(date, hour);
                return (
                  <div key={i} style={{ padding: '4px', minHeight: '60px', borderLeft: `1px solid ${c.gray100}` }}>
                    {bookings.map(booking => {
                      const staff = business.staff.find(s => s.id === booking.staff?.id);
                      return (
                        <div key={booking.id} style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', marginBottom: '4px', background: staff?.color || c.primary, color: c.white, cursor: 'pointer' }}>
                          <div style={{ fontWeight: 700 }}>{booking.customer.name.split(' ')[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {business.staff.map(staff => (
          <div key={staff.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: staff.color }} />
            <span style={{ fontSize: '14px', color: c.gray600 }}>{staff.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Services View
function ServicesView({ business, colors: c, updateBusiness }) {
  const [showModal, setShowModal] = useState(false);
  const deleteService = (id) => { if (confirm('Delete this service?')) updateBusiness({ services: business.services.filter(s => s.id !== id) }); };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0 }}>{business.services.length} Services</h3>
        <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: c.primary, color: c.white, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>+ Add Service</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {business.services.map(service => (
          <div key={service.id} style={{ background: c.white, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'relative', height: '160px' }}>
              <img src={service.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {service.popular && <span style={{ position: 'absolute', top: '12px', left: '12px', background: c.primary, color: c.white, fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '100px' }}>Popular</span>}
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                <button style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => deleteService(service.id)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ fontSize: '12px', color: c.primary, fontWeight: 600, marginBottom: '4px' }}>{service.category}</div>
              <h4 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>{service.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><span style={{ fontSize: '20px', fontWeight: 700 }}>K{service.price}</span><span style={{ fontSize: '14px', color: c.gray500, marginLeft: '8px' }}>{service.duration}min</span></div>
                <div style={{ fontSize: '14px', color: c.gray500 }}>{service.bookings} bookings</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Staff View
function StaffView({ business, colors: c }) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0 }}>{business.staff.length} Team Members</h3>
        <button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: c.primary, color: c.white, fontWeight: 600, cursor: 'pointer' }}>+ Add Staff</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {business.staff.map(staff => (
          <div key={staff.id} style={{ background: c.white, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <img src={staff.avatar} style={{ width: '64px', height: '64px', borderRadius: '20px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: staff.color, border: `3px solid ${c.white}` }} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>{staff.name}</h4>
                <p style={{ fontSize: '14px', color: c.gray500, margin: 0 }}>{staff.role}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{ color: c.primary }}>⭐</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{staff.rating}</span>
                  <span style={{ fontSize: '14px', color: c.gray500 }}>({staff.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: c.cream, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div><div style={{ fontWeight: 700 }}>23</div><div style={{ fontSize: '12px', color: c.gray500 }}>This week</div></div>
              <div><div style={{ fontWeight: 700 }}>K4.2k</div><div style={{ fontSize: '12px', color: c.gray500 }}>Revenue</div></div>
              <div><div style={{ fontWeight: 700, color: c.primary }}>98%</div><div style={{ fontSize: '12px', color: c.gray500 }}>On-time</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gallery View
function GalleryView({ business, colors: c, updateBusiness }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => updateBusiness({ gallery: [...business.gallery, e.target.result] });
      reader.readAsDataURL(file);
    });
  };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
  const deleteImage = (index) => { if (confirm('Delete this image?')) updateBusiness({ gallery: business.gallery.filter((_, i) => i !== index) }); };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ background: c.white, border: `2px dashed ${isDragging ? c.primary : c.gray300}`, borderRadius: '20px', padding: '48px', textAlign: 'center', marginBottom: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📤</div>
        <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Drop photos or videos here</h4>
        <p style={{ color: c.gray500, marginBottom: '16px' }}>or click to browse</p>
        <button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: c.primary, color: c.white, fontWeight: 600 }}>Browse Files</button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {business.gallery.map((img, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden' }}>
            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
              <button style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.2)', color: c.white, cursor: 'pointer' }}>👁️</button>
              <button onClick={() => deleteImage(i)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.2)', color: c.white, cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reviews View
function ReviewsView({ business, colors: c }) {
  const avgRating = (business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length).toFixed(1);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: c.white, borderRadius: '20px', padding: '24px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: '48px', fontWeight: 700 }}>{avgRating}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(avgRating) ? c.primary : c.gray300, fontSize: '20px' }}>⭐</span>)}
        </div>
        <div style={{ color: c.gray500 }}>{business.reviewCount} reviews</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {business.reviews.map(review => (
          <div key={review.id} style={{ background: c.white, borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.white, fontWeight: 700, fontSize: '18px' }}>{review.author.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{review.author}</div>
                  <div style={{ fontSize: '14px', color: c.gray500 }}>{new Date(review.date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= review.rating ? c.primary : c.gray300 }}>⭐</span>)}
              </div>
            </div>
            <p style={{ fontSize: '15px', color: c.gray600, lineHeight: 1.6, marginBottom: '12px' }}>{review.text}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: c.cream, padding: '6px 14px', borderRadius: '100px', fontSize: '13px', color: c.gray600 }}>{review.service}</span>
              {review.reply ? (
                <div style={{ background: c.cream, borderRadius: '14px', padding: '14px', maxWidth: '60%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Your reply:</div>
                  <p style={{ fontSize: '14px', color: c.gray600, margin: 0 }}>{review.reply}</p>
                </div>
              ) : (
                <button style={{ color: c.primary, background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>💬 Reply</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Analytics View
function AnalyticsView({ business, colors: c }) {
  const { analytics } = business;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: c.white, borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Revenue by Service</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {analytics.revenueByService.map(item => (
            <div key={item.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontWeight: 700 }}>K{item.revenue.toLocaleString()}</span>
              </div>
              <div style={{ height: '10px', background: c.cream, borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: c.primary, borderRadius: '10px', width: `${item.percentage}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`, borderRadius: '20px', padding: '24px', color: c.white }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>🎯 Next Week Forecast</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>K{analytics.forecast.nextWeek.toLocaleString()}</div>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${c.success} 0%, #1B4332 100%)`, borderRadius: '20px', padding: '24px', color: c.white }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>📈 Monthly Projection</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>K{analytics.forecast.nextMonth.toLocaleString()}</div>
        </div>
        <div style={{ background: `linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)`, borderRadius: '20px', padding: '24px', color: c.white }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>⚡ Growth Rate</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>+{analytics.forecast.growth}%</div>
        </div>
      </div>
    </div>
  );
}

// Settings View
function SettingsView({ business, colors: c, updateBusiness }) {
  const dayNames = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Business Profile */}
      <div style={{ background: c.white, borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Business Profile</h3>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <img src={business.image} style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover' }} />
            <button style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: c.primary, color: c.white, cursor: 'pointer' }}>📷</button>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Business Name</label>
              <input value={business.name} onChange={(e) => updateBusiness({ name: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${c.gray200}`, fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Phone</label>
                <input value={business.phone} onChange={(e) => updateBusiness({ phone: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${c.gray200}`, fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                <input value={business.email} onChange={(e) => updateBusiness({ email: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${c.gray200}`, fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div style={{ background: c.white, borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Business Hours</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
            const hours = business.hours[day];
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', background: c.cream, borderRadius: '14px' }}>
                <button onClick={() => updateBusiness({ hours: { ...business.hours, [day]: { ...hours, isOpen: !hours?.isOpen } } })}
                  style={{ width: '48px', height: '28px', borderRadius: '14px', border: 'none', background: hours?.isOpen ? c.success : c.gray300, cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '3px', left: hours?.isOpen ? '23px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: c.white, transition: 'left 0.2s ease' }} />
                </button>
                <span style={{ width: '100px', fontWeight: 500 }}>{dayNames[day]}</span>
                {hours?.isOpen ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input type="time" value={hours.open} onChange={(e) => updateBusiness({ hours: { ...business.hours, [day]: { ...hours, open: e.target.value } } })} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${c.gray200}`, outline: 'none' }} />
                    <span style={{ color: c.gray500 }}>to</span>
                    <input type="time" value={hours.close} onChange={(e) => updateBusiness({ hours: { ...business.hours, [day]: { ...hours, close: e.target.value } } })} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${c.gray200}`, outline: 'none' }} />
                  </div>
                ) : (
                  <span style={{ color: c.gray500 }}>Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button style={{ width: '100%', padding: '18px', borderRadius: '14px', border: 'none', background: c.primary, color: c.white, fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>Save All Changes</button>
    </div>
  );
}
