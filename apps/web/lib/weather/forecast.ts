import type { WeatherData } from "../types";

// Sunnyvale, CA coordinates
const SUNNYVALE_LAT = 37.3688;
const SUNNYVALE_LON = -122.0363;
const LOCATION_NAME = "Sunnyvale, CA";

const WEATHER_GOV_BASE_URL = "https://api.weather.gov";
const USER_AGENT = "PDB-News-Bot/1.0 (contact@example.com)";

interface PointsResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
    observationStations: string;
  };
}

interface ForecastResponse {
  properties: {
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      endTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
      detailedForecast: string;
      probabilityOfPrecipitation?: {
        value: number | null;
      };
      relativeHumidity?: {
        value: number | null;
      };
    }>;
  };
}

interface StationsResponse {
  features: Array<{
    properties: {
      stationIdentifier: string;
    };
  }>;
}

interface ObservationResponse {
  properties: {
    temperature: { value: number | null };
    relativeHumidity: { value: number | null };
    windSpeed: { value: number | null };
    textDescription: string;
  };
}

export async function getWeatherForecast(): Promise<WeatherData> {
  try {
    // Step 1: Get the grid endpoints for Sunnyvale coordinates
    const pointsUrl = `${WEATHER_GOV_BASE_URL}/points/${SUNNYVALE_LAT},${SUNNYVALE_LON}`;
    const pointsResponse = await fetchWithUserAgent(pointsUrl);
    const pointsData: PointsResponse = await pointsResponse.json();

    // Step 2: Fetch forecast and current observations in parallel
    const [forecastData, currentWeather] = await Promise.all([
      fetchForecast(pointsData.properties.forecast),
      fetchCurrentObservation(pointsData.properties.observationStations),
    ]);

    return {
      location: LOCATION_NAME,
      current: currentWeather,
      forecast: processForecast(forecastData),
    };
  } catch (error) {
    console.error("Failed to fetch weather from weather.gov:", error);
    return getPlaceholderWeather();
  }
}

async function fetchWithUserAgent(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function fetchForecast(forecastUrl: string): Promise<ForecastResponse> {
  const response = await fetchWithUserAgent(forecastUrl);
  return response.json();
}

async function fetchCurrentObservation(
  stationsUrl: string
): Promise<WeatherData["current"]> {
  try {
    // Get list of observation stations
    const stationsResponse = await fetchWithUserAgent(stationsUrl);
    const stationsData: StationsResponse = await stationsResponse.json();

    if (stationsData.features.length === 0) {
      throw new Error("No observation stations found");
    }

    // Get latest observation from the nearest station
    const stationId = stationsData.features[0].properties.stationIdentifier;
    const observationUrl = `${WEATHER_GOV_BASE_URL}/stations/${stationId}/observations/latest`;
    const observationResponse = await fetchWithUserAgent(observationUrl);
    const observation: ObservationResponse = await observationResponse.json();

    const tempC = observation.properties.temperature.value;
    const humidity = observation.properties.relativeHumidity?.value;
    const windSpeedKmh = observation.properties.windSpeed?.value;

    return {
      tempF: tempC !== null ? celsiusToFahrenheit(tempC) : 0,
      tempC: tempC !== null ? Math.round(tempC) : 0,
      condition: observation.properties.textDescription || "Unknown",
      humidity: humidity !== null ? Math.round(humidity) : 0,
      windMph: windSpeedKmh !== null ? kmhToMph(windSpeedKmh) : 0,
    };
  } catch (error) {
    console.error("Failed to fetch current observation:", error);
    return {
      tempF: 0,
      tempC: 0,
      condition: "Current conditions unavailable",
      humidity: 0,
      windMph: 0,
    };
  }
}

function processForecast(data: ForecastResponse): WeatherData["forecast"] {
  const periods = data.properties.periods;
  const dailyData = new Map<
    string,
    { high: number | null; low: number | null; condition: string; precipChance: number }
  >();

  for (const period of periods) {
    const date = period.startTime.split("T")[0];

    if (!dailyData.has(date)) {
      dailyData.set(date, {
        high: null,
        low: null,
        condition: "",
        precipChance: 0,
      });
    }

    const day = dailyData.get(date)!;

    if (period.isDaytime) {
      day.high = period.temperature;
      day.condition = period.shortForecast;
    } else {
      day.low = period.temperature;
    }

    const precip = period.probabilityOfPrecipitation?.value;
    if (precip !== null && precip !== undefined && precip > day.precipChance) {
      day.precipChance = precip;
    }
  }

  const forecast: WeatherData["forecast"] = [];
  const dates = Array.from(dailyData.keys()).slice(0, 4);

  for (const date of dates) {
    const day = dailyData.get(date)!;

    // Skip if we don't have both high and low
    if (day.high === null && day.low === null) continue;

    const highF = day.high ?? day.low ?? 0;
    const lowF = day.low ?? day.high ?? 0;

    forecast.push({
      date,
      highF,
      lowF,
      highC: fahrenheitToCelsius(highF),
      lowC: fahrenheitToCelsius(lowF),
      condition: day.condition || "Unknown",
      precipChance: day.precipChance,
    });
  }

  return forecast;
}

function celsiusToFahrenheit(c: number): number {
  return Math.round(c * (9 / 5) + 32);
}

function fahrenheitToCelsius(f: number): number {
  return Math.round((f - 32) * (5 / 9));
}

function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

function getPlaceholderWeather(): WeatherData {
  return {
    location: LOCATION_NAME,
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
