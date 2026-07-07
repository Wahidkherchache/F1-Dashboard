const BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const SEASON = '2026';
const CACHE_TTL = 5 * 60 * 1000;

const cache = new Map();

async function fetchWithCache(endpoint) {
  const now = Date.now();
  const cached = cache.get(endpoint);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(endpoint, { data, timestamp: now });
  return data;
}

export async function getDriverStandings() {
  const data = await fetchWithCache(`${SEASON}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings() {
  const data = await fetchWithCache(`${SEASON}/constructorStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

export async function getRaceCalendar() {
  const data = await fetchWithCache(`${SEASON}/races.json`);
  return data.MRData.RaceTable.Races ?? [];
}

export async function getLastRaceResults() {
  const data = await fetchWithCache(`${SEASON}/last/results.json`);
  const race = data.MRData.RaceTable.Races[0];
  return race ? { race, results: race.Results ?? [] } : { race: null, results: [] };
}

export async function getDriverStandingsByRound(round) {
  const data = await fetchWithCache(`${SEASON}/${round}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getPointsProgression(maxRound = 9) {
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
  const allStandings = await Promise.all(
    rounds.map((r) => getDriverStandingsByRound(r))
  );

  const driverMap = {};

  allStandings.forEach((standings, idx) => {
    const round = idx + 1;
    standings.forEach((entry) => {
      const id = entry.Driver.driverId;
      const name = `${entry.Driver.givenName} ${entry.Driver.familyName}`;
      if (!driverMap[id]) {
        driverMap[id] = { id, name, points: [] };
      }
      driverMap[id].points.push({
        round,
        points: parseInt(entry.points, 10),
      });
    });
  });

  return Object.values(driverMap)
    .sort((a, b) => {
      const aLast = a.points[a.points.length - 1]?.points ?? 0;
      const bLast = b.points[b.points.length - 1]?.points ?? 0;
      return bLast - aLast;
    })
    .slice(0, 5);
}

export function getNextRace(races) {
  const now = new Date();
  return races.find((race) => {
    const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    return raceDate > now;
  });
}

export function getRaceDateTime(race) {
  return new Date(`${race.date}T${race.time || '00:00:00Z'}`);
}

export function isRaceCompleted(race) {
  const raceDate = getRaceDateTime(race);
  const endOfRaceDay = new Date(raceDate);
  endOfRaceDay.setHours(endOfRaceDay.getHours() + 3);
  return new Date() > endOfRaceDay;
}
