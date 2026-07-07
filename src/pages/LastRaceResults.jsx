import { getLastRaceResults } from '../api/f1Api';
import Podium from '../components/Podium';
import PageLoader from '../components/PageLoader';
import { getCountryFlag, formatRaceDate } from '../utils/countryFlags';
import './LastRaceResults.css';

export default function LastRaceResults() {
  return (
    <PageLoader fetchFn={getLastRaceResults}>
      {({ race, results }) => {
        if (!race) {
          return (
            <div className="page animate-in">
              <h1 className="page-title">Last Race Results</h1>
              <p className="page-subtitle">Grand Prix Results Telemetry</p>
              <div className="no-data-card card">
                <div className="card-body mono text-muted">
                  NO RACE RESULTS DATA LOGGED YET FOR THE 2026 SEASON
                </div>
              </div>
            </div>
          );
        }

        const flag = getCountryFlag(race.Circuit.Location.country);
        const formattedDate = formatRaceDate(race.date);

        return (
          <div className="page page-results animate-in">
            <h1 className="page-title">Last Race Results</h1>
            <p className="page-subtitle">
              {flag} {race.raceName} — {race.Circuit.CircuitName} ({formattedDate})
            </p>

            {results.length > 0 && <Podium results={results} />}

            <div className="results-table-section card stagger-3">
              <div className="card-header">Full Classification Telemetry</div>
              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>No</th>
                      <th>Driver</th>
                      <th>Team</th>
                      <th className="hide-mobile">Grid</th>
                      <th className="hide-mobile">Laps</th>
                      <th>Time/Status</th>
                      <th className="hide-mobile">Fastest Lap</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => {
                      const driverName = `${result.Driver.givenName} ${result.Driver.familyName}`;
                      const isFastestLap = result.FastestLap?.rank === '1';
                      const gapOrStatus = result.Time?.time || result.status;
                      const flTime = result.FastestLap?.Time?.time || '--';

                      return (
                        <tr
                          key={result.Driver.driverId}
                          className={`results-row ${isFastestLap ? 'fastest-lap-row' : ''}`}
                          style={{ animationDelay: `${idx * 0.03}s` }}
                        >
                          <td className="pos mono">{result.position}</td>
                          <td className="num mono text-muted">{result.number}</td>
                          <td className="driver font-weight-semibold">
                            {driverName}
                            {isFastestLap && (
                              <span className="fl-badge" title="Fastest Lap">
                                🟣 FL
                              </span>
                            )}
                          </td>
                          <td className="team text-secondary">{result.Constructor.name}</td>
                          <td className="grid mono hide-mobile">{result.grid}</td>
                          <td className="laps mono hide-mobile">{result.laps}</td>
                          <td className="time mono">{gapOrStatus}</td>
                          <td className="fl-time mono hide-mobile">{flTime}</td>
                          <td className="points mono font-weight-bold text-red">
                            {result.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }}
    </PageLoader>
  );
}
