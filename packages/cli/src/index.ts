#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

const API_URL = process.env.PDB_API_URL || "http://localhost:3000";
const API_KEY = process.env.PDB_API_KEY || "";

interface WeatherData {
  location: string;
  current: {
    tempF: number;
    tempC: number;
    condition: string;
    humidity: number;
    windMph: number;
  };
  forecast: Array<{
    date: string;
    highF: number;
    lowF: number;
    highC: number;
    lowC: number;
    condition: string;
    precipChance: number;
  }>;
}

interface BriefItem {
  headline: string;
  summary: string;
  significance: string;
  sources: string[];
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
}

interface BriefSection {
  title: string;
  category: string;
  items: BriefItem[];
}

interface Brief {
  id: string;
  date: string;
  weather: WeatherData;
  executiveSummary: string;
  sections: BriefSection[];
  generatedAt: string;
}

const program = new Command();

program
  .name("pdb")
  .description("President's Daily Brief CLI")
  .version("1.0.0");

program
  .command("today")
  .description("View today's daily brief")
  .option("-j, --json", "Output as JSON")
  .action(async (options) => {
    const spinner = ora("Fetching today's brief...").start();

    try {
      const response = await fetch(`${API_URL}/api/briefs/today`);

      if (!response.ok) {
        if (response.status === 404) {
          spinner.warn("No brief available yet");
          console.log(
            chalk.gray("\nBriefs are generated daily at 6 AM, or run ") +
              chalk.cyan("pdb generate") +
              chalk.gray(" to create one now.")
          );
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const brief: Brief = await response.json();
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(brief, null, 2));
      } else {
        renderBrief(brief);
      }
    } catch (error) {
      spinner.fail("Failed to fetch brief");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("history")
  .description("List past briefs")
  .option("-n, --limit <number>", "Number of briefs to show", "10")
  .action(async (options) => {
    const spinner = ora("Fetching brief history...").start();

    try {
      const response = await fetch(`${API_URL}/api/briefs`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const briefs: Brief[] = await response.json();
      spinner.stop();

      if (briefs.length === 0) {
        console.log(chalk.yellow("No briefs found."));
        return;
      }

      console.log("\n" + chalk.bold.blue("Brief History") + "\n");

      const limit = parseInt(options.limit, 10);
      for (const brief of briefs.slice(0, limit)) {
        const date = new Date(brief.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        console.log(chalk.bold.white(date));
        console.log(chalk.gray(`  ID: ${brief.id}`));
        console.log(chalk.gray(`  ${brief.executiveSummary.slice(0, 100)}...`));
        console.log();
      }
    } catch (error) {
      spinner.fail("Failed to fetch history");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("generate")
  .description("Generate a new brief")
  .action(async () => {
    if (!API_KEY) {
      console.error(
        chalk.red("PDB_API_KEY environment variable is required to generate briefs.")
      );
      process.exit(1);
    }

    const spinner = ora("Generating new brief (this may take a minute)...").start();

    try {
      const response = await fetch(`${API_URL}/api/briefs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API error: ${response.status}`);
      }

      const brief: Brief = await response.json();
      spinner.succeed("Brief generated successfully!");

      renderBrief(brief);
    } catch (error) {
      spinner.fail("Failed to generate brief");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("view <id>")
  .description("View a specific brief by ID")
  .option("-j, --json", "Output as JSON")
  .action(async (id, options) => {
    const spinner = ora("Fetching brief...").start();

    try {
      const response = await fetch(`${API_URL}/api/briefs/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          spinner.fail("Brief not found");
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const brief: Brief = await response.json();
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(brief, null, 2));
      } else {
        renderBrief(brief);
      }
    } catch (error) {
      spinner.fail("Failed to fetch brief");
      console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"));
      process.exit(1);
    }
  });

function renderBrief(brief: Brief): void {
  const date = new Date(brief.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  console.log("\n");
  console.log(chalk.bold.blue("═".repeat(70)));
  console.log(chalk.bold.blue("  DAILY INTELLIGENCE BRIEF"));
  console.log(chalk.gray(`  ${date}`));
  console.log(chalk.bold.blue("═".repeat(70)));

  // Weather
  const weather = brief.weather;
  console.log("\n" + chalk.bold.magenta("☀ WEATHER - " + weather.location));
  console.log(
    chalk.white(
      `  ${weather.current.tempF}°F / ${weather.current.tempC}°C - ${capitalize(weather.current.condition)}`
    )
  );
  console.log(
    chalk.gray(
      `  Humidity: ${weather.current.humidity}% · Wind: ${weather.current.windMph} mph`
    )
  );

  if (weather.forecast.length > 0) {
    const forecastLine = weather.forecast
      .slice(0, 4)
      .map((day) => {
        const dayName = new Date(day.date).toLocaleDateString("en-US", {
          weekday: "short",
        });
        return `${dayName}: ${day.highF}°/${day.lowF}°F`;
      })
      .join(" | ");
    console.log(chalk.gray(`  ${forecastLine}`));
  }

  // Executive Summary
  console.log("\n" + chalk.yellow("━━ EXECUTIVE SUMMARY ━━"));
  console.log(chalk.white(wrapText(brief.executiveSummary, 70)));

  // Sections
  for (const section of brief.sections) {
    console.log("\n" + chalk.bold.cyan(`━━ ${section.title.toUpperCase()} ━━`));

    for (const item of section.items) {
      const confidenceColor =
        item.confidenceLevel === "HIGH"
          ? chalk.green
          : item.confidenceLevel === "MEDIUM"
            ? chalk.yellow
            : chalk.red;

      console.log("\n" + chalk.bold.white(`• ${item.headline}`));
      console.log(chalk.gray(wrapText(item.summary, 68, "  ")));
      console.log(chalk.dim.italic(`  → ${item.significance}`));
      console.log(
        chalk.dim(
          `  ${confidenceColor(`[${item.confidenceLevel}]`)} ${item.sources.join(", ")}`
        )
      );
    }
  }

  console.log("\n" + chalk.bold.blue("═".repeat(70)));
  console.log(
    chalk.gray(
      `  Generated at ${new Date(brief.generatedAt).toLocaleTimeString()}`
    )
  );
  console.log("\n");
}

function wrapText(text: string, width: number, indent = ""): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = indent;

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine === indent ? "" : " ") + word;
    } else {
      lines.push(currentLine);
      currentLine = indent + word;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

program.parse();
