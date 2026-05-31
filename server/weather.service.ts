import axios from "axios";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

if (!OPENWEATHER_API_KEY) {
  console.warn('[OpenWeather] Missing API key - Weather alerts will not work. Configure OPENWEATHER_API_KEY environment variable.');
}
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  rain: number;
  description: string;
  main: string;
  icon: string;
  sunrise: number;
  sunset: number;
}

export interface WeatherAlert {
  type: "rain" | "high_wind" | "extreme_temp" | "frost" | "drought";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
}

/**
 * Get current weather for a property location
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    if (!OPENWEATHER_API_KEY) {
      console.error('[Weather Service] OpenWeather API key not configured');
      return null;
    }
    
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: "metric",
      },
    });

    const data = response.data;
    return {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      clouds: data.clouds.all,
      rain: data.rain?.["1h"] || 0,
      description: data.weather[0].description,
      main: data.weather[0].main,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    };
  } catch (error) {
    console.error("[Weather Service] Failed to get current weather:", error);
    return null;
  }
}

/**
 * Get weather forecast for next 5 days
 */
export async function getWeatherForecast(lat: number, lon: number) {
  try {
    if (!OPENWEATHER_API_KEY) {
      console.error('[Weather Service] OpenWeather API key not configured');
      return [];
    }
    
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: "metric",
      },
    });

    return response.data.list.map((item: any) => ({
      timestamp: item.dt,
      temp: item.main.temp,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
      rain: item.rain?.["3h"] || 0,
      description: item.weather[0].description,
      main: item.weather[0].main,
    }));
  } catch (error) {
    console.error("[Weather Service] Failed to get weather forecast:", error);
    return [];
  }
}

/**
 * Analyze weather and generate compliance alerts
 */
export function analyzeWeatherForCompliance(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Rain alert - affects fertilizer application
  if (weather.rain > 0 || weather.main === "Rain") {
    alerts.push({
      type: "rain",
      severity: weather.rain > 5 ? "high" : "medium",
      description: `Rain detected: ${weather.rain}mm. Fertilizer application may be restricted.`,
      recommendation: "Postpone fertilizer application until weather clears. Check local ordinances for rain-based restrictions.",
    });
  }

  // High wind alert
  if (weather.windSpeed > 20) {
    alerts.push({
      type: "high_wind",
      severity: weather.windSpeed > 30 ? "critical" : "high",
      description: `High winds detected: ${weather.windSpeed} m/s. Application drift risk.`,
      recommendation: "Do not apply fertilizers or pesticides. Wait for wind speeds below 15 m/s.",
    });
  }

  // Extreme temperature alert
  if (weather.temp > 35 || weather.temp < 0) {
    alerts.push({
      type: "extreme_temp",
      severity: weather.temp > 40 || weather.temp < -5 ? "critical" : "high",
      description: `Extreme temperature: ${weather.temp}°C. Worker safety concern.`,
      recommendation: "Implement heat/cold safety protocols. Provide adequate breaks and hydration.",
    });
  }

  // Frost alert
  if (weather.temp < 0 && weather.main === "Clear") {
    alerts.push({
      type: "frost",
      severity: "high",
      description: `Frost conditions detected: ${weather.temp}°C. Turf damage risk.`,
      recommendation: "Avoid heavy foot traffic. Consider frost protection measures.",
    });
  }

  // Drought conditions (low humidity + high temp)
  if (weather.humidity < 30 && weather.temp > 25) {
    alerts.push({
      type: "drought",
      severity: "medium",
      description: `Drought conditions: ${weather.humidity}% humidity, ${weather.temp}°C. Irrigation needed.`,
      recommendation: "Increase irrigation frequency. Monitor soil moisture levels.",
    });
  }

  return alerts;
}

/**
 * Check if weather conditions allow work order execution
 */
export function canExecuteWorkOrder(weather: WeatherData): { allowed: boolean; reason?: string } {
  // Don't execute in heavy rain
  if (weather.rain > 10 || weather.main === "Thunderstorm") {
    return { allowed: false, reason: "Thunderstorm or heavy rain in progress" };
  }

  // Don't execute in extreme wind
  if (weather.windSpeed > 25) {
    return { allowed: false, reason: "Extreme wind conditions" };
  }

  // Don't execute in extreme temperatures
  if (weather.temp > 40 || weather.temp < -10) {
    return { allowed: false, reason: "Extreme temperature conditions" };
  }

  return { allowed: true };
}

/**
 * Get optimal application window based on weather forecast
 */
export function findOptimalApplicationWindow(forecast: any[]): { start: number; end: number; score: number } | null {
  let bestWindow = null;
  let bestScore = 0;

  for (let i = 0; i < forecast.length - 2; i++) {
    const window = forecast.slice(i, i + 3);
    let score = 100;

    // Penalize for rain
    window.forEach((item: any) => {
      if (item.rain > 0) score -= 50;
      if (item.main === "Rain") score -= 30;
    });

    // Penalize for wind
    window.forEach((item: any) => {
      if (item.windSpeed > 15) score -= 20;
      if (item.windSpeed > 20) score -= 40;
    });

    // Penalize for extreme temps
    window.forEach((item: any) => {
      if (item.temp > 35 || item.temp < 5) score -= 15;
    });

    if (score > bestScore && score > 50) {
      bestScore = score;
      bestWindow = {
        start: window[0].timestamp,
        end: window[window.length - 1].timestamp,
        score: bestScore,
      };
    }
  }

  return bestWindow;
}
