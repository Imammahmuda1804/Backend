export type CoordinatePoint = {
  latitude: number | null;
  longitude: number | null;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function hasCoordinate(point: CoordinatePoint) {
  return (
    typeof point.latitude === 'number' && typeof point.longitude === 'number'
  );
}

export function calculateDistanceKm(
  origin: CoordinatePoint,
  destination: CoordinatePoint,
) {
  if (!hasCoordinate(origin) || !hasCoordinate(destination)) return null;

  const originLatitude = origin.latitude as number;
  const originLongitude = origin.longitude as number;
  const destinationLatitude = destination.latitude as number;
  const destinationLongitude = destination.longitude as number;

  const latDistance = toRadians(destinationLatitude - originLatitude);
  const lonDistance = toRadians(destinationLongitude - originLongitude);
  const originLat = toRadians(originLatitude);
  const destinationLat = toRadians(destinationLatitude);

  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(lonDistance / 2) *
      Math.sin(lonDistance / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}
