// Run only against the disposable PostgreSQL database documented in docs/services.md.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const database = new URL(process.env.DATABASE_URL ?? "http://invalid");
assert.ok(["127.0.0.1", "localhost"].includes(database.hostname) && database.pathname === "/smartbiz_service_test",
  "This test creates records: DATABASE_URL must point to the isolated local smartbiz_service_test database.");
const base = "http://localhost:3118";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3118"], {
  windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NODE_ENV: "production", AUTH_SECRET: "isolated-service-test-secret", ADMIN_EMAIL: "service@example.test", ADMIN_PASSWORD: "test-password" },
});
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/login`)).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Production server started");
  const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
  const admin = await browser.newContext();
  await admin.route("https://images.example.test/**", (route) => route.fulfill({ contentType: "image/png", body: png }));
  const page = await admin.newPage();
  await page.goto(`${base}/login`);
  await page.locator("input[name=email]").fill("service@example.test");
  await page.locator("input[name=password]").fill("test-password");
  await page.locator("button[type=submit]").click();
  await page.waitForURL(`${base}/admin`);
  const businessResponse = await admin.request.post(`${base}/api/businesses`, { data: { name: `Service test ${Date.now()}` } });
  assert.equal(businessResponse.status(), 201);
  const business = await businessResponse.json();
  await page.goto(`${base}/dashboard?businessId=${business.id}`);
  await page.getByRole("button", { name: "Add service or link" }).click();
  await page.locator("input[name=label]").fill("Tratamiento personalizado");
  await page.locator("textarea[name=description]").fill("Descripción de prueba persistida");
  const uploadResponse = page.waitForResponse((response) => response.url().endsWith(`/businesses/${business.id}/images`));
  await page.locator("input[type=file]").setInputFiles({ name: "service.png", mimeType: "image/png", buffer: png });
  assert.equal((await uploadResponse).status(), 201);
  await page.getByLabel("Descripción de la imagen", { exact: true }).fill("Primera imagen subida");
  assert.equal(await page.getByLabel("O pegar URL de imagen", { exact: true }).count(), 0);
  const secondUpload = page.waitForResponse((response) => response.url().endsWith(`/businesses/${business.id}/images`));
  await page.locator("input[type=file]").setInputFiles({ name: "second.png", mimeType: "image/png", buffer: png });
  assert.equal((await secondUpload).status(), 201);
  await page.getByLabel("Descripción de la imagen", { exact: true }).nth(1).fill("Segunda imagen subida");
  const serviceActions = page.getByRole("group", { name: "Contactos, redes y enlaces del servicio", exact: true });
  await serviceActions.getByRole("button", { name: "Añadir contacto o enlace" }).click();
  await serviceActions.getByRole("combobox", { name: /^Tipo/ }).selectOption("PHONE");
  await serviceActions.getByLabel("Nombre del botón", { exact: true }).fill("Llamar al negocio");
  await serviceActions.getByLabel("Destino", { exact: true }).fill("tel:+18095551234");
  await serviceActions.getByRole("button", { name: "Añadir contacto o enlace" }).click();
  await serviceActions.getByRole("combobox", { name: /^Tipo/ }).nth(1).selectOption("STORE");
  await serviceActions.getByLabel("Nombre del botón", { exact: true }).nth(1).fill("Nuestra tienda");
  await serviceActions.getByLabel("Destino", { exact: true }).nth(1).fill("https://images.example.test/shop");
  const imageActions = page.getByRole("group", { name: "Enlaces y contactos de la imagen 2", exact: true });
  await imageActions.getByRole("button", { name: "Añadir contacto o enlace" }).click();
  await imageActions.getByRole("combobox").selectOption("STORE");
  await imageActions.getByLabel("Nombre del botón", { exact: true }).fill("Comprar esta imagen");
  await imageActions.getByLabel("Destino", { exact: true }).fill("https://images.example.test/image-shop");
  const saveResponse = page.waitForResponse((response) => response.url().endsWith(`/businesses/${business.id}/links`) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Add to smart page" }).click();
  const saved = await saveResponse;
  assert.equal(saved.status(), 201, await saved.text());
  const service = await saved.json();
  assert.equal(service.images.length, 2);
  assert.equal(service.images[1].actions[0].label, "Comprar esta imagen");
  assert.equal(service.actions.length, 2);
  const tagResponse = await admin.request.post(`${base}/api/tags`, { data: { businessId: business.id, name: "Service test tag" } });
  assert.equal(tagResponse.status(), 201);
  const tag = await tagResponse.json();
  const visitor = await browser.newContext();
  await visitor.route("https://images.example.test/**", (route) => route.fulfill({ contentType: "image/png", body: png }));
  assert.equal((await visitor.request.post(`${base}/api/businesses/${business.id}/images`)).status(), 401);
  const uploaded = await visitor.request.get(`${base}${service.images[0].url}`);
  assert.equal(uploaded.status(), 200);
  assert.deepEqual(await uploaded.body(), png);
  const publicPage = await visitor.newPage();
  await publicPage.goto(`${base}/t/${tag.code}?src=qr`);
  async function interaction(action) {
    const response = publicPage.waitForResponse((result) => result.url().endsWith("/api/track/service"));
    await action();
    assert.equal((await response).status(), 204);
  }
  await interaction(() => publicPage.getByText("Ver descripción", { exact: true }).click());
  await interaction(() => publicPage.getByRole("button", { name: /Imagen siguiente/ }).first().click());
  await interaction(() => publicPage.getByRole("button", { name: /Ampliar imagen/ }).click());
  assert.ok(await publicPage.getByRole("dialog").isVisible());
  await interaction(() => publicPage.getByRole("dialog").getByRole("link", { name: /Comprar esta imagen/ }).click());
  await publicPage.bringToFront();
  await publicPage.keyboard.press("Escape");
  assert.equal(await publicPage.getByRole("dialog").count(), 0);
  await publicPage.locator('a[href^="tel:"]').evaluate((anchor) => anchor.addEventListener("click", (event) => event.preventDefault()));
  await interaction(() => publicPage.getByRole("link", { name: /Llamar al negocio/ }).click());
  await interaction(() => publicPage.getByRole("link", { name: /Nuestra tienda/ }).click());
  const analytics = await (await admin.request.get(`${base}/api/businesses/${business.id}/analytics`)).json();
  for (const informationType of ["DESCRIPTION", "IMAGE", "PHONE", "STORE", "IMAGE_STORE"]) {
    assert.ok(analytics.serviceAccess.some((row) => row.serviceId === service.id && row.informationType === informationType && row.count > 0), informationType);
  }
  const badImage = await admin.request.post(`${base}/api/businesses/${business.id}/images`, { multipart: { file: { name: "bad.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") } } });
  assert.equal(badImage.status(), 400);
  const largeImage = await admin.request.post(`${base}/api/businesses/${business.id}/images`, { multipart: { file: { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) } } });
  assert.equal(largeImage.status(), 413);
  await page.reload();
  await page.getByRole("button", { name: `Edit ${service.label}`, exact: true }).click();
  assert.equal(await page.locator("textarea[name=description]").inputValue(), "Descripción de prueba persistida");
  assert.equal(await page.getByLabel("Descripción de la imagen", { exact: true }).count(), 2);
  console.log(JSON.stringify({ passed: true, deviceUploadsOnly: true, persistedService: true, carouselAndModal: true, categorizedAnalytics: true, invalidUploadsRejected: true, productionDatabaseTouched: false }));
} finally {
  if (browser) await browser.close();
  server.kill();
}

