// A standalone "backend" the Next app fetches — a *different* origin
// (localhost:4000), like the real app's control-tower backend. It streams a
// non-trivial JSON response so the response body is a real stream.
import http from "node:http";

const PORT = 4000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  let n = 0;
  const timer = setInterval(() => {
    if (n++ < 500) {
      res.write(JSON.stringify({ n, pad: "x".repeat(1024) }) + "\n");
    } else {
      clearInterval(timer);
      res.end();
    }
  }, 1);
  req.on("close", () => clearInterval(timer));
});

server.listen(PORT, () => console.log(`stream server listening on :${PORT}`));
