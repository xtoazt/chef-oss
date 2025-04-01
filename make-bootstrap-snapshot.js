import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec as execCallback } from "child_process";
import { snapshot } from "@webcontainer/snapshot";
import { promisify } from "util";
import * as lz4 from "lz4-wasm-nodejs";

const exec = promisify(execCallback);

async function main() {
  const inputDir = "template";
  const absoluteInputDir = path.resolve(inputDir);
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "webcontainer-snapshot-")
  );
  console.log("Temp directory:", tempDir);
  console.log("Using git to list unignored files...");
  const files = await getUnignoredGitFiles(absoluteInputDir);
  console.log(`Copying ${files.length} files to temp directory...`);
  await copyFilesToTemp(files, absoluteInputDir, tempDir);
  console.log("Creating snapshot...");
  const buffer = await snapshot(tempDir);
  const compressed = lz4.compress(buffer);
  console.log(`Writing snapshot (${compressed.length} bytes) to file...`);
  await fs.writeFile("public/bootstrap-snapshot.bin", compressed);
  console.log("Done!");
}

async function getUnignoredGitFiles(dir) {
  try {
    const { stdout } = await exec("git ls-files", {
      cwd: dir,
      encoding: "utf8",
    });
    if (!stdout) {
      throw new Error("No output from git ls-files");
    }
    return stdout
      .trim()
      .split("\n")
      .filter((file) => file.length > 0);
  } catch (error) {
    console.error("Error using git to list files", error);
    process.exit(1);
  }
}

async function copyFilesToTemp(files, sourceDir, targetDir) {
  for (const file of files) {
    console.log("Copying", file);
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    // Create parent directories if they don't exist
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Copy the file
    await fs.copyFile(sourcePath, targetPath);
  }
}

main();
