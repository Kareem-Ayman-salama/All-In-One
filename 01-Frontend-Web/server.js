import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "dist");
const port = process.env.PORT || 3000;
const rootPrefix = `${root}${path.sep}`;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

function securityHeaders(req) {
  const headers = {
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: blob:",
      "connect-src 'self' https: http://localhost:* http://127.0.0.1:*"
    ].join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  };
  if (req.headers["x-forwarded-proto"] === "https") {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

function send(req, res, status, body, type = "text/plain; charset=utf-8", extraHeaders = {}) {
  res.writeHead(status, {
    ...securityHeaders(req),
    "Content-Type": type,
    ...extraHeaders
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(body);
}

http
  .createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method || "GET")) {
      send(req, res, 405, "Method not allowed", undefined, { Allow: "GET, HEAD" });
      return;
    }

    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch {
      send(req, res, 400, "Bad request");
      return;
    }
    const requestPath = urlPath === "/" ? "landing/index.html" : urlPath.replace(/^\/+/, "");
    const resolved = path.resolve(root, requestPath);

    if (resolved !== root && !resolved.startsWith(rootPrefix)) {
      send(req, res, 403, "Forbidden");
      return;
    }

    const filePath = fs.existsSync(resolved) && fs.statSync(resolved).isFile()
      ? resolved
      : path.join(root, "index.html");

    fs.readFile(filePath, (error, data) => {
      if (error) {
        send(req, res, 404, "Not found");
        return;
      }
      const extension = path.extname(filePath);
      const cacheControl = filePath.includes(`${path.sep}assets${path.sep}`)
        ? "public, max-age=31536000, immutable"
        : extension === ".html"
          ? "no-cache"
          : "public, max-age=3600";
      send(req, res, 200, data, types[extension] || "application/octet-stream", {
        "Cache-Control": cacheControl
      });
    });
  })
  .listen(port, () => {
    console.log(`AIOFRONT React server is running on ${port}`);
  });
