import './Podium.css';

const PODIUM_ORDER = [1, 0, 2];
const MEDALS = ['🥇', '🥈', '🥉'];
const CLASSES = ['podium-first', 'podium-second', 'podium-third'];

export default function Podium({ results }) {
  const top3 = results.slice(0, 3);
  const ordered = PODIUM_ORDER.map((i) => top3[i]).filter(Boolean);

  return (
    <div className="podium">
      {ordered.map((result, displayIdx) => {
        const origIdx = top3.indexOf(result);
        const driver = `${result.Driver.givenName} ${result.Driver.familyName}`;
        const team = result.Constructor.name;

        return (
          <div
            key={result.Driver.driverId}
            className={`podium-item ${CLASSES[origIdx]} animate-in stagger-${displayIdx + 1}`}
          >
            <div className="podium-medal">{MEDALS[origIdx]}</div>
            <div className="podium-driver">{driver}</div>
            <div className="podium-team">{team}</div>
            <div className="podium-time mono">
              {result.Time?.time || result.status}
            </div>
            <div className={`podium-block pos-${origIdx + 1}`}>
              <span className="podium-position mono">P{origIdx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
