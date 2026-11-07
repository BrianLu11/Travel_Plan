# Shared Photo Gallery | Travel Plan

This is a private, per-trip photo gallery backed by Firebase Authentication, Cloud Firestore and Cloud Storage. GitHub Pages only serves the HTML/CSS/JS; **photos never go into the public GitHub repository**.

## Features

- Reuses the existing Google sign-in, per-trip Firestore \`members\` and \`invites\` collections.
- Album URLs: \`../photo-gallery/?trip=ueno-2026\`, \`../photo-gallery/?trip=chichibu-kawagoe-2026\`, \`../photo-gallery/?trip=tsuchiura-hanabi-2026\`.
- Members can upload up to 20 JPG/PNG/WebP images per selection (20 MiB maximum each), see upload progress, browse date-sorted photo thumbnails, open a larger image, and download originals.
- Uploads include a compressed thumbnail; originals are retained unchanged. Original EXIF may contain GPS/location and camera metadata.
- Only the uploader or the trip admin can delete a photo; anonymous and non-member reads/writes are denied.
- **Private download path:** photos use Firebase Storage SDK \`getBlob()\` (with authenticated requests), not permanent public download-token URLs. Each downloaded image remains a copy in the recipient's possession.

For the Tsuchiura album, first bootstrap `trips/tsuchiura-hanabi-2026` and an active admin member in Firestore as described in [the ledger README](../expense-tracker/README.md); members invited from its ledger page can then access this album. Linking the page does not provision its backend.

## Required setup before testing or merging

1. Open [Firebase Console](https://console.firebase.google.com/project/travel-together-56eb7/storage) for project \`travel-together-56eb7\`. Upgrade to **Blaze** (billing account required), and create a default Storage bucket. Choose its region consciously: only select US regions if their price/performance/privacy tradeoff is acceptable. Set billing alerts. **Storage is not usable on Spark.**
2. In Storage > Files, copy the **exact** bucket name into \`photo-gallery/storage-config.js\`. New buckets generally end with \`.firebasestorage.app\`; legacy ones can end with \`.appspot.com\`.
3. In Firestore > Rules, deploy the updated repo file \`expense-tracker/firestore.rules\`. It preserves existing ledger/children rules and adds \`/trips/{tripId}/photos/{photoId}\`.
4. In Storage > Rules, publish \`photo-gallery/storage.rules\`. The console may request permission for Storage Rules to access Firestore; grant it for the cross-service membership check. Never deploy default open/test-mode rules.
5. Configure the bucket's CORS for the GitHub Pages origin. From a machine with authenticated Google Cloud CLI:
   \`\`\`bash
   gcloud storage buckets update gs://YOUR_EXACT_BUCKET_NAME --cors-file=photo-gallery/cors.json
   \`\`\`
   Or apply the equivalent JSON CORS configuration via Google Cloud Storage tools. \`getBlob()\` requires CORS, otherwise image retrieval in the browser fails.
6. Deploy the gallery feature branch (or merge to \`main\` after testing). GitHub Pages serves \`main\` in the current setup; committing this folder alone does not configure Firebase.

## Verification checklist (use emulator or private test trip first)

- [ ] An anonymous user cannot list/read Firestore photos or read Storage objects.
- [ ] A signed-in **non-member** cannot read, upload, delete or list another trip's photos.
- [ ] An invited member can join and then open the album for that trip only.
- [ ] A member can upload and download their photos; another member can view/download but cannot delete.
- [ ] The uploader and admin can delete; updating metadata or overwriting existing objects is rejected.
- [ ] Photos are accessible only through authenticated SDK reads. Do not store or publish \`getDownloadURL()\` tokens.
- [ ] Blocked file types and files over 20 MiB are rejected; thumbnails are below 1 MiB.
- [ ] CORS is configured and desktop/mobile browser uploads work.
- [ ] Removing an active member prevents future SDK downloads; already-downloaded files cannot be revoked.
- [ ] Test batching uploads, slow networks and partial failures.

## Data paths

Firestore: \`trips/{tripId}/photos/{photoId}\`, with uploader, name, size, content type, two Storage paths, and server timestamp.

Storage:
- \`trip-photos/{tripId}/{uploaderUid}/{photoId}/original\`
- \`trip-photos/{tripId}/{uploaderUid}/{photoId}/thumb\`

### Operational caveats

Client-side uploads are not atomic across Firestore and Storage. Failed uploads trigger best-effort cleanup, but storage orphans may require periodic admin review and deletion in Firebase Console. Hard deletes are not recoverable unless bucket versioning/backups are enabled; setting lifecycle rules and a retention policy requires a separate decision. Membership checks from Storage Rules consume Firestore reads. Google Cloud budget **alerts do not automatically stop spending**. To ensure photo privacy, do not paste direct Firebase Storage download URLs into public pages.

### Future enhancements

Album search/tagging, editable captions, original-image selection, moderation/approval, cross-trip media management, scheduled cleanup, and server-side thumbnail generation via Cloud Functions are deferred.
