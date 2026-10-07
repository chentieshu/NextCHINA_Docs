# NextCHINA development and publishing contract

## Product invariants
- Keep one canonical knowledge graph. The sidebar is a navigation tree, not scientific containment.
- Reuse canonical concept IDs; do not duplicate mechanisms across topic hubs.
- Distinguish navigation, references, teaching order, scientific assertions and direct explanations.
- Empty outlines and unreviewed assertions must never be presented as completed knowledge.
- Keep Markdown/JSON as source data. Do not change research verification dates without checking sources.

## Required completion workflow
The owner requires every completed modification round to be committed and deployed, not left as a draft, local patch or unmerged PR.
1. Read current main and relevant source files before changing them.
2. Work on a feature branch and keep edits scoped to the requested work.
3. Run data/graph/numeric/Markdown/TypeScript checks, browser regressions and production-build tests. Update obsolete assertions to the explicit contract; never delete, skip or weaken checks just to get a green result.
4. Wait for all required PR checks to pass before merging. Do not bypass repository protections or force-push main.
5. Merge the tested commit, verify the production workflow and confirm Wrangler actually executed successfully.
6. Check the live deployment identity and key pages where access permits. A successful build or queued workflow is NOT a successful deployment.
7. Report commit, checks, deployment result and remaining gaps honestly. If a check or deployment fails, fix it in the same round where possible; never claim it is deployed or promise unattended background work.

## Evidence and review
Source-checked by the author is not independent or expert review. Scope semantic assertions, attach primary sources and retain needs-independent-review until an actual independent review happens.
