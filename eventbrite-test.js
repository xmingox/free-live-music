#!/usr/bin/env node

const puppeteer = require("puppeteer");

const CITIES = [
  { name: "New York", state: "NY", slug: "ny--new-york" },
  { name: "Los Angeles", state: "CA", slug: "ca--los-angeles" },
];

const EXCLUDE = ["bingo", "karaoke", "trivia", "poetry", "comedy", "open mic", "game night", "rave"];
const INCLUDE = ["concert", "live music", "performance", "festival", "jazz"];

function isRealConcert(name) {
  const lower = name.toLowerCase();
  for (const keyword of EXCLUDE) if (lower.includes(keyword)) return false;
  for (const keyword of INCLUDE) if (lower.includes(keyword)) return true;
  return false;
}

async function scrapeCity(page, slug, cityName, stateName) {
  const url = `https://www.eventbrite.com/d/${slug}/free--events/music-concerts/`;
  console.log(`\n📍 Testing ${cityName}, ${stateName}...`);
  console.log(`   URL: ${url}\n`);
  
  try {
    console.log("   ⏳ Loading page...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    
    console.log("   ⏳ Waiting for events to load...");
    await page.waitForSelector("[data-testid='event-card-title']", { timeout: 10000 });
    
    console.log("   ⏳ Extracting event data...");
    const events = await page.evaluate(() => {
      const eventElements = document.querySelectorAll('[data-testid="event-card-title"]');
      const results = [];
      eventElements.forEach((el) => {
        const title = el.textContent.trim();
        const link = el.closest('a');
        const url = link ? link.href : null;
        results.push({ title, url });
      });
      return results;
    });
    
    console.log(`   ✅ Found ${events.length} total events`);
    
    const concerts = events.filter((e) => isRealConcert(e.title));
    console.log(`   ✅ Filtered to ${concerts.length} real concerts\n`);
    
    concerts.slice(0, 3).forEach((c, i) => {
      console.log(`   ${i + 1}. "${c.title}"`);
    });
    
    return concerts.map((c) => ({ ...c, city: cityName, state: stateName }));
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return [];
  }
}

async function main() {
  console.log("\n🎵 Eventbrite Scraper - TEST MODE (2 Cities)\n");
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
  
  const allEvents = [];
  for (const city of CITIES) {
    const cityEvents = await scrapeCity(page, city.slug, city.name, city.state);
    allEvents.push(...cityEvents);
    await new Promise((r) => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  console.log("\n" + "=".repeat(70));
  console.log(`✅ Total found: ${allEvents.length} concerts\n`);
  
  if (allEvents.length > 0) {
    console.log("Sample SQL:\n");
    const sample = allEvents[0];
    console.log(`INSERT INTO concerts (artist_name, venue, date, time, city, neighborhood, genre, price, indoor_outdoor, source_url, source_name, is_verified) VALUES`);
    console.log(`('${sample.title.substring(0, 50)}', 'TBD', '2026-05-01', '19:00', '${sample.city}', '', 'Music', 'Free', 'Indoor', '${sample.url}', 'Eventbrite', false);`);
  }
}

main().catch(console.error);
