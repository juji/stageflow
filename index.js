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
  const out = run("git status --porcelain");

  if (!out) return [];

  return out.split("\n").map(line => line.trim());
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
  if (line.startsWith("??")) {
    return pc.yellow(line);
  }

  if (line.startsWith("A")) {
    return pc.green(line);
  }

  if (line.startsWith("M")) {
    return pc.blue(line);
  }

  if (line.startsWith("D")) {
    return pc.red(line);
  }

  return line;
}

/* -------------------------
   commit flow
------------------------- */

async function commitFlow() {
  const files = getFiles();

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
  console.log(selected)

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