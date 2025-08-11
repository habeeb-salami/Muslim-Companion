Here’s the fastest path to ship to the Chrome Web Store.

### Preflight fixes (do these first)
- Manifest cleanup:
  - Remove duplicate permission and invalid entry:
    - Keep only: "permissions": ["storage", "notifications", "alarms"]
    - Remove "geolocation" (not valid for extensions)
    - Remove the duplicate "notifications"
  - Remove unnecessary "web_accessible_resources" (you’re not exposing internal files to webpages)
  - Ensure icons include 16, 48, 128 at least; you already point 16 and 128 to `src/images/ramadan.png`. Add 48 if you have it, or reuse 128.

- Versioning:
  - Set `"version": "1.0.0"` and increment on every upload.

- Asset trim (optional but recommended):
  - Delete unused files previously listed (extra Bootstrap, unused pages/images, duplicate hadith JSONs in `src/js/hadiths/`, etc.).
  - If keeping source maps, exclude them from the ZIP.

- Privacy policy:
  - Publish a simple policy stating no analytics/ads; only local storage; optional network calls to `api.quran.com`; notifications/alarms used locally; location used only to compute prayer times and not transmitted.
  - Link it in the store listing.

### Build and package
- Validate locally:
  - Chrome → Extensions → Developer mode → Load unpacked → point to the project root.
  - Check the service worker (background page) logs for alarms/notifications.
- Create the ZIP from the repo root (macOS):
  - Example (excludes VCS, maps, DS_Store):
    - zip -r MuslimCompanion-1.0.0.zip . -x '*.git*' '*node_modules*' '*.map' '*/.DS_Store'
  - Ensure the ZIP root contains `manifest.json` (not a nested folder).

### Store listing essentials
- Title: Muslim Companion
- Short description: Lightweight, privacy-first Islamic tools: prayer times, Qibla, Quran/Hadith, Hijri calendar.
- Screenshots: At least one 1280x800 (or 640x400). Add 3–5 showcasing popup, options, notifications, Qibla, calendar.
- Category: Productivity or Lifestyle.
- Permissions rationale (in listing):
  - Notifications/Alarms: prayer and daily content reminders.
  - Storage: local settings and cached content.
  - Network access: `api.quran.com` for daily verse (optional, cached).
  - Geolocation note: uses browser geolocation when available; data not sent to servers.

### Submission
- Create a Developer account at the Chrome Web Store dashboard.
- New item → Upload the ZIP.
- Fill out content rating, data disclosures (No sale/sharing; local-only storage), and policy links.
- Submit for review.

If you want, I can apply the manifest edits now:
- Remove the duplicate "notifications"
- Remove "geolocation"
- Remove "web_accessible_resources"
- Optionally add `"48": "./src/images/ramadan.png"` in `icons` if you want a 48px entry

Just say “apply manifest cleanup” and I’ll commit those edits.