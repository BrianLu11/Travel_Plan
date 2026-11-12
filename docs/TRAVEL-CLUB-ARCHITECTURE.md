# Travel Plan 2.0 — 受邀制旅行社群、積分與行程模板

**Status: prototype on `feature/travel-club-platform`. Do not merge/deploy without emulator, browser and security testing.**

## Architecture

```text
GitHub Pages (public HTML + JS)
  travel-club/          membership, organizer, trip invites, attendance
  trip/?trip=<id>       public itinerary (publishedTrips data only)
  expense-tracker/      private expense ledger (existing feature)
  photo-gallery/        private gallery (existing feature)
       |
       +-- Firebase Auth (Google verified account)
       +-- Cloud Functions v2 (privileged mutations, asia-northeast1)
       +-- Firestore (users, trips, memberships, invitations, point ledger, public itinerary)
       +-- Cloud Storage (private trip photos)
```

No arbitrary client writes to user points, organizer rights, platform invites, trip creation or published itineraries. A callable Function uses its Admin SDK privileges only after checking a verified identity and specific permission.

## Roles and points

- **Uninvited visitor:** may see published itineraries; cannot access private finances/photos or enroll as a platform member.
- **Invited platform member:** after accepting an email-bound invitation, gets `active:true`, `points:0`.
- **Organizer:** gets organizing privileges at **100 points** (five confirmed trips, 20 points each) or explicit `organizerOverride:true`.
- **Platform administrator:** explicitly provisioned with `platformAdmin:true`; may organize and invite, but this prototype does not yet provide a general admin/appeals UI.
- **Trip-specific admin:** controls the members/invites and attendance of **that particular trip**, not the entire platform.

Attendance is recorded only after the end date and after a trip-specific admin marks the trip completed. One unique point award per `(tripId, uid)`, guaranteed by a Firestore transaction. A trip organizer cannot award themself. Actual attendance still requires human verification; a colluding organizer could issue false points, so before opening to untrusted users add audit/revocation, invite quotas and administrator review. The points reward is configurable in `functions/lib/policy.js`.

## Data model

| Firestore path | Data | Access |
| --- | --- | --- |
| `users/{uid}` | verified email, display name, status, points, organizer override | owner read; trusted backend writes |
| `users/{uid}/tripRefs/{tripId}` | index for "My trips" | owner read; trusted backend writes |
| `platformInvites/{sha256(email)}` | recipient, inviter, status, expiry | trusted backend only |
| `trips/{tripId}` | title, dates, currency, template type, creator, status, schemaVersion 2 | existing member / invited restrictions |
| `trips/{tripId}/invites/{email}` | per-trip email invitation | existing ledger-compatible model |
| `trips/{tripId}/members/{uid}` | role and active state | shared by ledger and gallery |
| `trips/{tripId}/expenses/{id}` | expenses and customized splits | existing ledger permissions |
| `trips/{tripId}/photos/{id}` | photo metadata | existing album permissions |
| `pointAwards/{tripId}_{uid}` | append-only participation events | trusted backend only |
| `publishedTrips/{tripId}` | sanitized public itinerary JSON | public get only if published |

The platform and trip are distinct invitation layers:
1. **Platform invitation** from an eligible organizer, to a verified Google email, permits creating a zero-point platform profile.
2. **Trip invitation** from a trip admin, to a verified Google email, permits joining the selected trip.
3. Accepting the trip invite writes `trips/{id}/members/{uid}`, **automatically** granting the existing shared ledger/gallery access.

The existing ledger/gallery previously hardcoded recognized trip IDs; this branch adds safe fallback to any validated new trip ID, while preserving legacy labels/paths. For new trips, their itinerary URL is `trip/?trip=<id>`. The old three itineraries remain unchanged.

## AI-driven itinerary templates

Four themes use one safe, data-driven HTML/JS viewer (no AI-generated script execution):
- `day-trip`: teal single-day/city theme.
- `multi-day-trip`: blue-grey multi-day journal with day tabs.
- `event-trip`: plum/night-event theme for fireworks, festivals and exhibitions.
- `regional-trip`: forest green/nature theme.

The organizer creates the trip, asks AI to produce **only** JSON using [AI-ITINERARY-CONTRACT.md](AI-ITINERARY-CONTRACT.md), reviews it, and pastes it into the club's Publish form. `publishItinerary` validates and stores only allowed fields; the public itinerary page uses DOM `textContent`, not arbitrary HTML injection. The Firestore trip membership remains private.

**Known limitations in this prototype:** there is no direct image-upload or AI authoring form; links to public trip itinerary remain inactive until the organizer publishes JSON; Google Photos synchronization is out of scope; organizers' existing legacy trips will need one-time profile and tripRefs backfill to appear in "My trips".

## Security/operations and rollout

- Install Cloud Functions and deploy the Firestore rules **separately**; GitHub Pages deploy alone does not activate backend privileges.
- Run policy unit tests, Firebase Emulator access tests, invitation abuse tests, and real cross-member ledger/gallery checks before merging.
- Avoid putting service-account JSON, private emails, personal expenses, or photos into this public repository.
- Published itinerary text is publicly readable. Do not include attendee lists, room numbers, private addresses, unpublished reservations or secret meeting arrangements.
- Functions are currently restricted to one accepted web origin and authenticated user checks, but **App Check and rate limiting are not yet implemented**. Restrict to trusted users and add enforcement before scaling publicly.
- Firebase Functions v2 requires billing and will consume resources; budget alerts are not spending caps.
- Bootstrap the original platform administrator exactly once using Firebase Console or an Admin SDK script, not a client-side "first user becomes admin" shortcut.

See [TRAVEL-CLUB-SETUP.md](TRAVEL-CLUB-SETUP.md) for activation and migration.
