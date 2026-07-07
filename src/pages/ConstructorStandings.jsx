import { getConstructorStandings } from '../api/f1Api';
import StandingsTable from '../components/StandingsTable';
import PageLoader from '../components/PageLoader';

export default function ConstructorStandings() {
  return (
    <PageLoader fetchFn={getConstructorStandings}>
      {(constructors) => (
        <div className="page animate-in">
          <h1 className="page-title">Constructor Standings</h1>
          <p className="page-subtitle">2026 Constructor Championship Rankings</p>
          {constructors.length > 0 ? (
            <StandingsTable rows={constructors} type="constructor" />
          ) : (
            <div className="no-data-card card">
              <div className="card-body mono text-muted">
                NO CONSTRUCTOR STANDINGS TELEMETRY LOGGED YET FOR THE 2026 SEASON
              </div>
            </div>
          )}
        </div>
      )}
    </PageLoader>
  );
}
