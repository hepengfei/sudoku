import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = normalize(join(root, relativePath));
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) throw new Error("Not a file");
    const etag = `W/"${stats.size}-${Math.trunc(stats.mtimeMs)}"`;
    const headers = {
      "Content-Type": types[extname(filePath)] ?? "application/octet-stream",
      ETag: etag,
    };
    if (relativePath.startsWith("src/domain/puzzle-data/")) {
      headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400";
    }
    if (request.headers["if-none-match"] === etag) {
      response.writeHead(304, headers).end();
      return;
    }
    response.writeHead(200, headers);
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, host, () => {
  console.log(`数独本已启动：http://${host}:${port}`);
});
