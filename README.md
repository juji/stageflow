# StageFlow

StageFlow is a fast, interactive Git staging CLI that lets you safely select changes before committing, with a strict safety guard against merge conflicts.

---

## 🚨 Core Principle

> If Git is in a broken merge state, StageFlow refuses to run.

If any **unmerged paths (`U`)** exist:

- The tool immediately exits
- No staging is allowed
- No commits are allowed

This prevents accidental commits during conflict states.

---

## ⚙️ What it does

StageFlow:

- Reads `git status --porcelain -z`
- Parses file changes safely using NUL separation
- Displays an interactive checklist
- Lets you select files to stage
- Runs `git reset` + `git add`
- Executes `aicommit2`

---

## ❌ Conflict Protection

StageFlow blocks execution if any of the following are detected:

- `U` (unmerged / conflict state)
- `AA` (both added)
- `AU` / `UA` (add/merge conflict)
- `DD`
- `DU` / `UD`

### Error output

```
ERROR: Merge conflict detected (U state)
Resolve conflicts before continuing
```

Exit code: `1`

---

## 📦 Installation

```bash
npm install -g stageflow
```

Or run locally:

```bash
node stageflow.js
```

---

## 🚀 Usage

```bash
stageflow
```

Flow:

1. Scan Git changes
2. Abort if conflicts exist
3. Show interactive selection UI
4. Stage selected files
5. Run `aicommit2`

---

## 🧠 Supported Git States

| Code | Meaning |
|------|--------|
| M | Modified |
| A | Added |
| D | Deleted |
| R | Renamed |
| C | Copied |
| T | Type changed |
| ?? | Untracked |
| U | Unmerged (BLOCKS EXECUTION) |

---

## 🛠 Workflow

```
git status --porcelain -z
        ↓
parse NUL-separated entries
        ↓
check conflict states (U / merge conflicts)
        ↓
if safe → open selection UI
        ↓
git reset
        ↓
git add <selected files>
        ↓
aicommit2
```

---

## 🧩 Design Goals

- Safe by default
- No commits in broken Git states
- Minimal user friction
- Explicit control over staging
- Machine-safe parsing (`-z` format)

---

## ⚡ Why `-z` format

StageFlow uses:

```bash
git status --porcelain -z
```

Because:

- filenames can contain spaces
- output becomes NUL-delimited
- avoids parsing ambiguity
- safer than line-based parsing

---

## 🔒 Safety Rule

> Never proceed if repository state is ambiguous or conflicted.

---

## 📄 License

MIT