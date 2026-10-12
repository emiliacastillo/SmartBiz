# Rewards, promotions and Miami sample businesses

The app uses the configured PostgreSQL database for campaigns, participants, contacts and uploaded images. There is no demo-mode switch. The two sample business profiles are ordinary, editable database records, explicitly labeled as fictional.

## Administration

Open `/admin/rewards` or **Rewards & promotions** on a business in `/admin`. Admin sessions are required for every management and contact endpoint. Business-role sessions cannot access this platform-admin feature.

Campaigns support promotions, rewards and events; descriptions, terms, optional external links; activation; start, entry-close and redemption dates; entry and winner caps; eligible services; manual selection, random selection or instant awards. Dates entered in the editor use the administrator's device timezone. Public dates display Eastern Time.

An active campaign within its entry window appears on that business's smart-tag page. Participation collects name, email and international phone number. Result notifications and future marketing have four separate, unchecked consent choices. The private status link displays results and lets the participant change these choices. Save this link; it grants access to the entry and should not be shared. It does not disclose contact details.

The admin can select a participant or draw one eligible winner. Instant campaigns award on entry until their cap is reached. A row lock on the campaign serializes entries, awards, edits, archival and redemption. Each entry saves its original terms and eligible services. A reward can be redeemed once, by an admin, against an active service of the same business. Paused or archived campaigns cannot award or redeem. Closing entries does not stop an admin from selecting winners; the separate redemption deadline controls redemption.

Delete archives a campaign and removes it from the public page, preserving participation history and contacts. Contacts are visible only to admins. CSV exports include only opt-ins for the selected marketing channel and escape spreadsheet formulas. This release stores contacts and preferences; it does not automatically send future marketing campaigns. Contact addresses and phone numbers are supplied by the participant, not independently verified.

## Email and SMS configuration

Set these variables in the deployment environment and redeploy. Do not put secrets in client-side `NEXT_PUBLIC_` variables or commit `.env`:

```dotenv
RESEND_API_KEY=...
REWARDS_EMAIL_FROM="Your business <rewards@your-verified-domain.com>"
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

The existing `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `AUTH_SECRET` variables are also required for administrator access. Authentication no longer falls back to a shared demo password or signing secret.

Use a verified sending domain in Resend and an appropriately configured Twilio sender. Configure opt-out handling on that sender; the application also allows recipients to withdraw consent from their private entry page. Credentials are not included in this repository. Winner notifications use the stable production smart-page domain for status links.

Delivery is attempted when an admin awards/draws or an instant entry wins. The admin can retry unsent notices after configuring the provider. `ACCEPTED` means accepted by the provider, not confirmed delivery. `NOT_CONFIGURED` and `NOT_REQUESTED` are explicit. `FAILED` can be retried; `UNKNOWN` means a timeout or ambiguous provider response and requires checking provider logs before any manual resend. Atomic claims prevent concurrent duplicate sends; Resend additionally receives an idempotency key. No scheduled worker, delivery-receipt webhook or bulk-marketing sender is included.

Provider references: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [Twilio Message resource](https://www.twilio.com/docs/messaging/api/message-resource).

## Database and content installation

Migration `20261013000000_rewards` adds columns to Promotion and creates CustomerContact and RewardEntry. It does not remove or replace existing records. Generate the Prisma client and apply pending migrations when releasing this version:

```powershell
npx.cmd prisma migrate deploy
npm.cmd run build
```

The optional, additive content importer creates only missing Miami profiles and their media, services, tag assignments and inactive draft campaigns:

```powershell
node scripts/add-miami-businesses.mjs
```

It skips any existing matching slug, including records subsequently edited by an administrator. It does not invoke `prisma/seed.js`. Draft campaigns require genuine offer details and terms before activation.

- **Miami Fix & Care — Sample**: tag `MIAFIX`, four handyman services, illustrative photos and reserved example contacts.
- **Biscayne Home Guide — Sample**: tag `MIAHOME`, two independent property references, buyer and seller services, title checklist and an explicitly illustrative 4.8/5 rating with zero verified reviews. This fictitious profile does not represent the listed homes or assert verified title, licensing, client outcomes or seller representation.

Listing facts and photo sources, checked October 11, 2026: [3300 SW 87th Ct](https://www.zillow.com/homedetails/3300-SW-87th-Ct-Miami-FL-33165/44193634_zpid/) and [6000 SW 94th Pl](https://www.zillow.com/homedetails/6000-SW-94th-Pl-Miami-FL-33173/44210459_zpid/). Availability and prices can change; the original Zillow links remain on each card and image. No listing prose was copied. The review link opens [Miami agent reviews](https://www.zillow.com/miami-fl/real-estate-agent-reviews/), not a fabricated agent profile.

Handyman photo credits: [Todd Quackenbush](https://unsplash.com/photos/IClZBVw5W5A), [Barn Images](https://unsplash.com/photos/t5YUoHW6zRo), [Benjamin Lehman](https://unsplash.com/photos/EJU7A__krX0), [Julie Molliver](https://unsplash.com/photos/Z3vFp7szCAY). Source credits are included in each caption. The importer stores copies in UploadedImage, so service images do not rely on third-party hotlinks at runtime.

## Verification

`npm.cmd test` covers data/session regressions, service content, campaign validation and mocked notification behavior. No unit test sends real email or SMS.

`tests/rewards-flow.mjs` runs the production build in Chrome and requires `DATABASE_URL` to point at loopback database `smartbiz_service_test`. It covers admin campaign creation, public registration, permission boundaries, persisted sessions, contact privacy, consent withdrawal, snapshots, concurrent awards and redemptions, instant capacity, inactive/expired campaigns and archival. Provider credentials are explicitly cleared in the test server. `tests/service-flow.mjs` covers uploads, image actions, carousel and interaction analytics.

Example isolated setup:

```powershell
docker run --detach --rm --name smartbiz-rewards-test -e POSTGRES_PASSWORD=reward-test-only -e POSTGRES_DB=smartbiz_service_test -p 127.0.0.1:55433:5432 postgres:16-alpine
$env:DATABASE_URL='postgresql://postgres:reward-test-only@127.0.0.1:55433/smartbiz_service_test'
npx.cmd prisma migrate deploy
npm.cmd run build
node tests/rewards-flow.mjs
node tests/service-flow.mjs
docker stop smartbiz-rewards-test
```

Never run the integration suites or legacy seed against production.
