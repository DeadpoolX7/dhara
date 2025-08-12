import { createReadStream, statSync, mkdirSync, writeFileSync } from "fs";
import { networkInterfaces } from "os";
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
              setTimeout(() => {
                console.log("\n✅ Transfer complete. Shutting down server...");
                server.stop();
              }, 1000);
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
  mkdirSync(uploadDir);

  const uploadUrl = `http://${ip}:${port}/upload/${sessionId}`;
  QRCode.generate(uploadUrl, { small: true });
  console.log(`📥 Receiving files at: ${uploadUrl}`);
  console.log(`📂 Saving to: ${uploadDir}`);

  const server = Bun.serve({
    port,
    async fetch(req) {
      const { pathname } = new URL(req.url);

      if (pathname === `/upload/${sessionId}` && req.method === "GET") {
        return new Response(await Bun.file(path.join(__dirname, "../public/upload.html")).text(), {
          headers: { "Content-Type": "text/html" }
        });
      }

      if (pathname === `/upload/${sessionId}` && req.method === "POST") {
        const formData = await req.formData();
        for (const [_, file] of formData) {
          if (file instanceof File) {
            const savePath = path.join(uploadDir, file.name);
            await Bun.write(savePath, file);
            console.log(`✅ Received: ${file.name} (${file.size} bytes)`);
          }
        }
        console.log("🎯 All files received. Shutting down...");
        setTimeout(() => server.stop(), 1000);
        return new Response("OK");
      }

      return new Response("Not Found", { status: 404 });
    }
  });
}
