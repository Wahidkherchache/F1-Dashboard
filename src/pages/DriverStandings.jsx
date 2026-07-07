import { getDriverStandings } from '../api/f1Api';
import StandingsTable from '../components/StandingsTable';
import PageLoader from '../components/PageLoader';

export default function DriverStandings() {
  return (
    <PageLoader fetchFn={getDriverStandings}>
      {(drivers) => (
        <div className="page animate-in">
          <h1 className="page-title">Driver Standings</h1>
          <p className="page-subtitle">2026 Driver Championship Rankings</p>
          {drivers.length > 0 ? (
            <StandingsTable rows={drivers} type="driver" />
          ) : (
            <div className="no-data-card card">
              <div className="card-body mono text-muted">
                NO STANDINGS TELEMETRY LOGGED YET FOR THE 2026 SEASON
              </div>
            </div>
          )}
        </div>
      )}
    </PageLoader>
  );
}
