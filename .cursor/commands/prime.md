---
description: Load project context — structure, docs, key files, and current git state
---

# Prime: Load Project Context

## Objective
Build a working understanding of this codebase by analyzing structure, docs, and key files.

## Process

### 1. Project Structure
```bash
git ls-files 2>/dev/null || ls -la
```

### 2. Read Core Files
- `README.md`, `AGENTS.md`
- `.cursor/rules/` and `.cursor/commands/`
- Entry points: `src/main.ts`, `index.html`
- Config: `package.json`, `tsconfig.json`, `vite.config.ts`

### 3. Current State (if git repo)
```bash
git log -10 --oneline
git status
```

## Output Report
Concise, scannable summary:

### Project Overview
- Purpose, type of app, primary tech

### Architecture
- Structure, key patterns, important files

### Tech Stack
- Languages, frameworks, build/test tools

### Current State
- Active branch, recent focus, immediate observations
