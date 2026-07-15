import React, { useState, useEffect, useCallback } from 'react';
import TableAvailabilityGrid from '../components/TableAvailabilityGrid';
import { useAuth } from '../context/authContext';
import { API_BASE_URL } from '../utils/api';

const API_URL = API_BASE_URL;

/* Time slots 10:00 – 22:00 */
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const start = i + 10;
  return `${String(start).padStart(2, '0')}:00-${String(start + 1).padStart(2, '0')}:00`;
});

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const today = () => new Date().toISOString().split('T')[0];

/* ---- tiny helpers ---- */
const Input = ({ label, icon, ...props }) => (
  <div style={s.fieldWrap}>
    <label style={s.label}>{icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}</label>
    <input style={s.input} {...props} />
  </div>
);

const statusBadgeStyle = {
  confirmed: { background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' },
  pending:   { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' },
  cancelled: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
  completed: { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }
};

/* ================================================== */
export default function ReservationPage() {
  const { user, token } = useAuth();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my'

  /* step 1 */
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [seats, setSeats] = useState(2);
  const [availability, setAvailability] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availErr, setAvailErr] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  /* step 2 */
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookErr, setBookErr] = useState('');

  // Keep email in sync with logged-in user
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  /* step 3 */
  const [reservation, setReservation] = useState(null);

  /* ── My Reservations tab ── */
  const [myReservations, setMyReservations] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState({}); // { [confirmationCode]: 'msg' | 'err' }

  const fetchMyReservations = useCallback(async () => {
    if (!token) return;
    setMyLoading(true);
    setMyError('');
    try {
      const res = await fetch(`${API_URL}/api/reservations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMyReservations(data.data.reservations);
    } catch (err) {
      setMyError(err.message || 'Failed to load your reservations.');
    } finally {
      setMyLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'my') fetchMyReservations();
  }, [activeTab, fetchMyReservations]);

  const handleCancelMy = async (confirmationCode) => {
    setCancellingId(confirmationCode);
    setCancelFeedback(prev => ({ ...prev, [confirmationCode]: null }));
    try {
      const res = await fetch(`${API_URL}/api/reservations/cancel-my`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ confirmationCode })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setCancelFeedback(prev => ({ ...prev, [confirmationCode]: { type: 'ok', msg: '✅ Cancelled successfully.' } }));
      // Update local state immediately
      setMyReservations(prev =>
        prev.map(r => r.confirmationCode === confirmationCode ? { ...r, status: 'cancelled' } : r)
      );
    } catch (err) {
      setCancelFeedback(prev => ({ ...prev, [confirmationCode]: { type: 'err', msg: err.message || 'Cancellation failed.' } }));
    } finally {
      setCancellingId(null);
    }
  };

  /* ---------- step 1 → 2 ---------- */
  const handleCheckAvailability = async () => {
    setAvailErr('');
    if (!date || !timeSlot) { setAvailErr('Please select a date and time slot.'); return; }
    setCheckingAvail(true);
    try {
      const res = await fetch(
        `${API_URL}/api/reservations/availability?date=${date}&timeSlot=${encodeURIComponent(timeSlot)}&seats=${seats}`
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAvailability(data.availableCount);
      if (data.availableCount === 0) {
        setAvailErr('No tables available for the selected slot. Try a different time or date.');
        setAvailableTables([]); setSelectedTableId(''); return;
      }
      setAvailableTables(data.tables || []);
    } catch (err) {
      setAvailErr(err.message || 'Failed to check availability. Please try again.');
    } finally {
      setCheckingAvail(false);
    }
  };

  /* ---------- step 2 → 3 ---------- */
  const handleBook = async () => {
    setBookErr('');
    if (!name || !email || !phone) { setBookErr('All fields are required.'); return; }
    // Email must match logged-in user
    if (user && email.toLowerCase() !== user.email.toLowerCase()) {
      setBookErr('Email must match your registered account email: ' + user.email);
      return;
    }
    setBooking(true);
    try {
      const res = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, customerEmail: email, customerPhone: phone, date, timeSlot, numberOfSeats: seats, tableId: selectedTableId, sessionId })
      });
      const data = await res.json();
      if (!res.ok && res.status === 409) {
        throw new Error('Table just got booked by someone else. Please go back and recheck availability.');
      }
      if (!data.success) throw new Error(data.message);
      setReservation(data.data.reservation);
      setStep(3);
    } catch (err) {
      setBookErr(err.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  /* ---------- .ics generator ---------- */
  const downloadICS = () => {
    if (!reservation) return;
    const [startH] = reservation.timeSlot.split('-')[0].split(':').map(Number);
    const endH = startH + 1;
    const d = new Date(reservation.date);
    const fmt = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}${fmt(d.getMonth() + 1)}${fmt(d.getDate())}`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//KEC Food Court//Reservation//EN', 'BEGIN:VEVENT',
      `DTSTART:${dateStr}T${fmt(startH)}0000`,
      `DTEND:${dateStr}T${fmt(endH)}0000`,
      `SUMMARY:KEC Food Court — Table ${reservation.tableNumber}`,
      `DESCRIPTION:Confirmation: ${reservation.confirmationCode}\\nSeats: ${reservation.numberOfSeats}\\nLocation: ${reservation.location}`,
      'LOCATION:KEC Food Court\\, Kongu Engineering College',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kec-reservation-${reservation.confirmationCode}.ics`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ===================== RENDER ===================== */
  return (
    <div style={s.page}>
      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <span style={s.heroPill}>🍽️ KEC Food Court</span>
          <h1 style={s.heroTitle}>Table Reservations</h1>
          <p style={s.heroSub}>Book your spot in advance — skip the wait, enjoy the meal.</p>
        </div>
      </div>

      <div style={s.container}>
        {/* ── Tab Bar ── */}
        <div style={s.tabBar}>
          <button
            style={s.tab(activeTab === 'book')}
            onClick={() => setActiveTab('book')}
          >
            📅 Book a Table
          </button>
          {user && (
            <button
              style={s.tab(activeTab === 'my')}
              onClick={() => setActiveTab('my')}
            >
              🗂️ My Reservations
            </button>
          )}
        </div>

        {/* ══════════ BOOK TAB ══════════ */}
        {activeTab === 'book' && (
          <>
            {/* Step indicator */}
            {step < 3 && (
              <div style={s.steps}>
                {['Select Slot', 'Your Details', 'Confirmed'].map((label, i) => {
                  const idx = i + 1;
                  const active = idx === step;
                  const done = idx < step;
                  return (
                    <React.Fragment key={idx}>
                      <div style={s.stepItem}>
                        <div style={s.stepCircle(active, done)}>{done ? '✓' : idx}</div>
                        <span style={s.stepLabel(active, done)}>{label}</span>
                      </div>
                      {i < 2 && <div style={s.stepLine(done)} />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div style={s.card}>
                <h2 style={s.cardTitle}>🗓️ Pick a Slot</h2>
                <div style={s.row2}>
                  <Input label="Date" icon="📅" type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} />
                  <div style={s.fieldWrap}>
                    <label style={s.label}>⏰ Time Slot</label>
                    <select style={s.input} value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                      <option value="">-- Select a slot --</option>
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={s.fieldWrap}>
                  <label style={s.label}>👥 Number of Seats</label>
                  <div style={s.seatGrid}>
                    {SEAT_OPTIONS.map((n) => (
                      <button key={n} onClick={() => setSeats(n)} style={s.seatBtn(seats === n)}>{n}</button>
                    ))}
                  </div>
                </div>
                {availErr && <div style={s.errorBox}>{availErr}</div>}
                {availability !== null && availability > 0 && availableTables.length > 0 && (
                  <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <div style={s.successBox}>🎉 {availability} table{availability > 1 ? 's' : ''} available! Select one below.</div>
                    <label style={s.label}>🪑 Select a Table</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
                      {availableTables.map(t => (
                        <button key={t._id} onClick={() => setSelectedTableId(t._id)} style={{
                          padding: 12, borderRadius: 10,
                          border: selectedTableId === t._id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          background: selectedTableId === t._id ? '#eff6ff' : '#fff',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', gap: 4
                        }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>Table {t.tableNumber}</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{t.capacity} seats • <span style={{ textTransform: 'capitalize' }}>{t.location}</span></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {availability !== null && availability > 0 ? (
                  <button style={{ ...s.primaryBtn, opacity: selectedTableId ? 1 : 0.5 }} onClick={() => setStep(2)} disabled={!selectedTableId}>
                    Continue to Details →
                  </button>
                ) : (
                  <button style={s.primaryBtn} onClick={handleCheckAvailability} disabled={checkingAvail}>
                    {checkingAvail ? 'Checking…' : 'Check Availability'}
                  </button>
                )}
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div style={s.card}>
                <h2 style={s.cardTitle}>👤 Your Details</h2>
                <div style={s.summaryPill}>
                  📅 {date} &nbsp;|&nbsp; ⏰ {timeSlot} &nbsp;|&nbsp; 👥 {seats} seat{seats > 1 ? 's' : ''}
                  &nbsp;·&nbsp; <span style={{ color: '#10b981', fontWeight: 700 }}>{availability} table{availability > 1 ? 's' : ''} available</span>
                </div>
                <Input label="Full Name" icon="👤" type="text" placeholder="e.g. Hemalekha R" value={name} onChange={(e) => setName(e.target.value)} />
                <div style={s.fieldWrap}>
                  <label style={s.label}>✉️ Email Address</label>
                  <input
                    style={{ ...s.input, background: user ? '#f0fdf4' : undefined, cursor: user ? 'not-allowed' : 'text' }}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!user}
                    title={user ? 'Email is locked to your account email' : ''}
                  />
                  {user && <p style={{ fontSize: 11, color: '#059669', margin: '4px 0 0' }}>🔒 Locked to your account email</p>}
                </div>
                <Input label="Phone Number" icon="📱" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                {bookErr && <div style={s.errorBox}>{bookErr}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button style={s.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
                  <button style={s.primaryBtn} onClick={handleBook} disabled={booking}>
                    {booking ? 'Booking…' : '✅ Confirm Reservation'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && reservation && (
              <div style={s.card}>
                <div style={s.successHero}>
                  <div style={s.checkCircle}>✓</div>
                  <h2 style={{ margin: '16px 0 6px', color: '#1e293b', fontSize: 24 }}>Reservation Confirmed!</h2>
                  <p style={{ color: '#64748b', margin: 0 }}>A confirmation email has been sent to <strong>{reservation.customerEmail}</strong></p>
                </div>
                <div style={s.codeBox}>
                  <p style={s.codeLabel}>Your Confirmation Code</p>
                  <p style={s.codeValue}>{reservation.confirmationCode}</p>
                  <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 12 }}>Save this code — you'll need it to cancel your booking.</p>
                </div>
                <div style={s.detailsGrid}>
                  {[
                    ['🪑 Table', `Table ${reservation.tableNumber}`],
                    ['📍 Location', reservation.location],
                    ['📅 Date', new Date(reservation.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                    ['⏰ Time', reservation.timeSlot],
                    ['👥 Seats', `${reservation.numberOfSeats} seat${reservation.numberOfSeats > 1 ? 's' : ''}`],
                    ['💺 Capacity', `${reservation.capacity} seat table`]
                  ].map(([k, v]) => (
                    <div key={k} style={s.detailRow}>
                      <span style={s.detailKey}>{k}</span>
                      <span style={s.detailVal}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
                  <button style={s.calBtn} onClick={downloadICS}>📆 Add to Calendar (.ics)</button>
                  {user && (
                    <button style={{ ...s.secondaryBtn, borderColor: '#a7f3d0', color: '#059669' }}
                      onClick={() => { setActiveTab('my'); setStep(1); setReservation(null); setAvailability(null); setAvailableTables([]); setSelectedTableId(''); setDate(''); setTimeSlot(''); setSeats(2); setName(''); setPhone(''); }}>
                      🗂️ View My Reservations
                    </button>
                  )}
                  <button style={s.secondaryBtn} onClick={() => { setStep(1); setReservation(null); setAvailability(null); setAvailableTables([]); setSelectedTableId(''); setDate(''); setTimeSlot(''); setSeats(2); setName(''); setPhone(''); }}>
                    + New Reservation
                  </button>
                </div>
              </div>
            )}

            {/* Table Grid */}
            <div style={{ marginTop: 32 }}>
              <TableAvailabilityGrid />
            </div>
          </>
        )}

        {/* ══════════ MY RESERVATIONS TAB ══════════ */}
        {activeTab === 'my' && user && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={s.cardTitle}>🗂️ My Reservations</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Showing for: <strong style={{ color: '#1e293b' }}>{user.email}</strong></span>
                <button style={{ ...s.secondaryBtn, padding: '6px 14px', fontSize: 13 }} onClick={fetchMyReservations}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            {myLoading && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>Loading your reservations…</div>
            )}
            {myError && <div style={s.errorBox}>{myError}</div>}

            {!myLoading && myReservations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                <p style={{ color: '#94a3b8', margin: 0 }}>You have no reservations yet.</p>
                <button style={{ ...s.primaryBtn, marginTop: 16, width: 'auto', padding: '10px 24px' }} onClick={() => setActiveTab('book')}>
                  Book a Table
                </button>
              </div>
            )}

            {!myLoading && myReservations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myReservations.map(r => {
                  const cfg = statusBadgeStyle[r.status] || statusBadgeStyle.pending;
                  const fb = cancelFeedback[r.confirmationCode];
                  const canCancel = r.status === 'confirmed' || r.status === 'pending';
                  return (
                    <div key={r._id} style={s.myResCard}>
                      <div style={s.myResHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={s.codePillLg}>{r.confirmationCode}</span>
                          <span style={{ ...s.statusBadge, ...cfg }}>{r.status.toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          Booked on {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div style={s.myResBody}>
                        <div style={s.myResDetail}>
                          <span style={s.myResIcon}>🪑</span>
                          <div>
                            <div style={s.myResLabel}>Table</div>
                            <div style={s.myResValue}>
                              Table {r.tableId?.tableNumber || 'N/A'}
                              {r.tableId?.location && <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'capitalize' }}> · {r.tableId.location}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={s.myResDetail}>
                          <span style={s.myResIcon}>📅</span>
                          <div>
                            <div style={s.myResLabel}>Date</div>
                            <div style={s.myResValue}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <div style={s.myResDetail}>
                          <span style={s.myResIcon}>⏰</span>
                          <div>
                            <div style={s.myResLabel}>Time Slot</div>
                            <div style={s.myResValue}>{r.timeSlot}</div>
                          </div>
                        </div>
                        <div style={s.myResDetail}>
                          <span style={s.myResIcon}>👥</span>
                          <div>
                            <div style={s.myResLabel}>Seats</div>
                            <div style={s.myResValue}>{r.numberOfSeats} seat{r.numberOfSeats > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {canCancel && (
                          <button
                            style={s.cancelMyBtn}
                            onClick={() => handleCancelMy(r.confirmationCode)}
                            disabled={cancellingId === r.confirmationCode}
                          >
                            {cancellingId === r.confirmationCode ? '…Cancelling' : '🗑️ Cancel Reservation'}
                          </button>
                        )}
                        {fb && (
                          <span style={{ fontSize: 13, color: fb.type === 'ok' ? '#059669' : '#dc2626', fontWeight: 600 }}>
                            {fb.msg}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Not logged in banner for My tab */}
        {activeTab === 'my' && !user && (
          <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Login Required</h3>
            <p style={{ color: '#64748b', margin: '0 0 20px' }}>Please log in to view and manage your reservations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── styles ── */
const s = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%)',
    padding: '80px 20px 64px', textAlign: 'center', overflow: 'hidden'
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16,185,129,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroPill: {
    display: 'inline-block', background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7',
    padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16, letterSpacing: 0.5
  },
  heroTitle: { margin: '0 0 12px', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: '#fff', letterSpacing: -1 },
  heroSub: { margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 500, marginInline: 'auto' },
  container: { maxWidth: 820, margin: '0 auto', padding: '32px 16px 64px' },

  // Tabs
  tabBar: { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 },
  tab: (active) => ({
    padding: '10px 22px', border: 'none', background: 'none',
    borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
    color: active ? '#1d4ed8' : '#64748b', fontWeight: active ? 700 : 500,
    fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
    marginBottom: -2, transition: 'all 0.2s'
  }),

  // Steps
  steps: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 0 },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  stepCircle: (active, done) => ({
    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, transition: 'all 0.3s',
    background: done ? '#10b981' : active ? '#3b82f6' : '#e2e8f0',
    color: done || active ? '#fff' : '#94a3b8',
    border: active ? '2px solid #1d4ed8' : 'none'
  }),
  stepLabel: (active, done) => ({
    fontSize: 11, fontWeight: done || active ? 700 : 500,
    color: done ? '#059669' : active ? '#1d4ed8' : '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap'
  }),
  stepLine: (done) => ({
    flex: 1, height: 2, background: done ? '#10b981' : '#e2e8f0',
    margin: '0 8px', marginBottom: 22, transition: 'background 0.3s', minWidth: 40
  }),

  card: {
    background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0', padding: '28px 28px 24px'
  },
  cardTitle: { margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1e293b' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  fieldWrap: { display: 'flex', flexDirection: 'column', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 },
  input: {
    padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: 14, color: '#1e293b', background: '#f8fafc',
    outline: 'none', transition: 'border 0.2s',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box'
  },
  seatGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  seatBtn: (active) => ({
    width: 42, height: 42, borderRadius: 8, border: active ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
    background: active ? '#eff6ff' : '#f8fafc', color: active ? '#1d4ed8' : '#374151',
    fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: 14, transition: 'all 0.15s'
  }),
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 12
  },
  successBox: {
    background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
    padding: '10px 14px', color: '#059669', fontSize: 13, marginBottom: 12
  },
  primaryBtn: {
    width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff',
    fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit'
  },
  secondaryBtn: {
    padding: '11px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit'
  },
  summaryPill: {
    display: 'inline-block', background: '#f0f9ff', border: '1px solid #bae6fd',
    borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#0369a1',
    marginBottom: 18, fontWeight: 500
  },
  successHero: { textAlign: 'center', marginBottom: 24 },
  checkCircle: {
    width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)',
    color: '#fff', fontSize: 28, fontWeight: 900, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
  },
  codeBox: {
    background: '#ecfdf5', border: '2px dashed #10b981', borderRadius: 12,
    padding: 20, textAlign: 'center', marginBottom: 20
  },
  codeLabel: { margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: 2 },
  codeValue: { margin: 0, fontSize: 36, fontWeight: 900, color: '#059669', letterSpacing: 8 },
  detailsGrid: { background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #e2e8f0' },
  detailKey: { fontSize: 13, color: '#64748b' },
  detailVal: { fontSize: 14, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' },
  calBtn: {
    padding: '11px 20px', borderRadius: 10, border: '1.5px solid #a7f3d0',
    background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit'
  },

  // My Reservations
  myResCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden'
  },
  myResHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafafa'
  },
  myResBody: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 0, padding: '12px 16px 8px'
  },
  myResDetail: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '6px 0'
  },
  myResIcon: { fontSize: 18, lineHeight: 1.5 },
  myResLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  myResValue: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
  codePillLg: {
    background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px',
    borderRadius: 6, fontFamily: 'monospace', fontWeight: 800, color: '#1e293b',
    fontSize: 16, letterSpacing: 2
  },
  statusBadge: {
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
  },
  cancelMyBtn: {
    padding: '8px 16px', borderRadius: 8, border: '1.5px solid #fecaca',
    background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit'
  }
};
