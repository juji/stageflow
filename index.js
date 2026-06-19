#!/usr/bin/env node

import { execSync } from "child_process";
import { checkbox } from "@inquirer/prompts";
import pc from "picocolors";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

/* -------------------------
   git
------------------------- */

function getFiles() {
  const out = execSync("git status --porcelain -z", { encoding: "utf8" });
  if (!out) return [];

  return out.split("\0").filter(Boolean).map(v => v.trim());
}

function hasConflicts(files) {
  return files.some(line => 
    line.startsWith("U") ||
    line.startsWith("AA") ||
    line.startsWith("AU") ||
    line.startsWith("UA") ||
    line.startsWith("DD") ||
    line.startsWith("DU") ||
    line.startsWith("UD")
  );
}

/* -------------------------
   ui
------------------------- */

function banner() {
  console.clear();

  console.log("");
  console.log(pc.bold("STAGEFLOW"));
  console.log("");
}

function formatFile(line) {
  if (line.startsWith("??")) return pc.yellow(line);
  if (line.startsWith("A")) return pc.green(line);
  if (line.startsWith("M")) return pc.blue(line);
  if (line.startsWith("T")) return pc.blue(line);
  if (line.startsWith("D")) return pc.gray(line);
  if (line.startsWith("R")) return pc.magenta(line);
  if (line.startsWith("C")) return pc.cyan(line);
  if (line.startsWith("U")) return pc.red(line);
  return line;
}

/* -------------------------
   commit flow
------------------------- */

async function commitFlow() {
  const files = getFiles();

  if (hasConflicts(files)) {
    console.error(pc.red("ERROR: Merge conflict detected (U state)."));
    console.error(pc.red("Resolve conflicts before continuing."));
    process.exit(1);
  }

  if (!files.length) {
    console.log(pc.green("Working tree clean."));
    return;
  }

  console.log(pc.dim(`Files detected: ${files.length}`));
  console.log("");

  const selected = await checkbox({
    message: "Select files",
    choices: files.map(line => ({
      name: formatFile(line),
      value: line.split(" ").slice(1).join(" "),
      checked: true
    }))
  });

  if (!selected.length) {
    console.log(pc.yellow("Nothing selected."));
    return;
  }

  run("git reset");

  for (const file of selected) {
    console.log(pc.dim(`Staging: ${file}`));
    run(`git add "${file}"`);
  }

  console.log("");
  console.log(pc.green("Running aicommit2..."));
  console.log("");

  execSync("aicommit2", {
    stdio: "inherit"
  });
}

/* -------------------------
   main
------------------------- */

async function main() {
  banner();
  await commitFlow();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});