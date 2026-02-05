import type { WeatherData } from "../types";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

interface OpenWeatherCurrent {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{ description: string }>;
  wind: { speed: number };
  name: string;
}

interface OpenWeatherForecast {
  list: Array<{
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{ description: string }>;
    pop: number;
  }>;
}

export async function getWeatherForecast(): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const location = process.env.WEATHER_LOCATION || "New York,US";

  if (!apiKey) {
    return getPlaceholderWeather(location);
  }

  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(apiKey, location),
      fetchForecast(apiKey, location),
    ]);

    return {
      location: current.name,
      current: {
        tempF: kelvinToFahrenheit(current.main.temp),
        tempC: kelvinToCelsius(current.main.temp),
        condition: current.weather[0]?.description || "Unknown",
        humidity: current.main.humidity,
        windMph: msToMph(current.wind.speed),
      },
      forecast: processForecast(forecast),
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return getPlaceholderWeather(location);
  }
}

async function fetchCurrentWeather(
  apiKey: string,
  location: string
): Promise<OpenWeatherCurrent> {
  const url = `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
}

async function fetchForecast(
  apiKey: string,
  location: string
): Promise<OpenWeatherForecast> {
  const url = `${OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Forecast API error: ${response.status}`);
  }

  return response.json();
}

function processForecast(
  data: OpenWeatherForecast
): WeatherData["forecast"] {
  const dailyData = new Map<
    string,
    { temps: number[]; conditions: string[]; pops: number[] }
  >();

  for (const item of data.list) {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0];

    if (!dailyData.has(date)) {
      dailyData.set(date, { temps: [], conditions: [], pops: [] });
    }

    const day = dailyData.get(date)!;
    day.temps.push(item.main.temp_min, item.main.temp_max);
    day.conditions.push(item.weather[0]?.description || "");
    day.pops.push(item.pop);
  }

  const forecast: WeatherData["forecast"] = [];
  const dates = Array.from(dailyData.keys()).slice(0, 4);

  for (const date of dates) {
    const day = dailyData.get(date)!;
    const minTemp = Math.min(...day.temps);
    const maxTemp = Math.max(...day.temps);
    const maxPop = Math.max(...day.pops);
    const condition = getMostCommonCondition(day.conditions);

    forecast.push({
      date,
      highF: kelvinToFahrenheit(maxTemp),
      lowF: kelvinToFahrenheit(minTemp),
      highC: kelvinToCelsius(maxTemp),
      lowC: kelvinToCelsius(minTemp),
      condition,
      precipChance: Math.round(maxPop * 100),
    });
  }

  return forecast;
}

function getMostCommonCondition(conditions: string[]): string {
  const counts = new Map<string, number>();

  for (const c of conditions) {
    counts.set(c, (counts.get(c) || 0) + 1);
  }

  let maxCount = 0;
  let mostCommon = conditions[0] || "Unknown";

  for (const [condition, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = condition;
    }
  }

  return mostCommon;
}

function kelvinToFahrenheit(k: number): number {
  return Math.round((k - 273.15) * (9 / 5) + 32);
}

function kelvinToCelsius(k: number): number {
  return Math.round(k - 273.15);
}

function msToMph(ms: number): number {
  return Math.round(ms * 2.237);
}

function getPlaceholderWeather(location: string): WeatherData {
  return {
    location,
    current: {
      tempF: 0,
      tempC: 0,
      condition: "Weather data unavailable",
      humidity: 0,
      windMph: 0,
    },
    forecast: [],
  };
}
