import { useState } from 'react';
import {
  getRaceCalendar,
  getDriverStandings,
  getConstructorStandings,
  getPointsProgression,
  getNextRace,
  isRaceCompleted
} from '../api/f1Api';
import CountdownTimer from '../components/CountdownTimer';
import SummaryCard from '../components/SummaryCard';
import PageLoader from '../components/PageLoader';
import './Overview.css';

// Custom Telemetry Chart using SVG for complete stability and zero-dependency React 19 compatibility
function TelemetryChart({ data }) {
  const colors = ['#e24b4a', '#ffd700', '#00d2ff', '#00ff87', '#ff00ea'];
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) return null;

  // Extract driver names (keys other than 'round')
  const drivers = Object.keys(data[0]).filter((key) => key !== 'round');

  // Find max points value to scale Y axis
  let maxPoints = 10;
  data.forEach((d) => {
    drivers.forEach((driver) => {
      if (d[driver] > maxPoints) {
        maxPoints = d[driver];
      }
    });
  });
  // Round to nearest 25 for clean grid lines
  const yMax = Math.ceil(maxPoints / 25) * 25;

  // Layout parameters
  const width = 600;
  const height = 300;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const roundsCount = data.length;

  // Generate ticks for Y axis (4 intervals)
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));

  // Compute coordinates for a driver's data point
  const getCoordinates = (driverName) => {
    return data.map((d, index) => {
      const x =
        roundsCount > 1
          ? paddingLeft + (index / (roundsCount - 1)) * chartWidth
          : paddingLeft + chartWidth / 2;
      const pts = d[driverName] || 0;
      const y = paddingTop + chartHeight - (pts / yMax) * chartHeight;
      return { x, y, val: pts, round: d.round, driver: driverName };
    });
  };

  return (
    <div className="custom-telemetry-chart">
      <div className="svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          {/* Grid lines (horizontal) */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / yMax) * chartHeight;
            return (
              <g key={`y-grid-${i}`} className="grid-group">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#222"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="axis-label mono"
                  fill="#888"
                  fontSize="10"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Grid lines (vertical) & Round labels */}
          {data.map((d, idx) => {
            const x =
              roundsCount > 1
                ? paddingLeft + (idx / (roundsCount - 1)) * chartWidth
                : paddingLeft + chartWidth / 2;
            return (
              <g key={`x-grid-${idx}`} className="grid-group">
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  stroke="#222"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 16}
                  textAnchor="middle"
                  className="axis-label mono"
                  fill="#888"
                  fontSize="10"
                >
                  {d.round}
                </text>
              </g>
            );
          })}

          {/* Lines and dots for each driver */}
          {drivers.map((driver, dIdx) => {
            const points = getCoordinates(driver);
            const color = colors[dIdx % colors.length];

            // Build SVG path d string
            const pathD = points
              .map((p, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            return (
              <g key={driver} className="chart-series">
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="chart-line"
                />
                {points.map((p, pIdx) => (
                  <g key={`${driver}-${pIdx}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="#161616"
                      stroke={color}
                      strokeWidth="2"
                      className="chart-dot"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="10"
                      fill="transparent"
                      className="hover-trigger"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <title>{`${p.driver}: ${p.val} pts (${p.round})`}</title>
                    </circle>
                  </g>
                ))}
              </g>
            );
          })}

          {/* Interactive HUD Overlay for hovered point */}
          {hoveredPoint && (
            <g className="hud-overlay">
              <rect
                x={Math.min(width - 150, Math.max(10, hoveredPoint.x - 70))}
                y={hoveredPoint.y - 45}
                width="140"
                height="32"
                rx="4"
                fill="#0d0d0d"
                stroke="#333"
                strokeWidth="1"
                opacity="0.95"
              />
              <text
                x={Math.min(width - 150, Math.max(10, hoveredPoint.x - 70)) + 70}
                y={hoveredPoint.y - 32}
                textAnchor="middle"
                fill="#f0f0f0"
                fontSize="9"
                fontWeight="bold"
              >
                {hoveredPoint.driver}
              </text>
              <text
                x={Math.min(width - 150, Math.max(10, hoveredPoint.x - 70)) + 70}
                y={hoveredPoint.y - 20}
                textAnchor="middle"
                fill="#e24b4a"
                className="mono"
                fontSize="9"
                fontWeight="bold"
              >
                {hoveredPoint.round}: {hoveredPoint.val} PTS
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Custom Legend */}
      <div className="chart-legend">
        {drivers.map((driver, dIdx) => (
          <div key={driver} className="legend-item">
            <span
              className="legend-color-dot"
              style={{ backgroundColor: colors[dIdx % colors.length] }}
            />
            <span className="legend-text">{driver}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function fetchOverviewData() {
  const [races, drivers, constructors] = await Promise.all([
    getRaceCalendar(),
    getDriverStandings(),
    getConstructorStandings()
  ]);

  const nextRace = getNextRace(races);
  
  // Find completed races to know how many rounds to fetch for the chart
  const completedRaces = races.filter(isRaceCompleted);
  const completedRounds = completedRaces.length;
  
  let chartData = [];
  if (completedRounds > 0) {
    try {
      // Get points progression for the top 5 drivers up to the current completed round
      const rawProgression = await getPointsProgression(completedRounds);
      
      // Recharts expects data formatted as: [{ round: 1, 'Hamilton': 25, 'Verstappen': 18 }, ...]
      // Let's transform it:
      const rounds = Array.from({ length: completedRounds }, (_, i) => i + 1);
      chartData = rounds.map((r) => {
        const item = { round: `R${r}` };
        rawProgression.forEach((d) => {
          const pt = d.points.find((p) => p.round === r);
          item[d.name] = pt ? pt.points : 0;
        });
        return item;
      });
    } catch (e) {
      console.error('Failed to load points progression', e);
    }
  }

  return {
    nextRace,
    driverLeader: drivers[0],
    constructorLeader: constructors[0],
    chartData,
    completedRounds,
    driversCount: drivers.length,
    racesCount: races.length
  };
}

export default function Overview() {
  return (
    <PageLoader fetchFn={fetchOverviewData}>
      {({ nextRace, driverLeader, constructorLeader, chartData, completedRounds, driversCount, racesCount }) => {
        // Next race date
        const targetDate = nextRace
          ? new Date(`${nextRace.date}T${nextRace.time || '00:00:00Z'}`)
          : null;
        const raceName = nextRace ? `${nextRace.raceName} — ${nextRace.Circuit.CircuitName}` : 'Season End';

        // Prepare leaders details
        const driverName = driverLeader
          ? `${driverLeader.Driver.givenName} ${driverLeader.Driver.familyName}`
          : 'N/A';
        const driverTeam = driverLeader?.Constructors[0]?.name ?? 'N/A';
        const driverPoints = driverLeader?.points ?? '0';

        const constructorName = constructorLeader?.Constructor.name ?? 'N/A';
        const constructorPoints = constructorLeader?.points ?? '0';

        return (
          <div className="page page-overview animate-in">
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle">Telemetry & Championship Status</p>

            <div className="overview-hero card stagger-1">
              <div className="card-header">Telemetry Target: Next Session</div>
              <div className="card-body">
                <CountdownTimer targetDate={targetDate} raceName={raceName} />
              </div>
            </div>

            <div className="grid-2 stagger-2">
              <SummaryCard
                label="Drivers Leaderboard Leader"
                title={driverName}
                subtitle={driverTeam}
                value={driverPoints}
                icon="🏎️"
              />
              <SummaryCard
                label="Constructors Leaderboard Leader"
                title={constructorName}
                subtitle="Championship Leader"
                value={constructorPoints}
                icon="🔧"
              />
            </div>

            <div className="overview-chart-section card stagger-3">
              <div className="card-header">Championship Progression — Top 5 Drivers</div>
              <div className="card-body">
                {chartData.length > 0 ? (
                  <TelemetryChart data={chartData} />
                ) : (
                  <div className="no-chart-data">
                    <span className="telemetry-icon">📡</span>
                    <p>Championship points progression telemetry will populate here once the season begins and race results are logged.</p>
                    <span className="telemetry-info mono">Completed Rounds: {completedRounds}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="overview-stats grid-3 stagger-4">
              <div className="stat-box">
                <span className="stat-label">Season Races</span>
                <span className="stat-value mono">{racesCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Active Drivers</span>
                <span className="stat-value mono">{driversCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Telemetry Status</span>
                <span className="stat-value text-red mono">NOMINAL</span>
              </div>
            </div>
          </div>
        );
      }}
    </PageLoader>
  );
}
