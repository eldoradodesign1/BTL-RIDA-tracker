export function formatLocationStatus(t: { shop?: string; status?: string; arrivalTime?: string; departureTime?: string }) {
  const shop = t.shop?.trim() || 'Hub non défini';
  if (t.status === 'Présent' && t.arrivalTime) {
    return `${shop} | ${t.arrivalTime}`;
  }
  if (t.status === 'Clôturé' && t.departureTime) {
    return `${shop} | ${t.departureTime}`;
  }
  return shop;
}

export const formatAgentLocationLine = formatLocationStatus;

export function parseGpsCoords(text?: string | null): { lat: number; long: number } | null {
  if (!text) return null;
  const raw = (() => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  })();
  const regexes = [
    /[?&](?:q|query)=(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
    /(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/
  ];
  for (const r of regexes) {
    const match = raw.match(r);
    if (!match) continue;
    const lat = Number(match[1]);
    const long = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(long) && Math.abs(lat) <= 90 && Math.abs(long) <= 180) {
      return { lat, long };
    }
  }
  return null;
}

export function buildMapsEmbedUrl(lat: number, long: number): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${long}`)}&output=embed`;
}

export function getMapsEmbedUrl(t: any, defaultLat = -11.66089, defaultLong = 27.47938): string {
  const mapsIn = t?.reportObj?.maps_in || t?.mapsIn || '';
  const mapsOut = t?.reportObj?.maps_out || t?.mapsOut || '';
  const target = t?.status === 'Clôturé' ? (mapsOut || mapsIn) : (mapsIn || mapsOut);
  const parsed = parseGpsCoords(target);
  if (parsed) {
    return buildMapsEmbedUrl(parsed.lat, parsed.long);
  }
  const lat = typeof t?.lat === 'number' && Number.isFinite(t.lat) ? t.lat : defaultLat;
  const long = typeof t?.long === 'number' && Number.isFinite(t.long) ? t.long : defaultLong;
  return buildMapsEmbedUrl(lat, long);
}
