#!/usr/bin/env node
// ui-moods serve — minimal local gallery.
// Sources: moods.json (index) + moods/<id>/specimen.html + tokens.json.
// No build step, no external dependencies.

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
};

function resolveFile(pathname) {
  if (pathname === "/") pathname = "/index.html";
  let filePath;
  if (pathname === "/index.html") {
    filePath = join(root, "tools", "index.html");
  } else if (pathname === "/gallery.html") {
    filePath = join(root, "tools", "gallery.html");
  } else if (pathname === "/moods.json") {
    filePath = join(root, "moods.json");
  } else if (pathname === "/apps.json") {
    filePath = join(root, "apps.json");
  } else if (pathname.startsWith("/moods/") || pathname.startsWith("/apps/")) {
    filePath = join(root, pathname);
  } else {
    return null;
  }
  const resolved = normalize(filePath);
  const rootResolved = normalize(root);
  if (!resolved.startsWith(rootResolved)) return null;
  return resolved;
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const filePath = resolveFile(pathname);

  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }

  const data = readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[extname(filePath)] || "application/octet-stream",
  });
  res.end(data);
}).listen(port, () => {
  console.log(`ui-moods gallery: http://localhost:${port}`);
});
