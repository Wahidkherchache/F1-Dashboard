const COUNTRY_CODES = {
  Australia: 'AU',
  China: 'CN',
  Japan: 'JP',
  USA: 'US',
  Canada: 'CA',
  Monaco: 'MC',
  Spain: 'ES',
  Austria: 'AT',
  UK: 'GB',
  Belgium: 'BE',
  Hungary: 'HU',
  Netherlands: 'NL',
  Italy: 'IT',
  Azerbaijan: 'AZ',
  Singapore: 'SG',
  Mexico: 'MX',
  Brazil: 'BR',
  Qatar: 'QA',
  UAE: 'AE',
};

export function getCountryFlag(country) {
  const code = COUNTRY_CODES[country];
  if (!code) return '🏁';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export function formatRaceDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
