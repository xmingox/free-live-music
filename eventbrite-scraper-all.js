#!/usr/bin/env node

/**
 * Eventbrite Free Music Scraper - All 75 US Cities
 * 
 * Usage:
 * node eventbrite-scraper-all.js
 */

const puppeteer = require("puppeteer");

const CITIES = [
  { name: "Philadelphia", state: "PA", slug: "pa--philadelphia" },
  { name: "Houston", state: "TX", slug: "tx--houston" },
  { name: "Birmingham", state: "AL", slug: "al--birmingham" },
  { name: "New York", state: "NY", slug: "ny--new-york" },
  { name: "Los Angeles", state: "CA", slug: "ca--los-angeles" },
  { name: "Chicago", state: "IL", slug: "il--chicago" },
  { name: "Dallas", state: "TX", slug: "tx--dallas" },
  { name: "Austin", state: "TX", slug: "tx--austin" },
  { name: "San Francisco", state: "CA", slug: "ca--san-francisco" },
  { name: "Seattle", state: "WA", slug: "wa--seattle" },
  { name: "Denver", state: "CO", slug: "co--denver" },
  { name: "Boston", state: "MA", slug: "ma--boston" },
  { name: "Portland", state: "OR", slug: "or--portland" },
  { name: "Washington", state: "DC", slug: "dc--washington" },
  { name: "Atlanta", state: "GA", slug: "ga--atlanta" },
  { name: "Phoenix", state: "AZ", slug: "az--phoenix" },
  { name: "Miami", state: "FL", slug: "fl--miami" },
  { name: "Nashville", state: "TN", slug: "tn--nashville" },
  { name: "New Orleans", state: "LA", slug: "la--new-orleans" },
  { name: "Minneapolis", state: "MN", slug: "mn--minneapolis" },
  { name: "Detroit", state: "MI", slug: "mi--detroit" },
  { name: "Kansas City", state: "MO", slug: "mo--kansas-city" },
  { name: "Las Vegas", state: "NV", slug: "nv--las-vegas" },
  { name: "Memphis", state: "TN", slug: "tn--memphis" },
  { name: "Pittsburgh", state: "PA", slug: "pa--pittsburgh" },
  { name: "San Diego", state: "CA", slug: "ca--san-diego" },
  { name: "Tampa", state: "FL", slug: "fl--tampa" },
  { name: "Tucson", state: "AZ", slug: "az--tucson" },
  { name: "Sacramento", state: "CA", slug: "ca--sacramento" },
  { name: "Long Beach", state: "CA", slug: "ca--long-beach" },
  { name: "Albuquerque", state: "NM", slug: "nm--albuquerque" },
  { name: "Salt Lake City", state: "UT", slug: "ut--salt-lake-city" },
  { name: "Santa Ana", state: "CA", slug: "ca--santa-ana" },
  { name: "Louisville", state: "KY", slug: "ky--louisville" },
  { name: "Fresno", state: "CA", slug: "ca--fresno" },
  { name: "Indianapolis", state: "IN", slug: "in--indianapolis" },
  { name: "Columbus", state: "OH", slug: "oh--columbus" },
  { name: "Cleveland", state: "OH", slug: "oh--cleveland" },
  { name: "Raleigh", state: "NC", slug: "nc--raleigh" },
  { name: "Charlotte", state: "NC", slug: "nc--charlotte" },
  { name: "San Antonio", state: "TX", slug: "tx--san-antonio" },
  { name: "Fort Worth", state: "TX", slug: "tx--fort-worth" },
  { name: "El Paso", state: "TX", slug: "tx--el-paso" },
  { name: "Oklahoma City", state: "OK", slug: "ok--oklahoma-city" },
  { name: "Tulsa", state: "OK", slug: "ok--tulsa" },
  { name: "Anaheim", state: "CA", slug: "ca--anaheim" },
  { name: "Irvine", state: "CA", slug: "ca--irvine" },
  { name: "Stockton", state: "CA", slug: "ca--stockton" },
  { name: "Bakersfield", state: "CA", slug: "ca--bakersfield" },
  { name: "Riverside", state: "CA", slug: "ca--riverside" },
  { name: "Oakland", state: "CA", slug: "ca--oakland" },
  { name: "Honolulu", state: "HI", slug: "hi--honolulu" },
  { name: "Santa Fe", state: "NM", slug: "nm--santa-fe" },
  { name: "Boulder", state: "CO", slug: "co--boulder" },
  { name: "Fort Collins", state: "CO", slug: "co--fort-collins" },
  { name: "Aspen", state: "CO", slug: "co--aspen" },
  { name: "Park City", state: "UT", slug: "ut--park-city" },
  { name: "Moab", state: "UT", slug: "ut--moab" },
  { name: "Bozeman", state: "MT", slug: "mt--bozeman" },
  { name: "Missoula", state: "MT", slug: "mt--missoula" },
  { name: "Bend", state: "OR", slug: "or--bend" },
  { name: "Eugene", state: "OR", slug: "or--eugene" },
  { name: "Santa Barbara", state: "CA", slug: "ca--santa-barbara" },
  { name: "San Luis Obispo", state: "CA", slug: "ca--san-luis-obispo" },
  { name: "Santa Cruz", state: "CA", slug: "ca--santa-cruz" },
  { name: "Berkeley", state: "CA", slug: "ca--berkeley" },
  { name: "San Jose", state: "CA", slug: "ca--san-jose" },
  { name: "Santa Monica", state: "CA", slug: "ca--santa-monica" },
  { name: "Venice", state: "CA", slug: "ca--venice" },
  { name: "Pasadena", state: "CA", slug: "ca--pasadena" },
  { name: "Glendale", state: "CA", slug: "ca--glendale" },
  { name: "Burbank", state: "CA", slug: "ca--burbank" },
];

