import { NextResponse } from "next/server";

const MIN_EUR = 1;
const MAX_EUR = 1500;

type WhopCheckoutResponse = {
  purchase_url?: string;
  error?: { message?: string };
  message?: string;
};

/**
 * Creates a one-time Whop checkout for a custom EUR tip amount.
 * Requires WHOP_API_KEY in server env (never NEXT_PUBLIC_).
 * Optional: WHOP_COMPANY_ID, WHOP_PRODUCT_ID, WHOP_API_BASE.
 */
export async function POST(request: Request) {
  const apiKey = process.env.WHOP_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "Whop nuk është konfiguruar. Vendos WHOP_API_KEY në .env.local.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Kërkesë e pavlefshme" }, { status: 400 });
  }

  const raw =
    typeof body === "object" && body !== null && "amountEur" in body
      ? (body as { amountEur: unknown }).amountEur
      : undefined;
  const amountEur =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw.replace(",", "."))
        : NaN;

  if (!Number.isFinite(amountEur) || amountEur < MIN_EUR || amountEur > MAX_EUR) {
    return NextResponse.json(
      { message: `Shuma duhet të jetë midis €${MIN_EUR} dhe €${MAX_EUR}` },
      { status: 400 },
    );
  }

  // Whop expects major currency units with at most 2 decimals
  const price = Math.round(amountEur * 100) / 100;

  const apiBase =
    process.env.WHOP_API_BASE?.trim().replace(/\/$/, "") ||
    "https://api.whop.com/api/v1";

  // Current Whop API expects inline `variant` (not legacy `plan`).
  const variant: Record<string, unknown> = {
    title: "Mbështet Krahaso",
    billing_type: "one_time",
    initial_price: price,
    currency: "eur",
  };

  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  const productId = process.env.WHOP_PRODUCT_ID?.trim();
  if (productId) variant.product_id = productId;

  const payload: Record<string, unknown> = {
    mode: "payment",
    variant,
  };
  if (companyId) payload.account_id = companyId;

  const res = await fetch(`${apiBase}/checkout_configurations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as WhopCheckoutResponse & {
    error?: { message?: string; type?: string };
  };

  if (!res.ok) {
    const message =
      data.error?.message ||
      data.message ||
      "Nuk u krijua pagesa në Whop. Provo përsëri.";
    return NextResponse.json({ message }, { status: res.status >= 500 ? 502 : 400 });
  }

  const url = data.purchase_url?.trim();
  if (!url) {
    return NextResponse.json(
      { message: "Whop nuk ktheu link pagese" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url });
}
