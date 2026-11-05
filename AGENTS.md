# Travel Plan — instructions for code assistants

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before editing the site, and [templates/README.md](templates/README.md) before creating an itinerary.

## Non-negotiable invariants

1. This is a **GitHub Pages static website**, not a React/Next.js app. Do not introduce a build system or framework without explicit approval.
2. Work in a feature branch and open a PR. Do not force-push or overwrite other contributors' changes. Treat existing itineraries as maintained/legacy pages, not as scaffolds.
3. Every itinerary's top-left brand is an actual link to the **Travel Plan root**, not `#top`. From a root-level trip folder the link is `../`; a separate `#top` link may scroll within a page.
4. Preserve the existing URLs and Firebase trip IDs: `ueno-2026`, `chichibu-kawagoe-2026`. Do not rename the Chichibu ID just to reflect a title/date change.
5. **Never** commit photos, expenses, emails, UID lists, credentials, service accounts, private keys, or actual trip membership. Public Firebase web configuration is not a secret; security is enforced by deployed Firebase Rules.
6. Firebase authentication, per-trip membership, Firestore rules, Storage rules, billing and CORS are separate from GitHub Pages deployment. Changing a `.rules` file in GitHub does **not** deploy it.
7. For new trips use `node scripts/new-trip.mjs <day-trip|multi-day-trip> <slug>`. Edit the generated `trip-data.js`. Keep common logic in `templates/shared/` instead of copying a legacy app.
8. Links between pages must be relative to the repository Pages root; never assume the site lives at the domain root (`/`). The new templates derive ledger/gallery links from the homepage URL.
9. Render itinerary data with `textContent`/DOM APIs, not unsafe `innerHTML`. External links must use HTTPS and `rel="noopener noreferrer"` when opening a new tab.
10. Before merging run `node scripts/check-site.mjs`; manually verify mobile layout, language options, header-to-home navigation, `?day=`/`?mode=` sharing, and any relevant authenticated workflows.

## Scope and source of truth

- `docs/ARCHITECTURE.md`: architecture, design tokens, data boundaries, navigation and rollout checklist.
- `templates/README.md`: day/multi-day template usage.
- `templates/shared/trip.js` / `trip.css`: canonical **new-itinerary** UI.
- `ueno-trip/` and `chichibu-kawagoe/`: existing live itinerary implementations (do not bulk-rewrite just to enforce template style).
- `expense-tracker/`, `photo-gallery/`: shared authenticated services; do not duplicate their Firebase logic into new itineraries.

A successful static check is not proof that Firebase authorization rules or deployment are correct.