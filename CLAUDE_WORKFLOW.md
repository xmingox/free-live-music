# Claude Workflow Guide — Token Efficiency

---

## Model Choice

### For Most Tasks: **Claude Haiku 4.5** ✅
- **Use case:** Bug fixes, small features, code review, documentation
- **Speed:** 2-5s responses
- **Cost:** ~1/5 of Sonnet
- **Quality:** Excellent for focused tasks

### When to Upgrade: **Claude Sonnet 4.5**
- Complex architecture decisions (multi-file refactors)
- Debugging intricate issues (3+ files involved)
- Large feature builds (>500 lines of code)
- Analyzing performance bottlenecks

### **Never use Claude Opus** (unless system-critical refactoring)

---

## Before Asking Claude Anything

### 1. **Attach Minimal Context**
Instead of: "Here's my whole project"  
Do this:
```
- Link to the relevant file(s) only
- Paste 20-50 lines of code (not 1000)
- Say "See PROJECT_README.md for architecture"
```

### 2. **Use the Quick Reference Files**
- `PROJECT_README.md` — Share this first
- `DETAILED_NOTES.md` — For deep dives
- Specific file paths — for debugging

### 3. **State Your Intent Clearly**
**Bad:** "This doesn't work"  
**Good:** "Moderation dashboard isn't displaying pending submissions. The API returns 200 but no UI updates. Check `app/api/moderation/get-submissions/route.ts`"

---

## Common Workflows

### A. Debugging a Bug

```
1. Share PROJECT_README.md + the specific file
2. Describe exact error (screenshot/console logs)
3. State what you expect vs. what happens
4. Ask for: "What's the likely cause?" (not full fix)
5. Review the answer, then ask follow-ups as needed
```

**Token saved:** Only asking for root cause, not full refactor

---

### B. Adding a Small Feature

```
1. Share PROJECT_README.md + key files (max 2-3)
2. State: "I want to add X to Y file"
3. Paste the current code (~30-50 lines)
4. Ask: "How do I integrate this?" (not "write the whole thing")
5. Apply the change yourself, ask for review next turn
```

**Token saved:** Iterating in small steps vs. mega-prompts

---

### C. Code Review / Refactoring

```
1. Paste the code (up to 100 lines)
2. Ask: "Any improvements?" or "Will this work?"
3. If given a suggestion, apply it yourself
4. Share the updated code for feedback next turn
```

**Token saved:** Batching review feedback instead of back-and-forth

---

### D. Understanding Architecture

```
1. Ask: "Walk me through what happens when a user approves an event"
2. Claude references PROJECT_README.md (no file pasting needed)
3. Get a concise flow diagram
4. Ask follow-up: "Where does city mapping happen?"
```

**Token saved:** Using summaries instead of raw code

---

## Terminal Workflow (Claude Code Alternative)

If you need **fast, repeated** iterations on the same files:

### Use Claude Code (Terminal)
```bash
# Install Claude Code CLI (if not already)
# https://github.com/anthropics/claude-code

claude-code --project /Users/b/free-live-music
```

**Benefits:**
- File system access (no copy/paste)
- Auto-saves changes
- Faster for iterative work
- Cheaper than full chat context

**Use when:** Refactoring 3+ files or multiple tests

---

## Access to Give Claude

### ✅ DO Share These
- GitHub repo link (public)
- File paths (relative or absolute)
- Error messages + stack traces
- `PROJECT_README.md` + `DETAILED_NOTES.md`
- Code snippets (max 100 lines per prompt)
- DB schema (from `supabase/schema.sql`)

### ❌ DO NOT Share These
- `.env` files or API keys
- Supabase service keys
- Moderation password (reference as `env: NEXT_PUBLIC_MODERATION_PASSWORD`)
- Personal user data from production DB

### ✅ Safe to Reference
- "See NEXT_PUBLIC_MODERATION_PASSWORD in env"
- "Check Supabase config in lib/supabase.ts" (without secrets)
- "Look at app/api/moderation/approve/route.ts" (code is fine)

---

## Prompt Template for This Project

Save this and reuse for faster Claude calls:

```
**Context:** Free Live Music (Next.js + Supabase)
**Relevant Docs:** See PROJECT_README.md + DETAILED_NOTES.md
**File in Question:** [path/to/file.ts]
**What I'm trying to do:** [1-2 sentences]
**Current behavior:** [what happens]
**Expected behavior:** [what should happen]
**Error (if any):** [error message or screenshot]

**Question:** [specific ask - "What's wrong?" vs "How do I fix?" vs "Review this"]
```

---

## Example: "Minimal Token" Bug Report

```
**File:** app/moderation/page.tsx
**Issue:** Pending submissions list empty even though DB has 3 pending items

GET /api/moderation/get-submissions returns:
{
  "submissions": [],
  "status": 200
}

**Question:** Why is the API returning an empty array?
```

**vs. Bad Version:**
```
"The moderation page doesn't work. Here's my entire project. Fix it."
[pastes 5000 lines of code]
```

---

## Token Budget Tips

| Action | Token Cost | Better Alternative |
|--------|-----------|-------------------|
| Paste entire file | 500+ | Paste 30-50 line snippet + ask specific Q |
| "Review my code" (no context) | 300 | "I need to add X. Does this approach work?" |
| Full architecture deep-dive | 1000+ | "Walk me through city code mapping (see DETAILED_NOTES.md)" |
| Copy/paste raw console output | 200 | Summarize: "Getting 404 on POST /api/submit-event" |
| Multiple unrelated questions | 400 | Ask them one at a time across chats |

---

## Reusing Past Sessions

### Before Starting a New Chat
1. Open `PROJECT_README.md` in a separate window
2. Have `DETAILED_NOTES.md` ready
3. Know which file you'll edit (1-2 files max per chat)
4. Have a specific goal (not "let's work on the project")

### Searching Past Chats
Use Claude's "Search chats" feature:
- Search: "moderation dashboard"
- Search: "city mapping"
- Search: "ISR"

This finds previous solutions without re-explaining context.

---

## Checklist Before Asking Claude

- [ ] Have I read PROJECT_README.md?
- [ ] Have I identified the specific file(s)?
- [ ] Can I describe the issue in 1-2 sentences?
- [ ] Do I have a specific question (not "fix this")?
- [ ] Have I checked recent chats for similar issues?
- [ ] Am I using the right model (Haiku for small tasks)?
- [ ] Have I avoided sharing secrets or env keys?

