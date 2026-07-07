import { useState, useEffect } from 'react';
import StartLights from './StartLights';
import './PageLoader.css';

export default function PageLoader({ fetchFn, children }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [showLights] = useState(() => !sessionStorage.getItem('f1_lights_shown'));
  const [lightsDone, setLightsDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchFn()
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err.message, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  const handleLightsComplete = () => {
    sessionStorage.setItem('f1_lights_shown', 'true');
    setLightsDone(true);
  };

  if (showLights && !lightsDone) {
    return <StartLights onComplete={handleLightsComplete} />;
  }

  if (state.loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Fetching live data...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-error">
        <div className="error-icon">⚠</div>
        <h2>Connection Error</h2>
        <p>{state.error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return children(state.data);
}
