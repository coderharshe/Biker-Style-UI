/**
 * Utility to fetch route geometry between two points.
 * Defaults to OSRM (Open Source Routing Machine) for free, easy-to-use routing.
 */

export interface RoutePoint {
    latitude: number;
    longitude: number;
}

export async function fetchRouteLines(
    start: RoutePoint,
    end: RoutePoint,
    apiKey?: string
): Promise<RoutePoint[]> {
    try {
        if (apiKey && apiKey !== 'YOUR_ANDROID_API_KEY_HERE') {
            // Google Directions API implementation
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK') {
                const points = decodePolyline(data.routes[0].overview_polyline.points);
                return points;
            }
        }

        // Fallback: OSRM (Free, no API key required)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const osrmData = await res.json();

        if (osrmData.code === 'Ok') {
            return osrmData.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
                latitude: coord[1],
                longitude: coord[0],
            }));
        }

        return [start, end]; // Fallback to straight line if API fails
    } catch (err) {
        console.error('Routing Error:', err);
        return [start, end];
    }
}

/**
 * Helper to decode Google's encoded polyline format
 */
function decodePolyline(encoded: string): RoutePoint[] {
    const points: RoutePoint[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }
    return points;
}
