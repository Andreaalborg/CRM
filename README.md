This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Miljøvariabler: CRM_PUBLIC_URL

Sett `CRM_PUBLIC_URL=https://crm.intellisenseai.no` i Vercel (Project → Settings → Environment Variables, miljø **Production**) og redeploy. Brukes til kanoniske lenker i e-poster/innloggingslenker (`src/lib/base-url.ts`). Uten verdi faller koden tilbake til `https://crm.intellisenseai.no`, men den bør settes eksplisitt slik at preview-/git-URL-er aldri lekker inn i lenker.

## Innkommende henvendelser (kontaktskjema, e-post hei@, chat)
`POST /api/v1/inbound` (HMAC `X-IS-Timestamp`/`X-IS-Signature` med `INBOUND_WEBHOOK_SECRET`) oppretter Company/Contact/Deal i INNKOMMENDE.
- **Idempotens:** felt `ekstern_id` (Message-ID / skjema-nøkkel). Samme id to ganger → `200 {idempotent:true}`, ingen duplikat. Ingen skjemaendring (lagres i `CrmActivity.kilde` = `nettside/<kilde>#<id>`, serialisert med `pg_advisory_xact_lock`).
- **Kilder:** `kontakt` → «Kontaktskjema», `epost` → «E-post (hei@)», `chat`, `tilbud`, `ghl`. Auto-svar/no-reply (`auto_submitted`, `noreply@`, `mailer-daemon`) ignoreres (200 `ignored`).
- **Rate limit:** 30/min per `klient_ip` (saltet hash fra nettsiden, signert i body), ellers `x-forwarded-for`.
- **Varsel til eier:** `INBOUND_NOTIFY_ENABLED=1` (standard AV). Mottaker = `OWNER_NOTIFY_EMAILS` (ellers `andreaalborg@intellisenseai.no`) filtrert mot eier-vakten (standardadresse + SUPER_ADMIN i DB, env kan ikke legge til nye). Avsender `EMAIL_FROM`, reply-to `andreaalborg@intellisenseai.no`. Respekterer `OUTREACH_DRY_RUN=1`, Resend-helsesjekk (verifisert domene) og sender aldri til innsender. Varselfeil avbryter aldri lagring.
- **Status (skrivebeskyttet):** `GET /api/v1/inbox-status` (bot-nøkkel med `leads:read`): antall ubehandlede (INNKOMMENDE), eldste alder (min og arbeidstimer man–fre 08–17 Oslo, helligdager ikke trukket fra), kilde-kategori/id/tidspunkt per henvendelse. Ingen personopplysninger.
- **Lagringstid 12 mnd:** `GET|POST /api/cron/inbound-retention` (`CRON_SECRET`). **Tørrkjøring som standard.** Sletting krever både `INBOUND_RETENTION_APPLY=1` og `?apply=1`. Rører kun firma med nettside/e-post-aktivitet, uten VUNNET deal, uten aktivitet siste 12 mnd. Ikke lagt i `vercel.json`. NB: eksisterende `gdprSweep` i `/api/cron/fase3` sletter allerede alle leads uten VUNNET deal etter 12 mnd (GDPR_MONTHS=12, patch 0004), i tråd med vedtak om 12 mnd for alle leads.
