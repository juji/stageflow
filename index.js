#!/usr/bin/env node

import { execSync } from "child_process";
import { checkbox } from "@inquirer/prompts";
import pc from "picocolors";

/* -------------------------
   utils
------------------------- */

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

/* -------------------------
   git state
------------------------- */

function getFiles() {
  const out = run("git status --porcelain");
  if (!out) return [];

  return out.split("\n").map(line => ({
    status: line.slice(0, 2),
    file: line.slice(3)
  }));
}

/* -------------------------
   banner (NO STYLE, NO LINES, NO BOX)
------------------------- */

function banner(filesCount) {
  console.clear();

  console.log(pc.cyan("STAGEFLOW"));
  console.log();
  console.log(`${filesCount} files detected`);
  console.log();
}

/* -------------------------
   file formatting
------------------------- */

function formatFile(f) {
  if (f.status.startsWith("??")) return `+ ${f.file}`;
  if (f.status.includes("M")) return `~ ${f.file}`;
  if (f.status.includes("D")) return `- ${f.file}`;
  return `  ${f.file}`;
}

/* -------------------------
   main flow
------------------------- */

async function main() {
  const files = getFiles();

  banner(files.length);

  if (!files.length) {
    console.log("No changes.");
    return;
  }

  const selected = await checkbox({
    message: "Select files",
    choices: files.map(f => ({
      name: formatFile(f),
      value: f.file,
      checked: true
    }))
  });

  if (!selected.length) {
    console.log("Nothing selected.");
    return;
  }

  console.log();

  for (const file of selected) {
    run(`git add "${file}"`);
  }

  console.log("files staged");
  console.log();

  console.log("run aicommit2...");
  execSync("aicommit2", { stdio: "inherit" });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});