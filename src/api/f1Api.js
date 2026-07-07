const BASE_URL = "https://api.jolpi.ca/ergast/f1";
const SEASON = "2026";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 8000; // 8 seconds

async function fetchWithCache(endpoint) {
  const now = Date.now();
  const cacheKey = `f1_${endpoint}`;

  // 1. Try sessionStorage cache first (survives page reloads)
  const stored = sessionStorage.getItem(cacheKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (now - parsed.timestamp < CACHE_TTL) {
        return parsed.data;
      }
    } catch {
      // corrupted cache entry, ignore and refetch
    }
  }

  // 2. Fetch with a timeout so the UI never hangs forever
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ data, timestamp: now }),
      );
    } catch {
      // sessionStorage full or unavailable, safe to ignore
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out, please try again.");
    }
    throw err;
  }
}

export async function getDriverStandings() {
  const data = await fetchWithCache(`${SEASON}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings() {
  const data = await fetchWithCache(`${SEASON}/constructorStandings.json`);
  return (
    data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
  );
}

export async function getRaceCalendar() {
  const data = await fetchWithCache(`${SEASON}/races.json`);
  return data.MRData.RaceTable.Races ?? [];
}

export async function getLastRaceResults() {
  const data = await fetchWithCache(`${SEASON}/last/results.json`);
  const race = data.MRData.RaceTable.Races[0];
  return race
    ? { race, results: race.Results ?? [] }
    : { race: null, results: [] };
}

export async function getDriverStandingsByRound(round) {
  const data = await fetchWithCache(`${SEASON}/${round}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

// Reduced default rounds (5 instead of 9) and fetched sequentially
// instead of all-at-once, to avoid hammering the API with parallel
// requests and tripping rate limits.
export async function getPointsProgression(maxRound = 5) {
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  const allStandings = [];
  for (const r of rounds) {
    const standings = await getDriverStandingsByRound(r);
    allStandings.push(standings);
  }

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
    const raceDate = new Date(`${race.date}T${race.time || "00:00:00Z"}`);
    return raceDate > now;
  });
}

export function getRaceDateTime(race) {
  return new Date(`${race.date}T${race.time || "00:00:00Z"}`);
}

export function isRaceCompleted(race) {
  const raceDate = getRaceDateTime(race);
  const endOfRaceDay = new Date(raceDate);
  endOfRaceDay.setHours(endOfRaceDay.getHours() + 3);
  return new Date() > endOfRaceDay;
}
