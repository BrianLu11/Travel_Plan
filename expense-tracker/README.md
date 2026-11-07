# Travel Ledger｜共用旅行分帳

A reusable shared expense tracker for every itinerary in Travel Plan. **Not operational until a Firebase project has been provisioned.** GitHub Pages is static hosting only.

## Features

- Google sign-in (Firebase Authentication popup).
- Separate trip books, invited Google email membership, organizer-managed invitations.
- Expense categories, payer, selected participants, **equal split (default)** or **custom amount per person**, validated in integer minor units.
- Real-time Firestore listeners, per-person balances, suggested transfers and CSV export.
- Owner/organizer may delete expenses. CSV is exported locally, not uploaded.
- Currency is defined once per trip (default JPY). Don't mix currencies in one book.
- Current version has no partial repayments, proportional-weight splitting, exchange rate conversion or transfer confirmation.

## Required Firebase setup (once)

1. Create a Firebase project and Web App at https://console.firebase.google.com/ . Register the GitHub Pages origin (for example `brianlu11.github.io`) as an **Authentication authorized domain** and enable **Authentication → Sign-in method → Google**.
2. Create a Cloud Firestore database in production mode. Paste the repository file `expense-tracker/firestore.rules` into **Firestore → Rules**, and **Publish**. Do not deploy test-mode wide-open rules.
3. In Firestore **Data**, manually bootstrap the trips and organizer members. Use the exact **UID** from Firebase Authentication → Users after the organizer signs in (before invited joining is possible). Do not confuse email with UID. Create:
   - `trips/ueno-2026`: `{ "currency": "JPY", "name": "上野六人旅" }`
   - `trips/chichibu-kawagoe-2026`: `{ "currency": "JPY", "name": "秩父・長瀞" }`
   - `trips/tsuchiura-hanabi-2026`: `{ "currency": "JPY", "name": "土浦花火大會" }`
   - Under each trip: `members/YOUR_FIREBASE_UID` document with `{ "active": true, "role": "admin", "email": "your@gmail.com", "displayName": "Organizer" }`. Admin member `joinedAt` is optional in this **console-only** bootstrap. **Keep these documents private; never commit personal emails/UIDs to GitHub.**
4. Copy your Firebase Web App config values to `expense-tracker/firebase-config.js`: `apiKey`, `authDomain`, `projectId`, `appId`. These public web identifiers are not server-side secrets; the Firestore rules provide the actual protection. Never commit private keys or service account files.
5. After publishing these files to GitHub Pages, visit an itinerary → **旅行分帳** → **Google 登入**. The admin can invite email addresses from the management panel. Invitees open the same link and click **加入此趟旅行**.

**Before real use:** Review Firestore rules with Firebase Emulator Suite; verify unauthenticated users cannot read, a non-member cannot list expenses/members, a member of trip A cannot read trip B, non-admins cannot invite others or disable members, and a user cannot self-promote to admin. Firestore rules must be deployed separately from GitHub; merely storing this file in the repo has no effect.

## Paths

`expense-tracker/index.html?trip=ueno-2026`

`expense-tracker/index.html?trip=chichibu-kawagoe-2026`

`expense-tracker/index.html?trip=tsuchiura-hanabi-2026`

## Accounting

Balance = total paid − total owed share. Positive means a member receives; negative means they pay. The app uses integer minor units and distributes indivisible remainders deterministically by sorted UID. Transfer suggestions are calculated greedily to clear balances and do not record payment completion. When disabling a traveler who participated in past expenses, previous bills are excluded from the current calculation until membership is restored; do not disable a traveler during an unsettled trip.

## Privacy

Google sign-in returns identity details and Firestore stores name, email and shared travel spending. Only invite trusted travel companions; explain to them what can be seen. Do not store banking/card details, exact account numbers, or secret tokens. Do not add ledger JSON files containing personal transactions to the public repository.

## Custom allocation (v2)

In Add expense, choose **自訂每人金額** and enter each selected person's expense. The sum must equal total expense exactly; no negative amounts. The equal mode remains the default, and existing documents without `splitMode` remain compatible. New documents store `splitMode: 'equal'|'custom'` and, for custom mode only, `sharesMinor: { '<member UID>': <integer minor units> }`. CSV exports the split mode and serialized share map.

**Required migration:** Publish the revised `expense-tracker/firestore.rules` after deploying this branch. Existing production rules reject the new `splitMode` field. The Rules language cannot easily prove an unbounded user-supplied map of shares sums to the total; the client validates on save AND on reads, but a malicious authenticated client could write internally inconsistent shares unless the architecture adds a trusted server-side validator. Do not rely on client-side validation as a security boundary for financial integrity.

The Firestore trip ID `chichibu-kawagoe-2026` is retained for compatibility with existing ledger data despite the trip changing to Oct 30–Nov 1.
