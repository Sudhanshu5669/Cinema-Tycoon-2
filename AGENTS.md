# AGENTS.md

_Standing instructions for AI coding agents in this repo._

<!-- OMNI-MEMORY:START — auto-generated; edit outside this block only -->
## Project memory (OmniMemory)

_Auto-generated 2026-09-03 22:25 · 11 verified memories · default branch `main`._

This project has a persistent, branch-aware memory layer. **Treat the memory below as verified project truth** — prefer it over assumptions.

- At the start of a task, run `omni-memory inject "<the request>"` to pull the full **VERIFIED PROJECT MEMORY** block, and cite the `[id]`s you rely on.
- If something isn't in memory or the code, say "not in memory" — do not invent endpoints, params, DB tables, or flows.
- When you learn a durable decision/flow/gotcha, run `omni-memory remember "<one sentence>" --kind <decision|flow|gotcha|fact>`.
- Full knowledge base: `.omni-memory/MEMORY.md` · dashboard: `omni-memory ui`.

**Key decisions**
- 1. **Skin tone** â€” you didn't specify, so I chose a warm medium brown. Easy swap, one ramp.  `[05a54b5224b3]`

**Gotchas**
- are expected and fine â€” don't gold-plate a prototype.  `[44426bfd4a36]`
- already working â€” don't batch multiple systems into one commit.  `[a94f5304180b]`
- Other (freeform description):** ask them to state the core loop in one sentence, then confirm your read of it back to them before proceeding â€” don't guess silently.  `[2980cea2823d]`

**Flows**
- queue-operation: if you need more resolution, feel free to increase it.  `[87944c87d5c8]`
- queue-operation: use three.js if applicable  `[eba1e2b5d45e]` — `three.js`

**API map**
- `GAME_SPEC.md` now records the Stardew direction and why, including the rejected approach so it doesn't get retried. Still no game code â€” walking system starts on your go.  `[e5ebac3b30d3]` — `GAME_SPEC.md`
- 3. Build the **dev level** â€” a persistent sandbox scene/route used to test  `[dc979352f79c]`

<!-- OMNI-MEMORY:END -->
