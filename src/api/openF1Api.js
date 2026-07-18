const BASE_URL = 'https://api.openf1.org/v1';
const FETCH_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out, please try again.');
    }
    throw new Error(`OpenF1 API request failed: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getLatestSession() {
  const data = await fetchWithTimeout(`${BASE_URL}/sessions?session_key=latest`);
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function getDrivers(sessionKey) {
  return await fetchWithTimeout(`${BASE_URL}/drivers?session_key=${sessionKey}`);
}

export async function getIntervals(sessionKey) {
  return await fetchWithTimeout(`${BASE_URL}/intervals?session_key=${sessionKey}`);
}
