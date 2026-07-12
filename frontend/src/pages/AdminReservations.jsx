import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { io } from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusConfig = {
  pending: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  confirmed: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
  completed: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }
};

export default function AdminReservations() {
  const { token } = useAuth();
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating] = useState(null);

  // Analytics Data
  const [byDayData, setByDayData] = useState([]);
  const [byTimeSlotData, setByTimeSlotData] = useState([]);
  const [tableUtilData, setTableUtilData] = useState([]);
  const [statusBreakdownData, setStatusBreakdownData] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dayRes, slotRes, utilRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/by-day`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/analytics/by-timeslot`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/analytics/table-utilisation`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/analytics/status-breakdown`, { headers }).then(r => r.json())
      ]);

      if (dayRes.success) setByDayData(dayRes.data);
      if (slotRes.success) setByTimeSlotData(slotRes.data);
      if (utilRes.success) setTableUtilData(utilRes.data);
      if (statusRes.success) setStatusBreakdownData(statusRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, [token]);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAllReservations(data.data.reservations || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshData = useCallback(() => {
    fetchReservations();
    fetchAnalytics();
  }, [fetchReservations, fetchAnalytics]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Socket connection to listen for updates in real-time
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('tableUpdated', () => {
      refreshData();
    });
    return () => socket.disconnect();
  }, [refreshData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdating(id);
      const res = await fetch(`${API_URL}/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      // Update local state and trigger analytics refresh
      setAllReservations(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      fetchAnalytics();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  // Client-side filtering
  const filteredReservations = allReservations.filter(r => {
    const matchDate = filterDate ? new Date(r.date).toISOString().split('T')[0] === filterDate : true;
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchDate && matchStatus;
  });

  // Calculate summary counts
  const totalCount = allReservations.length;
  const confirmedCount = allReservations.filter(r => r.status === 'confirmed').length;
  const pendingCount = allReservations.filter(r => r.status === 'pending').length;
  const completedCount = allReservations.filter(r => r.status === 'completed').length;
  const cancelledCount = allReservations.filter(r => r.status === 'cancelled').length;

  // Chart configuration definitions
  const lineChartData = {
    labels: byDayData.map(d => d.date),
    datasets: [
      {
        label: 'Reservations by Day',
        data: byDayData.map(d => d.totalReservations),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const barChartData = {
    labels: byTimeSlotData.map(d => d.timeSlot),
    datasets: [
      {
        label: 'Bookings by Time Slot',
        data: byTimeSlotData.map(d => d.count),
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  };

  const horizontalBarData = {
    labels: tableUtilData.map(d => `Table ${d.tableNumber} (Cap: ${d.capacity})`),
    datasets: [
      {
        label: 'Total Bookings',
        data: tableUtilData.map(d => d.totalBookings),
        backgroundColor: '#f59e0b',
        borderRadius: 6
      }
    ]
  };

  const pieChartData = {
    labels: statusBreakdownData.map(d => d.status.toUpperCase()),
    datasets: [
      {
        data: statusBreakdownData.map(d => d.count),
        backgroundColor: ['#e0e7ff', '#fef3c7', '#fee2e2', '#dcfce7'],
        borderColor: ['#4338ca', '#d97706', '#dc2626', '#15803d'],
        borderWidth: 1
      }
    ]
  };

  if (loading && allReservations.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading reservations dashboard...</div>;
  }

  return (
    <div style={s.wrapper}>
      {/* Summary Cards */}
      <div style={s.statsContainer}>
        <div style={s.statCard('#3b82f6')}>
          <div style={s.statVal}>{totalCount}</div>
          <div style={s.statLabel}>Total Reservations</div>
        </div>
        <div style={s.statCard('#4338ca')}>
          <div style={s.statVal}>{confirmedCount}</div>
          <div style={s.statLabel}>Confirmed</div>
        </div>
        <div style={s.statCard('#d97706')}>
          <div style={s.statVal}>{pendingCount}</div>
          <div style={s.statLabel}>Pending</div>
        </div>
        <div style={s.statCard('#15803d')}>
          <div style={s.statVal}>{completedCount}</div>
          <div style={s.statLabel}>Completed</div>
        </div>
        <div style={s.statCard('#dc2626')}>
          <div style={s.statVal}>{cancelledCount}</div>
          <div style={s.statLabel}>Cancelled</div>
        </div>
      </div>

      <div style={s.header}>
        <h1 style={s.title}>Reservations Dashboard</h1>
        
        <div style={s.filters}>
          <input
            type="date"
            style={s.input}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <select
            style={s.input}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(filterDate || filterStatus) && (
            <button style={s.clearBtn} onClick={() => { setFilterDate(''); setFilterStatus(''); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Code</th>
              <th style={s.th}>Customer Info</th>
              <th style={s.th}>Table & Date</th>
              <th style={s.th}>Seats</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                  No reservations matching the filters.
                </td>
              </tr>
            ) : (
              filteredReservations.map(res => {
                const cfg = statusConfig[res.status] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
                const isUpdating = updating === res._id;
                
                return (
                  <tr key={res._id} style={s.tr}>
                    <td style={s.td}>
                      <span style={s.codePill}>{res.confirmationCode}</span>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{res.customerName}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{res.customerEmail}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{res.customerPhone}</div>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        Table {res.tableId?.tableNumber || 'N/A'} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({res.tableId?.location || 'Unknown'})</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569' }}>
                        {new Date(res.date).toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                        {res.timeSlot}
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{res.numberOfSeats}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Capacity: {res.tableId?.capacity || '?'}</div>
                    </td>
                    <td style={s.td}>
                      <select
                        style={{
                          ...s.statusSelect,
                          background: cfg.bg,
                          color: cfg.text,
                          borderColor: cfg.border,
                          opacity: isUpdating ? 0.5 : 1
                        }}
                        value={res.status}
                        onChange={(e) => handleStatusChange(res._id, e.target.value)}
                        disabled={isUpdating}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Analytics Charts Grid */}
      <h2 style={{ ...s.title, marginTop: 40, marginBottom: 20 }}>Reservation Analytics</h2>
      <div style={s.chartsGrid}>
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Reservations by Day</h3>
          <div style={s.chartWrapper}>
            {byDayData.length > 0 ? (
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={s.noData}>No daily data available.</div>
            )}
          </div>
        </div>

        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Peak Booking Time Slots</h3>
          <div style={s.chartWrapper}>
            {byTimeSlotData.length > 0 ? (
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={s.noData}>No time slot data available.</div>
            )}
          </div>
        </div>

        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Table Utilisation</h3>
          <div style={s.chartWrapper}>
            {tableUtilData.length > 0 ? (
              <Bar
                data={horizontalBarData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            ) : (
              <div style={s.noData}>No table usage data available.</div>
            )}
          </div>
        </div>

        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Reservation Status Breakdown</h3>
          <div style={s.chartWrapper}>
            {statusBreakdownData.length > 0 ? (
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={s.noData}>No status breakdown data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    padding: '24px',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: (color) => ({
    background: '#fff',
    borderLeft: `4px solid ${color}`,
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }),
  statVal: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '4px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0
  },
  filters: {
    display: 'flex',
    gap: '12px'
  },
  input: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: '14px',
    color: '#334155'
  },
  clearBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    background: '#f1f5f9',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  tableWrap: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '16px 20px',
    verticalAlign: 'middle'
  },
  codePill: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    padding: '4px 8px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '1px'
  },
  statusSelect: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
    textTransform: 'capitalize'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
    marginTop: '16px'
  },
  chartCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  chartTitle: {
    margin: '0 0 16px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#475569'
  },
  chartWrapper: {
    height: '240px',
    position: 'relative'
  },
  noData: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#94a3b8',
    fontSize: '14px'
  }
};
