// Quick test script for news aggregation
import { aggregateNews } from "./lib/news/aggregator";

async function test() {
  console.log("Testing news aggregation...\n");

  try {
    const news = await aggregateNews();
    console.log(`✓ Fetched ${news.length} news items\n`);

    // Show a few samples
    const categories = new Set(news.map(n => n.category));
    console.log(`Categories: ${Array.from(categories).join(", ")}\n`);

    console.log("Sample headlines:");
    for (const item of news.slice(0, 5)) {
      console.log(`  [${item.category}] ${item.title}`);
      console.log(`    Source: ${item.source}`);
      console.log();
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
