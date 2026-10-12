// Destructive test activity is restricted to this disposable, local database.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createHmac } from "node:crypto";
import { chromium } from "playwright";

const database = new URL(process.env.DATABASE_URL ?? "http://invalid");
assert.ok(["127.0.0.1", "localhost"].includes(database.hostname) && database.pathname === "/smartbiz_service_test", "Use the isolated local smartbiz_service_test database only.");
const base = "http://localhost:3119";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3119"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production", AUTH_SECRET: "isolated-reward-test-secret", ADMIN_EMAIL: "rewards@example.test", ADMIN_PASSWORD: "test-password", RESEND_API_KEY: "", TWILIO_AUTH_TOKEN: "", TWILIO_ACCOUNT_SID: "", REWARDS_EMAIL_FROM: "", TWILIO_FROM_NUMBER: "" } });
let browser; let serverError = "";
server.stderr.on("data", (data) => { serverError += data; });
server.stdout.on("data", () => {});
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`${base}/login`)).ok) { ready = true; break; } } catch {} await new Promise((r) => setTimeout(r, 250)); }
  assert.ok(ready, "Production server starts");
  const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({ headless: true, ...(existsSync(executablePath) ? { executablePath } : {}) });
  const admin = await browser.newContext(); const visitor = await browser.newContext(); const page = await admin.newPage();
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/login`); await page.locator("input[name=email]").fill("rewards@example.test"); await page.locator("input[name=password]").fill("test-password"); await page.getByRole("button", { name: "Continue" }).click(); await page.waitForURL(`${base}/admin`);
  async function json(response, status) { assert.equal(response.status(), status, await response.text()); return response.json(); }
  const business = await json(await admin.request.post(`${base}/api/businesses`, { data: { name: `Rewards integration ${Date.now()}` } }), 201);
  const service = await json(await admin.request.post(`${base}/api/businesses/${business.id}/links`, { data: { type: "CUSTOM", label: "Assembly visit", description: "Test service", url: "", position: 0, active: true, images: [], actions: [] } }), 201);
  const other = await json(await admin.request.post(`${base}/api/businesses`, { data: { name: `Other rewards business ${Date.now()}` } }), 201);
  const otherService = await json(await admin.request.post(`${base}/api/businesses/${other.id}/links`, { data: { type: "CUSTOM", label: "Unrelated service", description: "Test service", url: "", position: 0, active: true, images: [], actions: [] } }), 201);
  const tag = await json(await admin.request.post(`${base}/api/tags`, { data: { businessId: business.id, name: "Reward test" } }), 201);
  const otherTag = await json(await admin.request.post(`${base}/api/tags`, { data: { businessId: other.id, name: "Other tag" } }), 201);
  await page.reload(); assert.ok(await page.getByText(business.name, { exact: true }).isVisible());
  await page.goto(`${base}/admin/rewards?businessId=${business.id}`);
  await page.getByRole("button", { name: "New campaign" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Miami assembly reward");
  await page.getByLabel("Description", { exact: true }).fill("Win one assembly visit.");
  await page.getByLabel("Participation and redemption terms", { exact: true }).fill("One assembly visit. Bring the private reward code. Test participants only.");
  await page.getByLabel("Assembly visit", { exact: true }).check();
  await page.getByLabel("Active on the public page", { exact: true }).check();
  const created = page.waitForResponse((r) => r.url().endsWith(`/businesses/${business.id}/campaigns`) && r.request().method() === "POST");
  await page.getByRole("button", { name: "Save campaign" }).click();
  const campaign = await json(await created, 201);
  await page.getByRole("heading", { name: campaign.title }).waitFor();
  await page.reload(); await page.getByRole("heading", { name: campaign.title }).waitFor();
  assert.ok(await page.getByText(/Email: setup required/).isVisible());
  assert.equal((await visitor.request.get(`${base}/api/businesses/${business.id}/contacts`)).status(), 401);
  assert.equal((await visitor.request.get(`${base}/api/businesses/${business.id}/campaigns`)).status(), 401);
  assert.equal((await visitor.request.post(`${base}/api/campaigns/${campaign.id}/actions`, { data: { action: "draw" } })).status(), 401);
  const payload = JSON.stringify({ sub: "owner", email: "owner@example.test", role: "business", businessId: other.id, exp: Date.now() + 60000 });
  const token = `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256", "isolated-reward-test-secret").update(payload).digest("base64url")}`;
  const unauthorized = await browser.newContext(); await unauthorized.addCookies([{ name: "smartbiz_session", value: token, url: base }]);
  assert.equal((await unauthorized.request.get(`${base}/api/businesses/${business.id}/contacts`)).status(), 401);
  const view = await visitor.newPage(); view.on("pageerror", (error) => errors.push(error.message));
  await view.goto(`${base}/t/${tag.code}`); await view.getByRole("button", { name: "Apply to participate" }).click();
  await view.getByLabel("Full name", { exact: true }).fill("Test Participant"); await view.getByLabel("Email", { exact: true }).fill("participant@example.test"); await view.getByLabel("Phone with country code").fill("+13055550101");
  await view.getByLabel(/I accept the published campaign terms/).check(); await view.getByLabel("Email me the result of this campaign.", { exact: true }).check(); await view.getByLabel(/Text me the result of this campaign/).check(); await view.getByLabel(/Optional: email me future offers/).check();
  const entered = view.waitForResponse((r) => r.url().endsWith(`/campaigns/${campaign.id}/enter`)); await view.getByRole("button", { name: "Submit entry" }).click(); const entryResult = await json(await entered, 201);
  await view.getByRole("link", { name: "View my entry and rewards" }).click(); await view.getByText("Your entry is awaiting a result.").waitFor();
  const entryInput = { name: "Test Participant", email: "participant@example.test", phone: "+13055550101", tagCode: tag.code, acceptTerms: true };
  const duplicate = await visitor.request.post(`${base}/api/campaigns/${campaign.id}/enter`, { data: entryInput }); assert.equal(duplicate.status(), 409); assert.ok(!(await duplicate.text()).includes(entryResult.statusUrl));
  assert.equal((await visitor.request.post(`${base}/api/campaigns/${campaign.id}/enter`, { data: { ...entryInput, email: "other@example.test", tagCode: otherTag.code } })).status(), 400);
  assert.equal((await admin.request.post(`${base}/api/businesses/${business.id}/campaigns`, { data: { ...campaign, serviceIds: [otherService.id] } })).status(), 400);
  // Preserve the original terms and eligible services when the campaign changes.
  await json(await admin.request.patch(`${base}/api/campaigns/${campaign.id}`, { data: { ...campaign, terms: "New terms for future entrants only.", serviceIds: [] } }), 200);
  const listed = await json(await admin.request.get(`${base}/api/businesses/${business.id}/campaigns`), 200); const entryId = listed.campaigns[0].entries[0].id;
  const awards = await Promise.all([1, 2].map(() => admin.request.post(`${base}/api/campaigns/${campaign.id}/actions`, { data: { action: "award", entryId } })));
  assert.deepEqual(awards.map((r) => r.status()).sort(), [200, 409]);
  await view.getByRole("button", { name: "Check for updates" }).click(); await view.getByText("Congratulations! You received a reward.").waitFor();
  const result = await json(await visitor.request.get(`${base}/api${entryResult.statusUrl}`), 200);
  assert.ok(result.code); assert.equal(result.terms, campaign.terms); assert.equal(result.services[0].id, service.id); assert.equal(result.email, undefined); assert.equal(result.phone, undefined);
  const notices = (await json(await admin.request.get(`${base}/api/businesses/${business.id}/campaigns`), 200)).campaigns[0].entries[0]; assert.equal(notices.emailNoticeState, "NOT_CONFIGURED"); assert.equal(notices.smsNoticeState, "NOT_CONFIGURED");
  assert.equal((await admin.request.post(`${base}/api/campaigns/${campaign.id}/actions`, { data: { action: "redeem", code: result.code, serviceId: otherService.id } })).status(), 400);
  const redemptions = await Promise.all([1, 2].map(() => admin.request.post(`${base}/api/campaigns/${campaign.id}/actions`, { data: { action: "redeem", code: result.code, serviceId: service.id } })));
  assert.deepEqual(redemptions.map((r) => r.status()).sort(), [200, 409]);
  await view.reload(); await view.getByText("Your reward has been redeemed.").waitFor(); assert.equal(await view.locator("code").count(), 0);
  await view.getByLabel("Future offers and reminders by email").uncheck(); await view.getByRole("button", { name: "Save preferences" }).click(); await view.getByText("Preferences saved.").waitFor();
  const contacts = await json(await admin.request.get(`${base}/api/businesses/${business.id}/contacts`), 200); assert.equal(contacts.length, 1); assert.equal(contacts[0].emailMarketingConsent, false); assert.equal(contacts[0].smsMarketingConsent, false);
  // One remaining prize cannot be allocated twice under concurrent instant claims.
  const instant = await json(await admin.request.post(`${base}/api/businesses/${business.id}/campaigns`, { data: { ...campaign, title: "Instant reward", awardMode: "INSTANT", winnerLimit: 1, entryLimit: 2 } }), 201);
  const claims = await Promise.all([2, 3].map((i) => visitor.request.post(`${base}/api/campaigns/${instant.id}/enter`, { data: { ...entryInput, name: `Participant ${i}`, email: `participant${i}@example.test`, phone: `+1305555010${i}` } })));
  assert.deepEqual(claims.map((r) => r.status()).sort(), [201, 409]);
  const inactive = await json(await admin.request.patch(`${base}/api/campaigns/${instant.id}`, { data: { ...instant, active: false } }), 200);
  assert.equal((await visitor.request.post(`${base}/api/campaigns/${instant.id}/enter`, { data: { ...entryInput, email: "inactive@example.test" } })).status(), 409);
  await json(await admin.request.patch(`${base}/api/campaigns/${instant.id}`, { data: { ...inactive, active: true, endsAt: "2020-01-01T00:00:00Z" } }), 200);
  assert.equal((await visitor.request.post(`${base}/api/campaigns/${instant.id}/enter`, { data: { ...entryInput, email: "expired@example.test" } })).status(), 409);
  await json(await admin.request.delete(`${base}/api/campaigns/${campaign.id}`), 200);
  assert.equal((await json(await visitor.request.get(`${base}/api${entryResult.statusUrl}`), 200)).available, false);
  assert.equal((await json(await admin.request.get(`${base}/api/businesses/${business.id}/contacts`), 200)).length, 2);
  await view.goto(`${base}/t/${tag.code}`); assert.equal(await view.getByRole("heading", { name: campaign.title }).count(), 0); assert.equal(await view.getByRole("heading", { name: "Instant reward" }).count(), 0);
  await page.goto(`${base}/admin/rewards?businessId=${business.id}`); await page.getByRole("heading", { name: "Instant reward" }).waitFor(); await page.reload(); await page.getByRole("heading", { name: "Instant reward" }).waitFor();
  assert.equal((await admin.request.get(`${base}/api/login`, { maxRedirects: 0 })).status(), 303);
  assert.deepEqual(errors, []);
  console.log("PASS: admin/public UI, persistent login, permissions, consent, snapshots, concurrent award and redemption, instant capacity, inactive/expired campaigns, archival, and contact retention.");
} catch (error) { if (serverError) console.error(serverError.slice(-3000)); throw error; }
finally { if (browser) await browser.close(); server.kill(); }
