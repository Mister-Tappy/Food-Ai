// =========================================================
// OPENING HOURS (OSM `opening_hours` tag) — lightweight parser
// OSM's opening_hours syntax (https://wiki.openstreetmap.org/wiki/Key:opening_hours)
// is very expressive. We don't implement the full grammar — only the
// common subset real-world restaurants actually use:
//
//   "24/7"
//   "Mo-Fr 09:00-18:00"
//   "Mo-Fr 09:00-18:00; Sa 10:00-14:00"
//   "Mo,We,Fr 11:00-15:00,18:00-22:00"
//   "Mo-Su 11:00-22:00"
//   "Mo-Fr 09:00-18:00; Su off"
//
// Anything we can't confidently parse returns `null` (unknown) rather
// than guessing — callers must treat null as "don't know", never as
// closed.
// =========================================================

const DAY_TOKENS = {
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
  Su: 0,
};

function expandDayRange(token) {
  // "Mo-Fr" -> [1,2,3,4,5]; "Sa" -> [6]; "Mo,We,Fr" handled by splitting on "," upstream.
  const m = token.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?$/);
  if (!m) return null;
  const start = DAY_TOKENS[m[1]];
  if (m[2] === undefined) return [start];
  const end = DAY_TOKENS[m[2]];
  const days = [];
  let d = start;
  while (true) {
    days.push(d);
    if (d === end) break;
    d = (d + 1) % 7;
    if (days.length > 7) break; // safety guard against malformed input
  }
  return days;
}

function parseTimeRange(token) {
  const m = token.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const startMin = Number(m[1]) * 60 + Number(m[2]);
  let endMin = Number(m[3]) * 60 + Number(m[4]);
  return { startMin, endMin };
}

/**
 * @param {string|null|undefined} raw the OSM `opening_hours` tag
 * @param {Date} [at] moment to check (defaults to now)
 * @returns {boolean|null} true/false if determinable, otherwise null (unknown)
 */
function isOpenNow(raw, at = new Date()) {
  if (!raw || typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (value === "24/7") return true;

  const day = at.getDay(); // 0=Sun..6=Sat
  const minutes = at.getHours() * 60 + at.getMinutes();

  const rules = value.split(";").map((r) => r.trim()).filter(Boolean);
  if (rules.length === 0) return null;

  let matched = null; // last matching rule wins (OSM semantics), tri-state

  for (const rule of rules) {
    if (/^off$/i.test(rule) || /\boff$/i.test(rule)) {
      // "Su off" style — only applies if the day part matches today
      const dayPart = rule.replace(/off$/i, "").trim();
      if (!dayPart) continue;
      const days = dayPart
        .split(",")
        .flatMap((t) => expandDayRange(t.trim()) || []);
      if (days.includes(day)) matched = false;
      continue;
    }

    const parts = rule.split(/\s+/);
    if (parts.length < 2) continue;
    const dayPart = parts[0];
    const timePart = parts.slice(1).join(" ");

    const days = dayPart.split(",").flatMap((t) => expandDayRange(t.trim()) || []);
    if (days.length === 0 || !days.includes(day)) continue;

    const ranges = timePart.split(",").map(parseTimeRange).filter(Boolean);
    if (ranges.length === 0) continue;

    const withinAny = ranges.some(({ startMin, endMin }) => {
      if (endMin >= startMin) return minutes >= startMin && minutes < endMin;
      // overnight range, e.g. 18:00-02:00
      return minutes >= startMin || minutes < endMin;
    });
    matched = withinAny;
  }

  return matched;
}

module.exports = { isOpenNow };
