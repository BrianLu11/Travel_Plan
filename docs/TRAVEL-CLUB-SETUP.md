# Travel Plan Club — Deployment and first administrator setup

> This guide is for `feature/travel-club-platform`. **No live changes happen merely by merging.** Do not deploy the functions or security rules until the PR's tests and manual security review pass.

## 0. Dependencies

- Firebase project: `travel-together-56eb7`
- Hosting: `https://brianlu11.github.io/Travel_Plan/`
- Firebase Blaze billing (Functions v2 incurs usage-dependent charges)
- Node.js 22, Firebase CLI and authenticated project-owner account

## 1. Test locally first

```bash
npm install --prefix functions
npm run check --prefix functions
npx firebase-tools emulators:start --project travel-together-56eb7
```

Test an existing invited user, a nonmember, a new user with no platform invite, an organizer with 99 vs 100 points, a revoked trip member, duplicate attendance awards, and attempts to update points/roles directly. Start the emulator only in a safe local environment.

## 2. Deploy revised Firestore Rules (manual)

Open Firestore > Rules in Firebase Console and paste the **entire** updated file `expense-tracker/firestore.rules` from the feature branch.

It preserves the existing expense/gallery rules and adds:
- owner-only read access to `users/{uid}` and `users/{uid}/tripRefs/{id}`;
- public single-document get to `publishedTrips/{id}` if `published==true`, no public writes/lists;
- extra new-trip member-create check requiring a platform profile;
- still denies direct writes to platform invitations, points, and public itinerary documents.

**Avoid overwriting more recent production rules from collaborators**: compare current Firebase Rules with the repository file before publishing.

Storage Rules remain as currently deployed because they already enforce `trips/{id}/members/{uid}` membership.

## 3. Deploy Cloud Functions

From the repo root:

```bash
npx firebase-tools login
npx firebase-tools deploy --project travel-together-56eb7 --only functions:travel-club
```

Deploying this codebase should create seven callable endpoints: `acceptPlatformInvite`, `invitePlatformMembers`, `createTrip`, `inviteTripMembers`, `acceptTripInvite`, `completeTrip`, `awardParticipation`, plus `publishItinerary` (eight in total). Region: `asia-northeast1`.

Confirm Google sign-in is enabled under Firebase Authentication and the GitHub Pages domain is included under authorized domains. Configure Cloud Functions/App Check and quotas before large-scale use.

## 4. Bootstrap **one** owner account

Because membership is invite-only, an initial organizer must be established through a trusted admin channel. Sign in to Firebase Authentication with the intended owner Google account; copy its **Firebase Authentication UID**.

In Firestore Console, create exactly one document `users/<owner-uid>`:

```text
email                 string  <owner's verified Google email>
displayName           string  <preferred display name>
active                boolean true
points                number  0
platformAdmin         boolean true
organizerOverride     boolean true
joinedAt              timestamp <current time>
```

This is an **initial bootstrap**, not something to repeat per trip. Do **not** enable client writes to `users`. An existing Firebase member document alone does not automatically create the new platform profile.

## 5. Verify invite flow

1. Owner opens `/Travel_Plan/travel-club/`, signs in, and creates a platform invitation to a friend's Google email.
2. Friend signs in on the same page and accepts platform invite: `users/{uid}` begins at `points:0`.
3. Owner creates a trip, entering ID/title/dates/template. Backend creates the trip and the admin membership and index atomically.
4. Owner uses the trip card to invite friend's email. Friend enters the trip ID and accepts.
5. Both can open **one shared membership's** ledger and gallery URLs. No per-trip Firebase Console manual membership entries are needed.
6. Organizer reviews AI-produced JSON and publishes a publicly viewable itinerary at `/Travel_Plan/trip/?trip=<id>`.
7. After the trip ends, organizer completes the trip, then awards +20 for each confirmed participating member (not themself).

## 6. Legacy migration (one time, not per new trip)

Existing Firestore trips and members remain untouched, and legacy URLs keep working.

The new club dashboard reads `users/{uid}/tripRefs` indexes; legacy members lack those indexes and may not see historical trips in "My trips". For each **existing** participant who wants the new club dashboard, a trusted migration will need to create platform profiles (only with authorization/consent) and backfill tripRefs from existing `trips/{id}/members`. Never award 20 points automatically from old guest lists: attendance should be confirmed first. Do not run an indiscriminate backfill from unverified emails.

Until that migration, the existing legacy itineraries, ledger and gallery still function. A future migration script should support dry-run, idempotence and administrator review.

## 7. Rollback and safety

Keep the earlier Firestore Rules text and production commit SHA before deploying. To rollback a failing release, revert only the new GitHub Pages code and functions with verified prior versions; do not delete Firestore trips/expenses/photos. Firestore Security Rules and Cloud Functions have **independent** deployment/rollback processes.

Current prototype limitations: no automated email delivery (the inviter copies the link), no approval appeals or undo for points, no rate-limit or App Check, and no automatic historical trip import.
