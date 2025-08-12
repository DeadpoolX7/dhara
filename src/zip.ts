import archiver from "archiver";
import fs from "fs";
import path from "path";
import os from "os";

export async function zipFiles(paths: string[]): Promise<string> {
  const tmpZip = path.join(os.tmpdir(), `dhara-${Date.now()}.zip`);
  const output = fs.createWriteStream(tmpZip);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => resolve(tmpZip));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    for (const p of paths) {
      const stats = fs.statSync(p);
      if (stats.isDirectory()) {
        // Add entire directory (recursively)
        archive.directory(p, path.basename(p));
      } else {
        archive.file(p, { name: path.basename(p) });
      }
    }

    archive.finalize();
  });
}
