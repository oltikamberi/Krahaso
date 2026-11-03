"use client";

import { useState } from "react";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export function ContactForm({
  kind,
}: {
  kind: "contact" | "report";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [message, setMessage] = useState("");

  const isReport = kind === "report";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const subject = isReport
      ? `${SITE_NAME}: Raportim gabimi`
      : `${SITE_NAME}: Mesazh kontakti`;
    const body = [
      name && `Emri: ${name}`,
      email && `Email: ${email}`,
      isReport && pageUrl && `Faqja: ${pageUrl}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const fieldClass =
    "w-full rounded-lg px-3 py-2.5 text-sm outline-none";
  const fieldStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  } as const;

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
          Emri
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
          autoComplete="email"
        />
      </div>
      {isReport ? (
        <div>
          <label htmlFor="pageUrl" className="mb-1.5 block text-sm font-semibold">
            Lidhja e faqes (nëse ka)
          </label>
          <input
            id="pageUrl"
            type="url"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="https://"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>
      ) : null}
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold">
          {isReport ? "Përshkrimi i gabimit" : "Mesazhi"}
        </label>
        <textarea
          id="message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} resize-y`}
          style={fieldStyle}
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-bold"
        style={{
          backgroundColor: "var(--action)",
          color: "var(--action-foreground)",
        }}
      >
        Dërgo me email
      </button>
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Hapet programi juaj i emailit drejt {CONTACT_EMAIL}. Nuk ruajmë këtë
        formular në server.
      </p>
    </form>
  );
}
