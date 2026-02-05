// Quick test script for weather
import { getWeatherForecast } from "./lib/weather/forecast";

async function test() {
  console.log("Testing weather fetch...\n");

  try {
    const weather = await getWeatherForecast();
    console.log(`Location: ${weather.location}`);
    console.log(`Current: ${weather.current.tempF}°F / ${weather.current.tempC}°C`);
    console.log(`Condition: ${weather.current.condition}`);
    console.log(`Humidity: ${weather.current.humidity}%`);
    console.log(`Wind: ${weather.current.windMph} mph`);

    if (weather.forecast.length > 0) {
      console.log("\nForecast:");
      for (const day of weather.forecast) {
        console.log(`  ${day.date}: ${day.highF}°F/${day.lowF}°F (${day.highC}°C/${day.lowC}°C) - ${day.condition}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
