import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusConfig = {
  available: {
    label: 'Available',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    dot: '#10b981'
  },
  reserved: {
    label: 'Reserved',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#f59e0b'
  },
  occupied: {
    label: 'Occupied',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#ef4444'
  }
};

const locationIcon = { indoor: '🏠', outdoor: '☀️' };
const capacityIcon = (n) => '🪑'.repeat(Math.min(n / 2, 4));

export default function TableAvailabilityGrid() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Compute current time slot label for the header
  const now = new Date();
  const h = now.getHours();
  const currentSlotLabel = h >= 10 && h < 22
    ? `${String(h).padStart(2,'0')}:00–${String(h+1).padStart(2,'0')}:00`
    : null;

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/tables`);
      const data = await res.json();
      if (data.success) {
        setTables(data.data.tables);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Re-fetch from server on any tableUpdated event so the computed
    // real-time status (based on actual reservations for NOW) is always fresh.
    socket.on('tableUpdated', () => {
      fetchTables();
    });

    // Auto-refresh every 60 seconds so the grid self-corrects
    // as time slots change (e.g. 14:00 slot ends → table becomes available)
    const autoRefresh = setInterval(fetchTables, 60000);

    return () => {
      socket.disconnect();
      clearInterval(autoRefresh);
    };
  }, [fetchTables]);

  const stats = {
    available: tables.filter((t) => t.currentStatus === 'available').length,
    reserved: tables.filter((t) => t.currentStatus === 'reserved').length,
    occupied: tables.filter((t) => t.currentStatus === 'occupied').length
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={{ color: '#94a3b8', marginTop: 12 }}>Loading tables…</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Table Availability</h2>
          <p style={styles.subtitle}>
            {currentSlotLabel
              ? <>Showing real-time status for <strong>{currentSlotLabel}</strong> slot{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ''}</>
              : lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Real-time status'
            }
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={fetchTables}
            style={styles.refreshBtn}
            title="Refresh table status"
          >
            🔄
          </button>
          <div style={styles.socketBadge(connected)}>
            <span style={styles.socketDot(connected)} />
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        {Object.entries(stats).map(([key, count]) => {
          const cfg = statusConfig[key];
          return (
            <div key={key} style={styles.statCard(cfg)}>
              <span style={styles.statCount(cfg.color)}>{count}</span>
              <span style={styles.statLabel}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} style={styles.legendItem}>
            <span style={styles.legendDot(cfg.dot)} />
            <span style={styles.legendText}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {tables.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 48 }}>🍽️</span>
          <p style={{ color: '#94a3b8', marginTop: 12 }}>No tables configured yet.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {tables.map((table) => {
            const cfg = statusConfig[table.currentStatus] || statusConfig.available;
            return (
              <div key={table._id} style={styles.card(cfg)}>
                <div style={styles.cardHeader(cfg.color)}>
                  <span style={styles.tableNum}>T{table.tableNumber}</span>
                  <span style={styles.locationBadge}>
                    {locationIcon[table.location]} {table.location}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.capacityRow}>
                    <span style={styles.capacityIcon}>
                      {capacityIcon(table.capacity)}
                    </span>
                    <span style={styles.capacityText}>
                      {table.capacity} seats
                    </span>
                  </div>
                  <div style={styles.statusBadge(cfg)}>
                    <span style={styles.statusDot(cfg.dot)} />
                    {cfg.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- inline styles ---- */
const styles = {
  wrapper: {
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 60
  },
  spinner: {
    width: 36,
    height: 36,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#1e293b'
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#94a3b8'
  },
  refreshBtn: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
    color: '#475569'
  },
  socketBadge: (connected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    background: connected ? '#ecfdf5' : '#fef2f2',
    color: connected ? '#059669' : '#dc2626',
    border: `1px solid ${connected ? '#a7f3d0' : '#fecaca'}`
  }),
  socketDot: (connected) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: connected ? '#10b981' : '#ef4444',
    display: 'inline-block'
  }),
  statsBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 16
  },
  statCard: (cfg) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    borderRadius: 10,
    background: cfg.bg,
    border: `1px solid ${cfg.border}`
  }),
  statCount: (color) => ({
    fontSize: 28,
    fontWeight: 800,
    color,
    lineHeight: 1
  }),
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  legend: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  legendDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    display: 'inline-block'
  }),
  legendText: {
    fontSize: 13,
    color: '#64748b'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12
  },
  card: (cfg) => ({
    borderRadius: 12,
    border: `2px solid ${cfg.border}`,
    background: cfg.bg,
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'default'
  }),
  cardHeader: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: color,
    color: '#fff'
  }),
  tableNum: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 1
  },
  locationBadge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
    background: 'rgba(255,255,255,0.25)',
    padding: '2px 7px',
    borderRadius: 10
  },
  cardBody: {
    padding: '12px 12px 14px'
  },
  capacityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  capacityIcon: { fontSize: 14 },
  capacityText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: 600
  },
  statusBadge: (cfg) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: '#fff',
    color: cfg.color,
    border: `1px solid ${cfg.border}`
  }),
  statusDot: (color) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    display: 'inline-block'
  }),
  emptyState: {
    textAlign: 'center',
    padding: '48px 0'
  }
};
