import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface WeatherCondition {
  weather: string;
  temp: string;
  wind: string;
  humidity: string;
  icon: string;
}

export function useWeather(lat?: number, lng?: number) {
  const [conditions, setConditions] = useState<WeatherCondition>({
    weather: 'Loading...',
    temp: '--',
    wind: '--',
    humidity: '--',
    icon: 'cloud'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      try {
        let latitude = lat;
        let longitude = lng;

        if (!latitude || !longitude) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLoading(false);
            return;
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }

        if (latitude && longitude) {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
          );
          const data = await response.json();

          if (isMounted && data && data.current) {
            const current = data.current;
            
            // Map WMO Weather codes to simple text
            let weatherText = 'Clear';
            let iconCode = 'sun';
            const code = current.weather_code;
            
            if (code <= 1) { weatherText = 'Clear'; iconCode = 'sun'; }
            else if (code <= 3) { weatherText = 'Cloudy'; iconCode = 'cloud'; }
            else if (code <= 49) { weatherText = 'Fog'; iconCode = 'cloud'; }
            else if (code <= 59) { weatherText = 'Drizzle'; iconCode = 'cloud-drizzle'; }
            else if (code <= 69) { weatherText = 'Rain'; iconCode = 'cloud-rain'; }
            else if (code <= 79) { weatherText = 'Snow'; iconCode = 'cloud-snow'; }
            else if (code <= 99) { weatherText = 'Thunderstorm'; iconCode = 'cloud-lightning'; }

            setConditions({
              weather: weatherText,
              temp: Math.round(current.temperature_2m).toString(),
              wind: `${Math.round(current.wind_speed_10m)} km/h`,
              humidity: `${Math.round(current.relative_humidity_2m)}%`,
              icon: iconCode
            });
          }
        }
      } catch (error) {
        console.error("Error fetching weather data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  return { conditions, loading };
}