const EXCLUDE = ["bingo", "karaoke", "trivia", "poetry", "comedy", "open mic", "game night", "rave", "nightclub"];
const INCLUDE = ["concert", "live music", "live band", "performance", "symphony", "orchestra", "festival", "jazz", "classical", "blues", "rock", "indie", "folk"];

function isRealConcert(name) {
  const lower = name.toLowerCase();
  for (const keyword of EXCLUDE) if (lower.includes(keyword)) return false;
  for (const keyword of INCLUDE) if (lower.includes(keyword)) return true;
  return false;
}

async function scrapeCity(page, slug, cityName, stateName) {
  const url = `https://www.eventbrite.com/d/${slug}/free--events/music-concerts/`;
  process.stdout.write(`📍 ${cityName.padEnd(18)} (${stateName}) ... `);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector("[data-testid='event-card-title']", { timeout: 10000 });
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
    const concerts = events.filter((e) => isRealConcert(e.title));
    console.log(`✅ ${concerts.length}/${events.length}`);
    return concerts.map((c) => ({ ...c, city: cityName, state: stateName }));
  } catch (error) {
    console.log(`❌ Error`);
    return [];
  }
}

async function main() {
  console.log("\n🎵 Eventbrite Free Music Scraper - All 75 US Cities");
  console.log("=".repeat(70) + "\n");
  
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
  
  const allEvents = [];
  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i];
    const cityEvents = await scrapeCity(page, city.slug, city.name, city.state);
    allEvents.push(...cityEvents);
    await new Promise((r) => setTimeout(r, 1500));
  }
  
  await browser.close();
  
  console.log("\n" + "=".repeat(70));
  console.log(`\n✅ Total concerts found: ${allEvents.length}\n`);
  
  const byCity = {};
  allEvents.forEach((e) => {
    if (!byCity[e.city]) byCity[e.city] = [];
    byCity[e.city].push(e);
  });
  
  console.log("📊 Concerts by City:");
  Object.entries(byCity)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([city, events]) => {
      console.log(`   ${city.padEnd(20)} ${events.length} events`);
    });
  
  console.log("\n📝 Generated SQL:\n");
  console.log("-- Eventbrite Free Music Import");
  console.log("INSERT INTO concerts (artist_name, venue, date, time, city, neighborhood, genre, price, indoor_outdoor, source_url, source_name, is_verified) VALUES");
  
  const sqlLines = allEvents.map((e, i) => {
    const isLast = i === allEvents.length - 1;
    const title = e.title.replace(/'/g, "''").substring(0, 100);
    return `('${title}', 'TBD', '2026-05-01', '19:00', '${e.city}', '', 'Music', 'Free', 'Indoor', '${e.url}', 'Eventbrite', false)${isLast ? ";" : ","}`;
  });
  
  console.log(sqlLines.join("\n"));
  
  console.log("\n" + "=".repeat(70));
  console.log("\n💡 Copy the SQL above and paste into Supabase SQL Editor\n");
}

main().catch(console.error);
