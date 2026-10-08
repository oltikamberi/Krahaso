import { expect, test } from "@playwright/test";
import {
  euro,
  productCsv,
  registerSeller,
  secretValue,
  sendPriceUpdate,
  unique,
  uploadAndPublish,
} from "./support";

test.beforeAll(async ({ request }) => {
  const site = await request.get("/");
  expect(site.ok(), "frontend is not running on :3000").toBeTruthy();
  const api = await request.get("http://localhost:8080/api/products");
  expect(api.ok(), "backend is not running on :8080").toBeTruthy();
});

test("registering a business lands on an empty, unverified dashboard", async ({ page }) => {
  const business = `Dyqani ${unique()}`;

  await registerSeller(page, business);

  await expect(page.getByText("Paneli i shitësit", { exact: true })).toBeVisible();
  await expect(page.getByText("Në pritje të verifikimit")).toBeVisible();
  await expect(page.getByText("Produkte aktive")).toBeVisible();
  await expect(page.getByText("Nuk ka të dhëna edhe")).toBeVisible();
  await expect(page.getByRole("link", { name: "Shko te integrimet" })).toBeVisible();
});

test("uploading a CSV, previewing it and publishing puts the product on search", async ({ page }) => {
  const token = unique();
  const name = `Krahaso ${token}`;
  const business = `Dyqani ${token}`;

  await registerSeller(page, business);
  await uploadAndPublish(page, productCsv(name, token.toUpperCase(), "210.00"), name);

  await page.goto(`/kerko?q=${token}`);
  await expect(page.getByRole("heading", { level: 1, name: "Rezultatet e kërkimit" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  await expect(page.getByText(euro("210.00")).first()).toBeVisible();

  await page.getByRole("heading", { level: 3, name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("1 dyqan")).toBeVisible();
  await expect(page.getByText(euro("210.00")).first()).toBeVisible();
  await expect(page.getByRole("link", { name: `Shko te ${business}` })).toBeVisible();
});

test("a signed webhook updates the price on the public product page", async ({ page, request }) => {
  const token = unique();
  const sku = token.toUpperCase();
  const name = `Krahaso ${token}`;

  await registerSeller(page, `Dyqani ${token}`);
  await uploadAndPublish(page, productCsv(name, sku, "210.00"), name);

  await page.goto(`/kerko?q=${token}`);
  await page.getByRole("heading", { level: 3, name }).click();
  await page.waitForURL("**/produkti/**");
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText(euro("210.00")).first()).toBeVisible();
  const productPath = new URL(page.url()).pathname;

  await page.goto("/panel/integrimet");
  await page.getByRole("button", { name: "Gjenero API key" }).click();
  await expect(page.getByText("Kopjoji tani — nuk do të shfaqen përsëri.")).toBeVisible();

  await sendPriceUpdate(
    request,
    {
      apiKey: await secretValue(page, "API key"),
      signingSecret: await secretValue(page, "Signing secret"),
      webhookUrl: await secretValue(page, "Webhook URL"),
    },
    sku,
    "87.50",
  );

  await page.goto(productPath);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText(euro("87.50")).first()).toBeVisible();
  await expect(page.getByText(euro("210.00"))).toHaveCount(0);

  await page.goto(`/kerko?q=${token}`);
  await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  await expect(page.getByText(euro("87.50")).first()).toBeVisible();
});
