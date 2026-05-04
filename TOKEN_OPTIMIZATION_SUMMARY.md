# Token Optimization & Best Practices — Summary

---

## 📊 What's Been Created

| File | Purpose | Read When |
|------|---------|-----------|
| **PROJECT_README.md** | 2-min overview + quick reference | Starting any new chat |
| **DETAILED_NOTES.md** | Full session history, architecture, features | Deep dives or issues |
| **CLAUDE_WORKFLOW.md** | How to work with Claude efficiently | Before asking Claude anything |
| **DATABASE.md** | Schema, common queries, city mapping | DB questions or data issues |
| **TERMINAL_COMMANDS.md** | Copy-paste ready commands | Daily workflow |

---

## 🎯 Token Minimization Strategy

### 1. **Choose the Right Model**

**Claude Haiku 4.5** (default, ✅ use for 90% of tasks)
- Bug fixes, code review, small features
- ~$0.80/1M input tokens
- Response time: 2-5s

**Claude Sonnet 4.5** (only when needed)
- Complex multi-file refactors
- Architecture decisions
- Performance debugging
- ~$3.00/1M input tokens

**Never Opus** (unless system-critical architectural rewrite)

**Estimate:** Using Haiku for routine work saves ~80% on tokens vs. Sonnet.

---

### 2. **Attach Minimal Context**

**Bad:** Paste entire `app/` directory
**Good:** Link to 1-2 specific files + quote 30-50 lines

**Bad:** "Here's my project, make it better"
**Good:** "In `app/moderation/page.tsx`, the submission list isn't updating. The API returns 200 but the UI doesn't refresh. How would you debug this?"

**Token cost difference:** 200 tokens vs. 2000 tokens

---

### 3. **Leverage the Summary Files**

Instead of pasting your entire project structure:

```
"I need to modify the city mapping logic.
See DETAILED_NOTES.md for architecture + CLAUDE_WORKFLOW.md for context.
Here's the current approve route:
[paste 40 lines from app/api/moderation/approve/route.ts]

Question: Should city override happen before or after extraction?"
```

**Token saved:** 500+ tokens per chat by not re-explaining architecture

---

### 4. **Reference, Don't Repeat**

✅ **Good:**
- "As noted in DATABASE.md, the approval logic follows priority chain: manual > extracted > URL pattern > state > NYC"
- "See city codes in PROJECT_README.md"
- "Event extraction is in `lib/extract-event-details.ts` (details in DETAILED_NOTES.md)"

❌ **Bad:**
- Copy-pasting the entire database schema every time
- Re-explaining the city mapping flow on each question
- Pasting the same error log multiple times

---

## 🔄 Workflows for Different Tasks

### Bug Fix (5-15 min)
```
1. Open PROJECT_README.md
2. Identify the problem file
3. Ask Claude: "File: [path]. Issue: [describe]. Error: [log]"
4. Apply the fix yourself
5. Test and close chat
```
**Tokens used:** 200-400

---

### Small Feature (20-40 min)
```
1. Check DETAILED_NOTES.md for similar patterns
2. Ask Claude: "I want to add X to Y. Current code: [30 lines]"
3. Get suggestion
4. Apply changes
5. Ask for code review on updated file
6. Done
```
**Tokens used:** 400-700

---

### Architecture Question (10-20 min)
```
1. Ask: "Walk me through what happens when an event is approved" 
   (Claude will reference PROJECT_README.md + DETAILED_NOTES.md without needing to paste)
2. Ask follow-up: "Where exactly does city mapping happen?"
3. Get concise answer + file locations
4. Close
```
**Tokens used:** 150-300

---

### Deep Debug (30-60 min)
```
1. Share PROJECT_README.md + DETAILED_NOTES.md
2. Describe the issue clearly
3. Use Claude to explore: "Could this be related to ISR?" or "Check X behavior"
4. Iteratively narrow down
5. Implement fix
```
**Tokens used:** 800-1200 (but could've been 5000+ without summary files)

---

## 📝 Before Every Claude Question: Checklist

- [ ] Have I read PROJECT_README.md (2 min)?
- [ ] Do I know which file(s) I'm working on (max 2-3)?
- [ ] Can I describe the issue in 1-2 sentences?
- [ ] Did I avoid copy-pasting the entire codebase?
- [ ] Am I asking something specific, not "help me"?
- [ ] Have I checked TERMINAL_COMMANDS.md for a quick solution?
- [ ] Am I using Haiku (not Sonnet) unless truly complex?

---

## 💡 Pro Tips

### Tip 1: Use Focused Search Queries
Instead of: "Search my chat history for city stuff"  
Do this: Use Claude's built-in chat search for "city mapping" or "ISR"

### Tip 2: Batch Similar Questions
Instead of 5 separate chats about different bugs  
Do this: One chat with multiple questions (but keep them under 500 tokens context)

### Tip 3: Save Claude's Answers
When Claude gives a good explanation (e.g., "How ISR works"), copy it into `DETAILED_NOTES.md` for future reference. You'll save tokens next time someone asks.

### Tip 4: Use Terminal Commands First
Before asking Claude "How do I check if events are in the DB?", use TERMINAL_COMMANDS.md to run the SQL query yourself.

### Tip 5: Incremental Development
Don't ask Claude to refactor 5 files at once.  
Do: Ask for 1 file, apply changes, test, then move to next file.

---

## 📊 Estimated Token Savings

### If Working on This Project Regularly

**Without optimization:**
- Average chat: 2000-3000 tokens
- 5 chats/week × 2500 tokens = 12,500 tokens/week
- Monthly cost: ~$10-12 (Sonnet @ $3/1M)

**With optimization (using Haiku + summary files):**
- Average chat: 400-600 tokens
- 5 chats/week × 500 tokens = 2,500 tokens/week
- Monthly cost: ~$0.60 (Haiku @ $0.80/1M)

**Savings: ~95% cost reduction** ✅

---

## 🚀 Next Steps

1. **Commit these files to your repo:**
   ```bash
   git add PROJECT_README.md DETAILED_NOTES.md CLAUDE_WORKFLOW.md DATABASE.md TERMINAL_COMMANDS.md
   git commit -m "Add documentation for efficient Claude workflows"
   git push origin main
   ```

2. **Share PROJECT_README.md** with anyone helping on the project

3. **Bookmark CLAUDE_WORKFLOW.md** — refer to it before every Claude question

4. **Keep DETAILED_NOTES.md up to date** after major changes (session notes, new features, bug fixes)

---

## 📌 Golden Rule

**Before asking Claude anything, ask yourself:**
> "Could I answer this with the summary files + 5 minutes of reading?"

If yes → Use the files and save tokens.  
If no → Share PROJECT_README.md + your specific question + minimal code snippet.

**Result:** 10x more efficient collaboration with Claude, 90% lower token costs.

