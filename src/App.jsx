import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import DriverStandings from './pages/DriverStandings';
import ConstructorStandings from './pages/ConstructorStandings';
import RaceCalendar from './pages/RaceCalendar';
import LastRaceResults from './pages/LastRaceResults';
import LiveRace from './pages/LiveRace';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="live" element={<LiveRace />} />
          <Route index element={<Overview />} />
          <Route path="drivers" element={<DriverStandings />} />
          <Route path="constructors" element={<ConstructorStandings />} />
          <Route path="calendar" element={<RaceCalendar />} />
          <Route path="results" element={<LastRaceResults />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

