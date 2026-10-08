import { createHmac, randomBytes } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const PASSWORD = "supersecret1";

/** Short token that will not collide with catalog data or other runs. */
export function unique(prefix = "zxq"): string {
  return `${prefix}${randomBytes(4).toString("hex")}`;
}

/** de-DE euro formatting used by the public pages, e.g. "210,00 €". */
export function euro(amount: string): RegExp {
  const [whole, fraction] = Number(amount).toFixed(2).split(".");
  return new RegExp(`${whole},${fraction}\\s*€`);
}

export async function registerSeller(page: Page, businessName: string): Promise<void> {
  await page.goto("/regjistrohu");
  await page.getByLabel("Emri i biznesit").fill(businessName);
  await page.getByLabel("Numri fiskal / i regjistrimit").fill(unique("tax"));
  await page.getByLabel("Email kontakti").fill(`${unique("seller")}@dyqan.test`);
  await page.getByLabel("Fjalëkalimi").fill(PASSWORD);
  await page.getByRole("button", { name: "Krijo llogari" }).click();
  await page.waitForURL("**/panel");
  await expect(page.getByRole("heading", { level: 1, name: businessName })).toBeVisible();
}

export function productCsv(name: string, sku: string, price: string): string {
  const url = `https://shop.test/${sku.toLowerCase()}`;
  return ["name,brand,price,url,sku", `${name},Testmark,${price},${url},${sku}`, ""].join("\n");
}

/** Upload a one-row CSV, wait out the parse, and publish it. */
export async function uploadAndPublish(page: Page, csv: string, productName: string): Promise<void> {
  await page.goto("/panel/integrimet");
  await page.locator('input[type="file"]').setInputFiles({
    name: "produkte.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  });

  await page.waitForURL("**/panel/integrimet/parapamje/**");
  await expect(page.getByRole("heading", { name: "Parapamja e feed-it" })).toBeVisible();
  await expect(page.getByRole("cell", { name: productName })).toBeVisible();

  await page.getByRole("button", { name: "Konfirmo dhe publiko 1 produkte" }).click();
  await page.waitForURL((url) => url.pathname === "/panel/integrimet");
}

/** The value shown once next to a secret label on the API key card. */
export async function secretValue(page: Page, label: string): Promise<string> {
  const block = page.getByText(label, { exact: true }).locator("xpath=..");
  const value = (await block.locator("code").textContent())?.trim();
  expect(value, `${label} is shown`).toBeTruthy();
  return value!;
}

/**
 * What a seller's system does: HMAC-SHA256 over `timestamp.body`, posted to the
 * webhook URL the panel just displayed.
 */
export async function sendPriceUpdate(
  request: APIRequestContext,
  credentials: { apiKey: string; signingSecret: string; webhookUrl: string },
  sku: string,
  price: string,
): Promise<void> {
  const body = JSON.stringify({
    eventId: unique("evt"),
    sentAt: new Date().toISOString(),
    updates: [{ sku, price }],
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", credentials.signingSecret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  const response = await request.post(credentials.webhookUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-Krahaso-Key": credentials.apiKey,
      "X-Krahaso-Timestamp": timestamp,
      "X-Krahaso-Signature": `sha256=${signature}`,
    },
    data: body,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
  expect(await response.json()).toMatchObject({ updated: 1, duplicate: false });
}
