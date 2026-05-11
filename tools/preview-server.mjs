import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".mp3", "audio/mpeg"],
  [".ls", "application/json; charset=utf-8"],
  [".lh", "application/json; charset=utf-8"],
  [".lmat", "application/json; charset=utf-8"],
  [".lm", "application/octet-stream"],
  [".lani", "application/json; charset=utf-8"],
  [".controller", "application/json; charset=utf-8"],
]);

function resolveRequestPath(url) {
  const requestUrl = new URL(url || "/", `http://${host}:${port}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(root, safePath === "/" ? "preview.html" : safePath));
  return filePath.startsWith(root) ? filePath : null;
}

const server = createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);
  console.log(`${request.method} ${request.url}`);
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Preview: http://${host}:${port}/preview.html`);
});
