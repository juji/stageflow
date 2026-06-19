#!/usr/bin/env node

import { execSync } from "child_process";
import { checkbox, select } from "@inquirer/prompts";
import pc from "picocolors";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

/* -------------------------
   ESC CANCEL GLOBAL
------------------------- */

process.stdin.setRawMode?.(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", (key) => {
  if (key === "\u001b") {
    console.log(pc.red("\nCancelled (ESC pressed)"));
    process.exit(0);
  }
});

/* -------------------------
   git state
------------------------- */

function getFiles() {
  const out = execSync("git status --porcelain -z", { encoding: "utf8" });
  if (!out) return [];
  return out.split("\0").filter(Boolean).map(s => s.trim());
}

function getStagedFiles() {
  const out = execSync("git diff --cached --name-only", { encoding: "utf8" }).trim();
  if (!out) return [];
  return out.split("\n").filter(Boolean);
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
  console.log(pc.dim("[ESC = cancel]"));
  console.log("");
}

function formatFile(line) {
  if (line.startsWith("??")) return pc.yellow(line);
  if (line.startsWith("A")) return pc.green(line);
  if (line.startsWith("M")) return pc.blue(line);
  if (line.startsWith("D")) return pc.red(line);
  if (line.startsWith("R")) return pc.magenta(line);
  if (line.startsWith("C")) return pc.cyan(line);
  if (line.startsWith("U")) return pc.red(line);
  return line;
}

/* -------------------------
   flow
------------------------- */

async function commitFlow() {
  const files = getFiles();

  if (hasConflicts(files)) {
    console.error(pc.red("ERROR: Merge conflict detected (U state)."));
    process.exit(1);
  }

  if (!files.length) {
    console.log(pc.green("Working tree clean."));
    return;
  }

  const staged = getStagedFiles();

  let selectableFiles = files;

  const getPath = (line) => line.split(" ").slice(1).join(" ").trim();

  if (staged.length > 0) {
    console.log(pc.yellow("Staged files detected:"));
    console.log("");

    staged.forEach(f => console.log(pc.cyan(`- ${f}`)));

    console.log("");

    const action = await select({
      message: "What do you want to do?",
      choices: [
        { name: "Exclude staged files", value: "continue_exclude" },
        { name: "Include staged files", value: "continue_include" },
        { name: "Reset staging area", value: "reset" }
      ]
    });

    if (action === "reset") {
      run("git reset");
      console.log(pc.red("Staging area cleared."));
    }

    if (action === "continue_exclude") {
      const stagedSet = new Set(staged);

      selectableFiles = files.filter(line => {
        const file = getPath(line);
        return !stagedSet.has(file);
      });
    }

    if (action === "continue_include") {
      selectableFiles = files;
    }
  }

  console.log(pc.dim(`Files detected: ${selectableFiles.length}`));
  console.log("");

  const selected = await checkbox({
    message: "Select files to stage",
    choices: selectableFiles.map(line => ({
      name: formatFile(line),
      value: getPath(line),
      checked: true
    }))
  });

  if (!selected.length) {
    console.log(pc.yellow("Nothing selected."));
    return;
  }

  for (const file of selected) {
    console.log(pc.dim(`Staging: ${file}`));
    run(`git add "${file}"`);
  }

  console.log("");
  console.log(pc.green("Running aicommit2..."));
  console.log("");

  execSync("aicommit2", { stdio: "inherit" });
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