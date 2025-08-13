import { createReadStream, statSync, mkdirSync, writeFileSync } from "fs";
import { networkInterfaces } from "os";
import readline from "readline";
import QRCode from "qrcode-terminal";
import { SingleBar, Presets } from "cli-progress";
import crypto from "crypto";
import path from "path";

export async function startServer(filePath: string) {
  const fileSize = statSync(filePath).size;
  const fileName = filePath.split("/").pop() || "file";
  const ip = getLocalIP();
  const port = 3000;
  const token = crypto.randomBytes(4).toString("hex"); // secure short token
  const url = `http://${ip}:${port}/download/${token}`;

  QRCode.generate(url, { small: true });
  console.log(`📂 Sharing: ${fileName}`);
  console.log(`🌐 URL: ${url}`);

  let downloadStarted = false;

  const progressBar = new SingleBar({}, Presets.shades_classic);

  
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display shutdown instructions after server starts
function promptForShutdown() {
  console.log("\nℹ️  Press Ctrl+C or type 'exit' to shut down the server.");
  rl.on("line", (input) => {
    if (input.trim().toLowerCase() === "exit") {
      console.log("🛑 Shutting down server...");
      server.stop();
      rl.close();
    }
  });
}

 const server = Bun.serve({
  port,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === `/download/${token}`) {
      if (downloadStarted) {
        return new Response("This link has expired.", { status: 403 });
      }
      downloadStarted = true;

      progressBar.start(fileSize, 0);

      const fileStream = createReadStream(filePath);
      let bytesSent = 0;

      const progressStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => {
            bytesSent += chunk.length;
            progressBar.update(bytesSent);
            controller.enqueue(chunk);
          });
          fileStream.on("end", () => {
            progressBar.stop();
            controller.close();
            console.log("\n✅ Transfer complete.");
            console.log("ℹ️  Type 'exit' or press Ctrl+C to stop the server.");
          });
          fileStream.on("error", (err) => controller.error(err));
        }
      });

      return new Response(progressStream, {
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": "application/octet-stream",
          "Content-Length": fileSize.toString(),
        },
      });
    }
    return new Response("File not found", { status: 404 });
  }
});
promptForShutdown();
}

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}


export async function startReceiver(sessionId: string) {
  const ip = getLocalIP();
  const port = 3000;
  const uploadDir = path.join(process.cwd(), `dhara_uploads_${Date.now()}`);
  mkdirSync(uploadDir, { recursive: true });

  const uploadUrl = `http://${ip}:${port}/upload/${sessionId}`;
  QRCode.generate(uploadUrl, { small: true });
  console.log(`📥 Receiving files at: ${uploadUrl}`);
  console.log(`📂 Saving to: ${uploadDir}`);
  console.log(`\nℹ️  Press Ctrl+C or type 'exit' to shut down the server.`);

  // manual shutdown via "exit" or Ctrl+C
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const server = Bun.serve({
    port,
    async fetch(req) {
      const { pathname } = new URL(req.url);

      if (pathname === `/upload/${sessionId}` && req.method === "GET") {
        const htmlPath = path.join(__dirname, "../public/upload.html");
        return new Response(await Bun.file(htmlPath).text(), {
          headers: { "Content-Type": "text/html" }
        });
      }

      if (pathname === `/upload/${sessionId}` && req.method === "POST") {
        try {
          const formData = await req.formData();
          let count = 0;

          for (const [, file] of formData) {
            if (file instanceof File) {
              const savePath = path.join(uploadDir, file.name);
              await Bun.write(savePath, file); // streams to disk in Bun
              count++;
              console.log(`✅ Received: ${file.name} (${file.size} bytes)`);
            }
          }

          console.log(`🎯 ${count} file(s) received. Keep this window open to receive more.`);
          console.log(`ℹ️  Type 'exit' or press Ctrl+C to stop the server.`);
          return new Response("OK");
        } catch (e) {
          console.error("❌ Upload error:", e);
          return new Response("Upload failed", { status: 500 });
        }
      }

      return new Response("Not Found", { status: 404 });
    }
  });

  rl.on("line", (input) => {
    if (input.trim().toLowerCase() === "exit") {
      console.log("🛑 Shutting down server...");
      server.stop();
      rl.close();
    }
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down server (Ctrl+C)...");
    try { server.stop(); } catch {}
    rl.close();
    process.exit(0);
  });
}
