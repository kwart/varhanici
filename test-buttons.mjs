/**
 * Tests for the quick-day buttons logic.
 * Verifies that "Příští neděle" always resolves to a Sunday
 * and that the liturgical calendar lookup returns the correct day.
 *
 * Run: node test-buttons.mjs
 */

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures++;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// --- Test: nearest Sunday calculation ---

function nearestSunday(from) {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const daysUntilSunday = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + daysUntilSunday);
  return d;
}

// If today is Sunday, nearest Sunday is today
const sunday = new Date(2026, 2, 29); // March 29, 2026 = Sunday
const ns1 = nearestSunday(sunday);
assert(ns1.getDay() === 0, `Sunday input -> Sunday output (got day=${ns1.getDay()}, date=${ns1.toDateString()})`);
assert(ns1.getDate() === 29, `Sunday March 29 -> stays March 29 (got ${ns1.getDate()})`);

// Monday -> next Sunday
const monday = new Date(2026, 2, 23); // March 23, 2026 = Monday
const ns2 = nearestSunday(monday);
assert(ns2.getDay() === 0, `Monday input -> Sunday output (got day=${ns2.getDay()}, date=${ns2.toDateString()})`);
assert(ns2.getDate() === 29, `Monday March 23 -> Sunday March 29 (got ${ns2.getDate()})`);

// Saturday -> next Sunday
const saturday = new Date(2026, 2, 28); // March 28, 2026 = Saturday
const ns3 = nearestSunday(saturday);
assert(ns3.getDay() === 0, `Saturday input -> Sunday output (got day=${ns3.getDay()}, date=${ns3.toDateString()})`);
assert(ns3.getDate() === 29, `Saturday March 28 -> Sunday March 29 (got ${ns3.getDate()})`);

// Wednesday -> next Sunday
const wednesday = new Date(2026, 2, 25); // March 25, 2026 = Wednesday
const ns4 = nearestSunday(wednesday);
assert(ns4.getDay() === 0, `Wednesday input -> Sunday output (got day=${ns4.getDay()}, date=${ns4.toDateString()})`);
assert(ns4.getDate() === 29, `Wednesday March 25 -> Sunday March 29 (got ${ns4.getDate()})`);

// Test all 7 days of the week result in a Sunday
for (let i = 0; i < 7; i++) {
  const d = new Date(2026, 2, 23 + i); // Mon Mar 23 to Sun Mar 29
  const ns = nearestSunday(d);
  assert(ns.getDay() === 0, `Day ${d.toDateString()} -> nearest Sunday is ${ns.toDateString()} (day=${ns.getDay()})`);
}

// --- Test: liturgical calendar integration ---
// Load kalendar.js and verify the returned name for a Sunday contains "neděle"

async function testLiturgicalCalendar() {
  const resp = await fetch('https://m.liturgie.cz/misal/kalendar.js');
  const code = await resp.text();

  // kalendar.js uses browser globals, set up minimal environment
  const fn = new Function(`
    var document = { write: function(){} };
    var window = {};
    ${code}
    UvodniNastaveni();
    return { co_se_slavi, pravidelne, sanctoral, vyjimky, zacatek };
  `);
  const cal = fn();

  function getLiturgicalName(date) {
    for (let i = 0; i < cal.co_se_slavi.length; i++) {
      const entry = cal.co_se_slavi[i];
      if (!entry || !entry.datum) continue;
      if (Math.abs(entry.datum - date) < 43200000) {
        if (entry.kde === 'V' && cal.vyjimky[entry.id]?.nazev) return cal.vyjimky[entry.id].nazev;
        if (entry.kde === 'S' && cal.sanctoral[entry.id]?.nazev) return cal.sanctoral[entry.id].nazev;
        return cal.pravidelne[i] ? cal.pravidelne[i].nazev : null;
      }
    }
    return null;
  }

  // Test several known Sundays in the liturgical year 2025-2026
  const testSundays = [
    new Date(2025, 11, 7),  // Dec 7, 2025 - 2nd Sunday of Advent
    new Date(2025, 11, 14), // Dec 14, 2025
    new Date(2026, 0, 4),   // Jan 4, 2026
    new Date(2026, 2, 1),   // Mar 1, 2026
    new Date(2026, 2, 29),  // Mar 29, 2026
    new Date(2026, 3, 5),   // Apr 5, 2026 - Palm Sunday
    new Date(2026, 5, 7),   // Jun 7, 2026
    new Date(2026, 8, 6),   // Sep 6, 2026
  ];

  for (const sun of testSundays) {
    sun.setHours(12, 0, 0, 0);
    assert(sun.getDay() === 0, `${sun.toDateString()} is indeed a Sunday`);

    const name = getLiturgicalName(sun);
    assert(name !== null, `Liturgical name found for ${sun.toDateString()}: "${name}"`);
    if (name) {
      assert(
        name.toLowerCase().includes('neděle') || name.toLowerCase().includes('páně'),
        `Sunday ${sun.toDateString()} has "neděle" or "Páně" in name: "${name}"`
      );
    }
  }

  // Test that a Wednesday does NOT have "neděle" in its name
  const wed = new Date(2026, 2, 25);
  wed.setHours(12, 0, 0, 0);
  const wedName = getLiturgicalName(wed);
  assert(wedName !== null, `Liturgical name found for Wednesday ${wed.toDateString()}: "${wedName}"`);
  if (wedName) {
    assert(!wedName.toLowerCase().includes('neděle'), `Wednesday name does NOT contain "neděle": "${wedName}"`);
  }

  // Test the full nearestSunday + liturgical lookup flow
  const testDates = [
    new Date(2026, 2, 23), // Monday
    new Date(2026, 2, 29), // Sunday
    new Date(2026, 5, 3),  // Wednesday
    new Date(2026, 0, 1),  // Thursday
  ];

  for (const d of testDates) {
    const ns = nearestSunday(d);
    const name = getLiturgicalName(ns);
    assert(ns.getDay() === 0, `nearestSunday(${d.toDateString()}) = ${ns.toDateString()} is Sunday`);
    assert(name !== null, `Liturgical name for ${ns.toDateString()}: "${name}"`);
    if (name) {
      assert(
        name.toLowerCase().includes('neděle') || name.toLowerCase().includes('páně'),
        `Nearest Sunday lookup for ${d.toDateString()} -> "${name}" contains "neděle" or "Páně"`
      );
    }
  }
}

await testLiturgicalCalendar();

// --- Summary ---
if (failures > 0) {
  console.error(`\n${failures} test(s) FAILED`);
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
}
