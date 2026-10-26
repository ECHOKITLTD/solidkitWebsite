#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const htmlFiles = [
  "index.html",
  "case-studies.html",
  "countr/countr.html",
  "countr/fone.html",
  "countr/frame.html",
  "countr/komo.html",
  "countr/mesh.html",
  "solidwall/solidwall.html",
];

const mirroredExtensions = /\.(?:gif|jpe?g|png|webp|svg|pdf|mp4|webm|otf|ttf|woff2?|eot)$/i;
const urlPattern = /https?:\/\/[^"'<>\s)]+/g;
const browserHeaders = {
  Accept: "*/*",
  Referer: "https://www.solidkit.co.uk/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

const fallbackUrls = new Map([
  [
    "https://lirp.cdn-website.com/19ecbe2b/dms3rep/multi/opt/Flo_osb.37-1920w.png",
    "https://irp.cdn-website.com/19ecbe2b/dms3rep/multi/Flo_osb.37.png",
  ],
  [
    "https://lirp.cdn-website.com/19ecbe2b/dms3rep/multi/opt/Flo_shorter_concretel.35-1920w.png",
    "https://irp.cdn-website.com/19ecbe2b/dms3rep/multi/Flo_shorter_concretel.35.png",
  ],
]);

// This was a generic Duda theme background. A later rule already disables it,
// and the object no longer exists, so it should not be mirrored.
const obsoleteUrls = new Set([
  "https://irt-cdn.multiscreensite.com/ce0bb35f932b47bb809d0e37905542ba/dms3rep/multi/site_background_education-2087x1173.jpg",
]);

// Duda's responsive image loader derives these URLs at runtime, so they do not
// appear literally in the exported HTML.
const derivedAssetUrls = ["komo", "mesh", "countr", "fone", "frame", "screen"].map(
  (name) =>
    `https://lirp.cdn-website.com/19ecbe2b/dms3rep/multi/opt/${name}-2400w.jpg`,
);

function destinationFor(sourceUrl) {
  const url = new URL(sourceUrl);
  const decodedPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  return path.join(root, "assets", "content", url.hostname, decodedPath);
}

async function download(sourceUrl) {
  const requestUrl = fallbackUrls.get(sourceUrl) ?? sourceUrl;
  const destination = destinationFor(sourceUrl);
  const response = await fetch(requestUrl, { headers: browserHeaders, redirect: "follow" });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${requestUrl}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return { sourceUrl, requestUrl, destination };
}

const documents = new Map();
const sourceUrls = new Set(derivedAssetUrls);

for (const relativeFile of htmlFiles) {
  const absoluteFile = path.join(root, relativeFile);
  const source = await readFile(absoluteFile, "utf8");
  documents.set(relativeFile, source);

  for (const rawUrl of source.match(urlPattern) ?? []) {
    const sourceUrl = rawUrl.replaceAll("&amp;", "&");
    const pathname = new URL(sourceUrl).pathname;
    if (mirroredExtensions.test(pathname) && !obsoleteUrls.has(sourceUrl)) {
      sourceUrls.add(sourceUrl);
    }
  }
}

const queue = [...sourceUrls];
const completed = [];
const failures = [];

async function worker() {
  while (queue.length > 0) {
    const sourceUrl = queue.shift();
    try {
      completed.push(await download(sourceUrl));
      process.stdout.write(".");
    } catch (error) {
      failures.push({ sourceUrl, error: error.message });
      process.stdout.write("x");
    }
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
process.stdout.write("\n");

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`${failure.sourceUrl}\n  ${failure.error}`);
  }
  throw new Error(`Could not mirror ${failures.length} content asset(s).`);
}

for (const [relativeFile, originalSource] of documents) {
  let source = originalSource;
  const htmlDirectory = path.dirname(path.join(root, relativeFile));

  for (const { sourceUrl, destination } of completed) {
    const localUrl = path.relative(htmlDirectory, destination).split(path.sep).join("/");
    source = source.replaceAll(sourceUrl, localUrl);
    source = source.replaceAll(sourceUrl.replaceAll("&", "&amp;"), localUrl);
  }

  await writeFile(path.join(root, relativeFile), source);
}

let previousManifest = [];
try {
  previousManifest = JSON.parse(
    await readFile(path.join(root, "assets", "content-manifest.json"), "utf8"),
  );
} catch (_) {
  // The first run has no previous manifest.
}

const manifestBySource = new Map(previousManifest.map((item) => [item.source, item]));
for (const { sourceUrl, requestUrl, destination } of completed) {
  manifestBySource.set(sourceUrl, {
    source: sourceUrl,
    fetchedFrom: requestUrl,
    local: path.relative(root, destination).split(path.sep).join("/"),
  });
}
const manifest = [...manifestBySource.values()].sort((a, b) =>
  a.source.localeCompare(b.source),
);

await mkdir(path.join(root, "assets"), { recursive: true });
await writeFile(
  path.join(root, "assets", "content-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Mirrored ${completed.length} assets and updated ${htmlFiles.length} HTML files.`);
