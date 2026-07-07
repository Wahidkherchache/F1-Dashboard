import PointsBar from './PointsBar';
import './StandingsTable.css';

export default function StandingsTable({ rows, type = 'driver' }) {
  const maxPoints = Math.max(...rows.map((r) => parseInt(r.points, 10)), 1);

  return (
    <div className="standings-table-wrapper card">
      <table className="standings-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>{type === 'driver' ? 'Driver' : 'Team'}</th>
            {type === 'driver' && <th className="hide-mobile">Team</th>}
            <th>Points</th>
            <th className="hide-mobile">Wins</th>
            <th className="hide-mobile bar-col">Progress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const name =
              type === 'driver'
                ? `${row.Driver.givenName} ${row.Driver.familyName}`
                : row.Constructor.name;
            const team =
              type === 'driver' ? row.Constructors[0]?.name : null;

            return (
              <tr
                key={type === 'driver' ? row.Driver.driverId : row.Constructor.constructorId}
                className="standings-row"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <td className="pos mono">{row.position}</td>
                <td className="name">{name}</td>
                {type === 'driver' && (
                  <td className="team hide-mobile">{team}</td>
                )}
                <td className="points mono">{row.points}</td>
                <td className="wins mono hide-mobile">{row.wins}</td>
                <td className="bar-col hide-mobile">
                  <PointsBar
                    value={parseInt(row.points, 10)}
                    max={maxPoints}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
