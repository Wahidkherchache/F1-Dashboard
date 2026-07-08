const BASE_URL = "https://api.jolpi.ca/ergast/f1";
const SEASON = "2026";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 8000; // 8 seconds
const DEFAULT_HEADERS = { Accept: "application/json" };

function getCacheKey(endpoint) {
  return `f1_${endpoint}`;
}

function parseCachedValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getRaceIsoDate(race) {
  const date = race?.date;
  const time = race?.time || "00:00:00Z";
  if (!date) {
    return null;
  }

  const normalizedTime =
    time.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(time) ? time : `${time}Z`;

  return new Date(`${date}T${normalizedTime}`);
}

function isBrowserStorageAvailable() {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage !== null;
  } catch {
    return false;
  }
}

async function fetchWithCache(endpoint) {
  const now = Date.now();
  const cacheKey = getCacheKey(endpoint);
  const storageAvailable = isBrowserStorageAvailable();

  if (storageAvailable) {
    const stored = sessionStorage.getItem(cacheKey);
    const parsed = stored ? parseCachedValue(stored) : null;
    if (parsed && now - parsed.timestamp < CACHE_TTL) {
      return parsed.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      signal: controller.signal,
      headers: DEFAULT_HEADERS,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (storageAvailable) {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: now }),
        );
      } catch {
        // ignore storage failures
      }
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

function extractStandings(data, key) {
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.[key] ?? [];
}

export async function getDriverStandings() {
  const data = await fetchWithCache(`${SEASON}/driverStandings.json`);
  return extractStandings(data, "DriverStandings");
}

export async function getConstructorStandings() {
  const data = await fetchWithCache(`${SEASON}/constructorStandings.json`);
  return extractStandings(data, "ConstructorStandings");
}

export async function getRaceCalendar() {
  const data = await fetchWithCache(`${SEASON}/races.json`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getLastRaceResults() {
  const data = await fetchWithCache(`${SEASON}/last/results.json`);
  const race = data?.MRData?.RaceTable?.Races?.[0] ?? null;
  return {
    race,
    results: race?.Results ?? [],
  };
}

export async function getDriverStandingsByRound(round) {
  const data = await fetchWithCache(`${SEASON}/${round}/driverStandings.json`);
  return extractStandings(data, "DriverStandings");
}

async function fetchRoundsInBatches(rounds, batchSize = 3) {
  const standings = [];
  for (let i = 0; i < rounds.length; i += batchSize) {
    const batch = rounds
      .slice(i, i + batchSize)
      .map((round) => getDriverStandingsByRound(round));
    const results = await Promise.all(batch);
    standings.push(...results);
  }
  return standings;
}

export async function getPointsProgression(maxRound = 5, batchSize = 3) {
  const rounds = Array.from(
    { length: Math.max(0, maxRound) },
    (_, index) => index + 1,
  );
  const allStandings = await fetchRoundsInBatches(rounds, batchSize);

  const driverMap = allStandings.reduce((map, standings, index) => {
    const round = index + 1;
    standings.forEach((entry) => {
      const id = entry.Driver.driverId;
      const name = `${entry.Driver.givenName} ${entry.Driver.familyName}`;
      const points = Number(entry.points) || 0;

      if (!map[id]) {
        map[id] = { id, name, points: [] };
      }

      map[id].points.push({ round, points });
    });
    return map;
  }, {});

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
    const raceDate = getRaceIsoDate(race);
    return raceDate && raceDate > now;
  });
}

export function getRaceDateTime(race) {
  return getRaceIsoDate(race);
}

export function isRaceCompleted(race) {
  const raceDate = getRaceIsoDate(race);
  if (!raceDate) {
    return false;
  }

  const endOfRaceDay = new Date(raceDate);
  endOfRaceDay.setHours(endOfRaceDay.getHours() + 3);
  return new Date() > endOfRaceDay;
}
