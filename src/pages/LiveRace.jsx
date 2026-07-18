import { useState, useEffect, useRef } from 'react';
import { getLatestSession, getDrivers, getIntervals } from '../api/openF1Api';
import { getRaceCalendar, getNextRace } from '../api/f1Api';
import CountdownTimer from '../components/CountdownTimer';
import './LiveRace.css';

export default function LiveRace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [nextRace, setNextRace] = useState(null);
  const [drivers, setDrivers] = useState({});
  const [intervals, setIntervals] = useState([]);
  const [isLive, setIsLive] = useState(false);

  // Keep a ref to the session key to ensure intervals poll the correct session
  const sessionKeyRef = useRef(null);

  const initData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch latest OpenF1 session and Ergast race calendar in parallel
      const [latestSession, calendar] = await Promise.all([
        getLatestSession().catch((err) => {
          console.error('Failed to fetch latest session from OpenF1:', err);
          return null;
        }),
        getRaceCalendar().catch((err) => {
          console.error('Failed to fetch calendar from Jolpica:', err);
          return [];
        }),
      ]);

      // Determine next scheduled race for the empty state
      if (calendar && calendar.length > 0) {
        const next = getNextRace(calendar);
        setNextRace(next);
      }

      if (!latestSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      // 2. Validate if session qualifies as active/recent
      const now = new Date();
      const startDate = new Date(latestSession.date_start);
      const endDate = new Date(latestSession.date_end);

      // Check if session is practice or qualifying (not Race or Sprint)
      const sessionTypeLower = latestSession.session_type?.toLowerCase() || '';
      const isPracticeOrQuali =
        sessionTypeLower.includes('practice') ||
        sessionTypeLower.includes('qualifying') ||
        sessionTypeLower.includes('test');

      const endedMoreThan30MinsAgo = now - endDate > 30 * 60 * 1000;
      const startsMoreThanADayInFuture = startDate - now > 24 * 60 * 60 * 1000;

      if ((isPracticeOrQuali && endedMoreThan30MinsAgo) || startsMoreThanADayInFuture) {
        // Fall back to empty state
        setSession(null);
        setLoading(false);
        return;
      }

      // Valid session to display
      setSession(latestSession);
      sessionKeyRef.current = latestSession.session_key;

      // 3. Fetch drivers roster and initial intervals in parallel
      const [driversList, initialIntervals] = await Promise.all([
        getDrivers(latestSession.session_key).catch((err) => {
          throw new Error(`Failed to load driver names: ${err.message}`);
        }),
        getIntervals(latestSession.session_key).catch((err) => {
          console.error('Failed to fetch initial intervals:', err);
          return [];
        }),
      ]);

      // Convert driver list array to a map keyed by driver number (as string)
      const driverMap = {};
      if (Array.isArray(driversList)) {
        driversList.forEach((d) => {
          if (d.driver_number !== undefined && d.driver_number !== null) {
            driverMap[String(d.driver_number)] = d;
          }
        });
      }
      setDrivers(driverMap);
      setIntervals(initialIntervals || []);

      // 4. Set live status
      // Live window: 30 mins before start to 30 mins after end
      const isSessionLive =
        now >= new Date(startDate.getTime() - 30 * 60 * 1000) &&
        now <= new Date(endDate.getTime() + 30 * 60 * 1000);
      setIsLive(isSessionLive);

    } catch (err) {
      console.error('Error in initData:', err);
      setError(err.message || 'An error occurred while connecting to telemetry feed.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial load on mount
  useEffect(() => {
    initData();
  }, []);

  // Poll for interval data every 4.5 seconds if there's a valid session
  useEffect(() => {
    if (!session || !session.session_key) return;

    const pollInterval = setInterval(async () => {
      try {
        const intervalData = await getIntervals(session.session_key);
        if (intervalData) {
          setIntervals(intervalData);
        }

        // Keep updating isLive status based on real-time clock
        const now = new Date();
        const startDate = new Date(session.date_start);
        const endDate = new Date(session.date_end);
        const isSessionLive =
          now >= new Date(startDate.getTime() - 30 * 60 * 1000) &&
          now <= new Date(endDate.getTime() + 30 * 60 * 1000);
        setIsLive(isSessionLive);
      } catch (err) {
        console.warn('Interval polling cycle skipped due to network error:', err);
        // Do not crash page or set error state on background polling failures
      }
    }, 4500);

    return () => clearInterval(pollInterval);
  }, [session]);

  // Helper to parse gap values for sorting
  const getSortValue = (gap) => {
    if (gap === null || gap === undefined) return 0;
    if (typeof gap === 'number') return gap;
    const str = String(gap).trim();
    if (str.toUpperCase().includes('LAP')) {
      const match = str.match(/\d+/);
      const lapCount = match ? parseInt(match[0], 10) : 1;
      return 1000 + lapCount; // Lapped cars sort after floats
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 9999 : parsed;
  };

  const isLappedValue = (gap) => {
    if (gap === null || gap === undefined) return false;
    if (typeof gap === 'number') return false;
    return String(gap).trim().toUpperCase().includes('LAP');
  };

  // Process and sort interval data
  const processIntervals = () => {
    if (!Array.isArray(intervals) || intervals.length === 0) {
      return [];
    }

    // Keep only the most recent entry per driver_number
    const latestMap = {};
    intervals.forEach((entry) => {
      if (entry.driver_number === undefined || entry.driver_number === null) return;
      const num = String(entry.driver_number);
      const date = entry.date ? new Date(entry.date) : new Date(0);

      if (!latestMap[num] || date > new Date(latestMap[num].date)) {
        latestMap[num] = entry;
      }
    });

    // Merge with driver details
    const merged = Object.keys(latestMap).map((num) => {
      const interval = latestMap[num];
      const driver = drivers[num] || {
        full_name: `Driver #${num}`,
        team_name: 'Independent',
        team_colour: '666666',
        name_acronym: `DRV${num}`,
      };

      return {
        driver_number: num,
        full_name: driver.full_name,
        name_acronym: driver.name_acronym,
        team_name: driver.team_name,
        team_colour: driver.team_colour ? `#${driver.team_colour}` : '#666666',
        gap_to_leader: interval.gap_to_leader,
        interval: interval.interval,
      };
    });

    // Sort by gap to leader (ascending)
    return merged.sort((a, b) => {
      const aHasGap = a.gap_to_leader !== null && a.gap_to_leader !== undefined;
      const bHasGap = b.gap_to_leader !== null && b.gap_to_leader !== undefined;

      if (!aHasGap && bHasGap) return 1;
      if (aHasGap && !bHasGap) return -1;
      if (!aHasGap && !bHasGap) return 0;

      const valA = getSortValue(a.gap_to_leader);
      const valB = getSortValue(b.gap_to_leader);
      const lapA = isLappedValue(a.gap_to_leader);
      const lapB = isLappedValue(b.gap_to_leader);

      if (lapA && !lapB) return 1;
      if (!lapA && lapB) return -1;

      return valA - valB;
    });
  };

  // Formatting helpers for table cells
  const formatGapToLeader = (gap, index) => {
    if (index === 0) return 'LEADER';
    if (gap === null || gap === undefined) return '--';
    if (typeof gap === 'number') {
      return `+${gap.toFixed(3)}`;
    }
    const str = String(gap).trim();
    if (str.toUpperCase().includes('LAP')) {
      return str;
    }
    const parsed = parseFloat(str);
    if (isNaN(parsed)) return str;
    return parsed === 0 ? 'LEADER' : `+${parsed.toFixed(3)}`;
  };

  const formatInterval = (interval, index) => {
    if (index === 0) return '--';
    if (interval === null || interval === undefined) return '--';
    if (typeof interval === 'number') {
      return `+${interval.toFixed(3)}`;
    }
    const parsed = parseFloat(String(interval).trim());
    if (isNaN(parsed)) return String(interval);
    return `+${parsed.toFixed(3)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="page animate-in">
        <div className="loading-telemetry-container">
          <div className="loading-spinner" />
          <div className="loading-text">INITIALIZING TELEMETRY STREAM...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page animate-in">
        <h1 className="page-title">Live Race Telemetry</h1>
        <p className="page-subtitle">Real-time Session Intervals</p>
        <div className="error-card card">
          <div className="card-body">
            <span className="error-title">Telemetry Offline</span>
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={initData}>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state: No active live session
  if (!session) {
    // Determine target countdown date
    const targetDate = nextRace
      ? new Date(`${nextRace.date}T${nextRace.time || '00:00:00Z'}`)
      : null;
    const raceName = nextRace
      ? `${nextRace.raceName} — ${nextRace.Circuit.CircuitName}`
      : 'Next Session';

    return (
      <div className="page animate-in">
        <h1 className="page-title">Live Race Telemetry</h1>
        <p className="page-subtitle">Real-time Driver Gaps & Intervals</p>

        <div className="no-live-session-card card stagger-1">
          <div className="card-body">
            <span className="satellite-icon" role="img" aria-label="satellite">📡</span>
            <h2 className="no-session-title">No live race session right now</h2>
            <p className="no-session-text">
              Telemetry feed goes online 30 minutes before session start and ends 30 minutes after
              completion. Use the countdown below to see when telemetry resumes.
            </p>

            {targetDate && (
              <div className="countdown-section">
                <CountdownTimer targetDate={targetDate} raceName={raceName} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal live/recent session state
  const sessionRows = processIntervals();
  const startDateFormatted = new Date(session.date_start).toLocaleString();

  return (
    <div className="page page-live-race animate-in">
      <div className="live-header-section">
        <div className="live-header-titles">
          <h1 className="page-title">Live Race Telemetry</h1>
          <p className="page-subtitle">
            {session.circuit_short_name} — {session.session_name} ({session.year})
          </p>
        </div>

        {isLive ? (
          <div className="live-badge">
            <span className="live-badge-dot" />
            <span>Live Telemetry</span>
          </div>
        ) : (
          <div className="static-badge">
            <span className="static-badge-dot" />
            <span>Session Archived</span>
          </div>
        )}
      </div>

      <div className="live-race-meta-card card stagger-1">
        <div className="card-header">Session Telemetry Parameters</div>
        <div className="card-body">
          <div className="live-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Location</span>
              <span className="meta-value">
                {session.circuit_short_name}, {session.country_name}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Session Type</span>
              <span className="meta-value">{session.session_type}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Session Start</span>
              <span className="meta-value mono" style={{ fontSize: '0.85rem' }}>
                {startDateFormatted}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Telemetry Status</span>
              <span className={`meta-value mono ${isLive ? 'text-red' : ''}`}>
                {isLive ? 'NOMINAL (POLLING)' : 'COMPLETED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="live-race-table-section card stagger-2">
        <div className="card-header">Real-Time Gap & Interval Matrix</div>
        <div className="live-table-wrapper">
          {sessionRows.length > 0 ? (
            <table className="live-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>No</th>
                  <th>Driver</th>
                  <th>Team</th>
                  <th>Gap to Leader</th>
                  <th>Interval Ahead</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((row, idx) => {
                  const isLeader = idx === 0;
                  const gapDisplay = formatGapToLeader(row.gap_to_leader, idx);
                  const intervalDisplay = formatInterval(row.interval, idx);

                  return (
                    <tr
                      key={row.driver_number}
                      className="live-row"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <td className="pos mono">{idx + 1}</td>
                      <td className="num mono text-muted">{row.driver_number}</td>
                      <td className="driver-cell">
                        <span className="mono" style={{ color: 'var(--text-primary)' }}>
                          {row.name_acronym}
                        </span>
                        <span className="hide-mobile" style={{ opacity: 0.8, fontSize: '0.85rem' }}>
                          {row.full_name}
                        </span>
                      </td>
                      <td className="team-cell">
                        <span
                          className="team-color-indicator"
                          style={{ backgroundColor: row.team_colour }}
                        />
                        <span className="hide-mobile">{row.team_name}</span>
                      </td>
                      <td className={`gap-cell mono ${isLeader ? 'gap-leader' : ''}`}>
                        {gapDisplay}
                      </td>
                      <td className="interval-cell mono">{intervalDisplay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="card-body mono text-muted text-center" style={{ padding: '3rem' }}>
              📡 WAITING FOR TRACK TELEMETRY PACKETS...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
