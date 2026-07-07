import { getRaceCalendar, getNextRace, isRaceCompleted } from '../api/f1Api';
import PageLoader from '../components/PageLoader';
import { getCountryFlag, formatRaceDate } from '../utils/countryFlags';
import './RaceCalendar.css';

async function fetchCalendarData() {
  const races = await getRaceCalendar();
  const nextRace = getNextRace(races);
  return { races, nextRace };
}

export default function RaceCalendar() {
  return (
    <PageLoader fetchFn={fetchCalendarData}>
      {({ races, nextRace }) => (
        <div className="page page-calendar animate-in">
          <h1 className="page-title">Race Calendar</h1>
          <p className="page-subtitle">2026 Grand Prix Schedule & Telemetry</p>

          <div className="calendar-grid">
            {races.map((race, idx) => {
              const isCompleted = isRaceCompleted(race);
              const isNext = nextRace && nextRace.round === race.round;
              const flag = getCountryFlag(race.Circuit.Location.country);
              const formattedDate = formatRaceDate(race.date);

              // Extract time details
              let formattedTime = '';
              if (race.time) {
                const [h, m] = race.time.split(':');
                formattedTime = `${h}:${m} UTC`;
              }

              return (
                <div
                  key={race.round}
                  className={`calendar-card card ${isNext ? 'next-race-card' : ''} ${
                    isCompleted ? 'completed-race-card' : ''
                  }`}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="calendar-card-header">
                    <span className="round-badge mono">R{race.round.padStart(2, '0')}</span>
                    {isNext && <span className="status-badge live mono">NEXT SESSION</span>}
                    {isCompleted && <span className="status-badge completed mono">COMPLETED</span>}
                  </div>
                  <div className="calendar-card-body">
                    <div className="race-location">
                      <span className="flag-emoji" role="img" aria-label={race.Circuit.Location.country}>
                        {flag}
                      </span>
                      <span className="locality">
                        {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                      </span>
                    </div>
                    <h3 className="race-name">{race.raceName}</h3>
                    <p className="circuit-name">{race.Circuit.CircuitName}</p>
                    <div className="race-meta mono">
                      <span className="race-date">📅 {formattedDate}</span>
                      {formattedTime && <span className="race-time">🕒 {formattedTime}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageLoader>
  );
}
