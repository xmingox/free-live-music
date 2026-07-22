---
name: programmatic-seo-machine
description: Bootstrap or operate a passive, zero-cost programmatic-SEO site (data import -> programmatic pages -> self-audit -> GSC feedback loop -> honesty discipline). Use when starting a new data-driven SEO site, picking its niche, setting up Search Console pipelines, or auditing an existing programmatic site's indexing hygiene.
---

# Programmatic-SEO Machine

This skill is a thin wrapper around the full playbook. **Read `playbook.md` in this skill's directory and follow it.**

- Starting a NEW site: follow playbook §1 (niche selection) then §4 (bootstrap checklist) in order. Do not write code before the niche passes the §1 checklist.
- Operating an EXISTING site: enforce §2 (constraints), §3.3 (honesty discipline), §3.5 (GSC service-account loop), and check against §5 (anti-patterns).
- Monetization questions: §6 ladder — never skip the traffic tripwire.

## Install (manual — not yet installed anywhere)

This scaffold lives in the freelivemusic.co repo at `docs/skills/programmatic-seo-machine/` and is NOT active as a skill. To use it across projects:

1. Copy this folder to `~/.claude/skills/programmatic-seo-machine/` (user-global), or into a repo at `.claude/skills/programmatic-seo-machine/` (project-scoped).
2. Copy `docs/programmatic-seo-playbook.md` into that folder as `playbook.md` (the playbook's canonical home is the repo doc; the skill bundles a copy at install time to stay self-contained).
3. Verify it appears in the available-skills list in a new session.

For the next site, the simpler, equally durable path is: just copy `docs/programmatic-seo-playbook.md` into the new repo's `docs/` and link it from that repo's `CLAUDE.md`.
