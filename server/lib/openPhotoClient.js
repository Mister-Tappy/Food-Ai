const dns = require("node:dns").promises;
const net = require("node:net");

const MAX_HTML_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

function isPrivateIp(address) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (net.isIPv4(normalized)) {
    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

function normaliseWebsite(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function assertPublicWebUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported URL protocol.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateIp(hostname)
  ) {
    throw new Error("Private network URLs are not allowed.");
  }

  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Website did not resolve to a public address.");
  }
  return url;
}

async function fetchPublicHtml(initialUrl) {
  let url = await assertPublicWebUrl(initialUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "FoodieAI/2.0 restaurant-photo-preview",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) return null;
      url = await assertPublicWebUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder();
    let html = "";
    let received = 0;
    const bodyTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      while (received < MAX_HTML_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
      }
    } finally {
      clearTimeout(bodyTimer);
      await reader.cancel().catch(() => {});
    }
    return { html, finalUrl: url };
  }

  return null;
}

function decodeHtmlAttribute(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim();
}

function imageFromHtml(html, pageUrl) {
  const candidates = new Map();
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];

  for (const tag of metaTags) {
    const attributes = {};
    const attributePattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/g;
    for (const match of tag.matchAll(attributePattern)) {
      attributes[match[1].toLowerCase()] = decodeHtmlAttribute(match[3]);
    }
    const key = (attributes.property || attributes.name || "").toLowerCase();
    if (attributes.content) candidates.set(key, attributes.content);
  }

  const raw =
    candidates.get("og:image:secure_url") ||
    candidates.get("og:image") ||
    candidates.get("twitter:image") ||
    candidates.get("twitter:image:src");
  if (raw && !raw.startsWith("data:")) {
    try {
      return new URL(raw, pageUrl).toString();
    } catch {
      // Continue to official page images when social metadata is malformed.
    }
  }

  const pageImages = [];
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imageTags) {
    const attributes = {};
    const attributePattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/g;
    for (const match of tag.matchAll(attributePattern)) {
      attributes[match[1].toLowerCase()] = decodeHtmlAttribute(match[3]);
    }

    const src = attributes.src || attributes["data-src"] || attributes["data-lazy-src"];
    if (!src || src.startsWith("data:")) continue;
    const description = [
      src,
      attributes.alt,
      attributes.class,
      attributes.id,
      attributes.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (/(?:logo|icon|sprite|avatar|favicon|badge|tracking|pixel)/.test(description)) continue;

    const width = Number.parseInt(attributes.width || "", 10);
    const height = Number.parseInt(attributes.height || "", 10);
    const urlDimensions = src.match(/(?:^|[/,_-])w[_-]?(\d+).*?h[_-]?(\d+)/i);
    const urlWidth = Number.parseInt(urlDimensions?.[1] || "", 10);
    const urlHeight = Number.parseInt(urlDimensions?.[2] || "", 10);
    if ((Number.isFinite(width) && width < 240) || (Number.isFinite(height) && height < 160)) {
      continue;
    }
    if (
      (Number.isFinite(urlWidth) && urlWidth < 240) ||
      (Number.isFinite(urlHeight) && urlHeight < 160)
    ) {
      continue;
    }

    try {
      pageImages.push({
        url: new URL(src, pageUrl).toString(),
        priority: /(?:store|restaurant|venue|branch|exterior|interior|hero|cover|gallery)/.test(
          description
        )
          ? 1
          : 0,
      });
    } catch {
      // Ignore malformed image URLs from the venue page.
    }
  }

  return pageImages.sort((a, b) => b.priority - a.priority)[0]?.url || null;
}

async function wikidataPhoto(wikidataId) {
  if (!/^Q\d+$/.test(wikidataId || "")) return null;
  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
  const response = await fetch(entityUrl, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "application/json", "User-Agent": "FoodieAI/2.0 restaurant-photo-preview" },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const filename = data?.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!filename) return null;

  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(
      filename.replace(/ /g, "_")
    )}`,
    label: "Wikimedia Commons",
  };
}

async function websitePhoto(website) {
  const normalized = normaliseWebsite(website);
  if (!normalized) return null;
  const page = await fetchPublicHtml(normalized);
  if (!page) return null;

  const imageUrl = imageFromHtml(page.html, page.finalUrl);
  if (!imageUrl) return null;
  const publicImageUrl = await assertPublicWebUrl(imageUrl);

  return {
    url: publicImageUrl.toString(),
    sourceUrl: page.finalUrl.toString(),
    label: "Official website photo",
  };
}

async function resolveOpenPhoto({ website, wikidataId }) {
  if (wikidataId) {
    try {
      const photo = await wikidataPhoto(wikidataId);
      if (photo) return photo;
    } catch {
      // A missing or temporarily unavailable public record is simply no photo.
    }
  }

  if (website) {
    try {
      return await websitePhoto(website);
    } catch {
      // Venue websites are often unavailable or block automated previews.
    }
  }
  return null;
}

module.exports = { resolveOpenPhoto };
