import { useState, useCallback, useEffect } from 'react';

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      // Fallback to IP-based location (Mumbai default)
      setLocation({ lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra, India' });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      () => {
        // Fallback
        setLocation({ lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra, India' });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const getGoogleMapsLink = useCallback(() => {
    if (!location) return '';
    return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  }, [location]);

  return { location, loading, error, fetchLocation, getGoogleMapsLink };
}
