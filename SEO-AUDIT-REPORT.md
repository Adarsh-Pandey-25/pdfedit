                                                                                                            # PdfEdit+ — SEO Audit, Fixes & Verification

                                                                                                            Site: https://www.pdfeditplus.com/ · Audit date: 2026-10-13 · Codebase: `pdfedit-main` (local, no git history)

                                                                                                            > Round 1: the Phase A/B register was written **before** any code change; C–E record round-1 results. **Round 2** (follow-up fixes, corrections and the deployment checklist) is at the end and supersedes round 1's F–H.

                                                                                                            ## A. Executive summary (updated after round 2, 2026-10-13)

                                                                                                            | | |
                                                                                                            |---|---|
                                                                                                            | Overall status | **Audit complete** for everything verifiable from code, local production builds, live HTTP, Lighthouse lab runs, Chrome network logs and Semrush. Search Console, analytics, CrUX field data and backlink quality were not accessible. |
                                                                                                            | Pages inspected | 20 indexable routes, the 404 response, `robots.txt` and `sitemap.xml` (local production build), plus the live equivalents |
                                                                                                            | Issues | 34 register entries (26 in round 1 + 8 in round 2): 0 Critical · 5 High · 14 Medium · 7 Low · 8 Informational |
                                                                                                            | Fixed in code (local) | **18**: SEO-01, 02, 04, 05, 06, 07, 08, 09, 11, 14, 15, 16 (round 1) · SEO-27, 28, 29, 30, 31, and SEO-12 at the report-only stage (round 2) |
                                                                                                            | Open | 11: nine need your decision, hosting access or a build-step change (SEO-03, 10, 12-enforce, 13, 17, 18, 21, 32, 33); two are optional low-priority code fixes (SEO-19, 20). The rest are informational. |
                                                                                                            | Main results (lab) | Homepage JS **984 KB → 178 KB**; text-to-pdf Lighthouse **56 → 87** and LCP **6.8 s → 3.3 s**; extract-text **81 → 96**; homepage Lighthouse 71 → 77 (5-run medians, same session). |
                                                                                                            | Correction to round 1 | Round 1 said the PDF tools made **0 external requests**. That was wrong: the test listened only to the page, not to Web Workers. Chrome's network log shows two external GETs: the pdf.js worker from unpkg.com and Google Fonts CSS for the signature fonts. **No file data is sent anywhere**: 0 POST/PUT requests from the app across all 20 routes. |
                                                                                                            | Deployment | **Nothing is deployed.** Every result here is local verification. Production verification is pending (see R2.9). |

                                                                                                            ---

                                                                                                            ---

                                                                                                            ## Phase A — Repository inventory

                                                                                                            | Item | Finding (evidence) |
                                                                                                            |---|---|
                                                                                                            | Framework | Next.js **14.2.35**, App Router, React 18, TypeScript 5 (`package.json`) |
                                                                                                            | Package manager / build | npm (`package-lock.json`); `npm run build` → `next build` (passes). 20 indexable pages; see R2.2 for how this reconciles with Next's page counts |
                                                                                                            | Rendering | Every route is **statically prerendered** (`○ (Static)` in build output). Tool UIs are client components loaded with `next/dynamic({ ssr:false })`; titles, H1, intro, how-to, FAQ and related links are server-rendered into HTML. |
                                                                                                            | Public routes (from `src/app`) | `/`, 16 tool routes, `/privacy`, `/terms`, `/about` (20 indexable) + `robots.txt`; `/about` exists locally but is **not yet deployed** (live returns 404). |
                                                                                                            | Metadata | Root `layout.tsx` `metadata` + `createMetadata()` / `createToolMetadata()` in `src/lib/seo.ts`; per-tool copy in `src/lib/seo-content.ts` |
                                                                                                            | Sitemap | **Static** `public/sitemap.xml` (hand-maintained) |
                                                                                                            | robots | `src/app/robots.ts` (generated) |
                                                                                                            | Structured data | `src/components/seo/StructuredData.tsx`: Organization, WebApplication, SoftwareApplication (every page), FAQPage (home + tools), BreadcrumbList + HowTo (tools) |
                                                                                                            | Fonts | `next/font/google` (self-hosted at build), plus PDF-embedding fonts in `/public/fonts` |
                                                                                                            | Images | `next/image` for logo; OG/Twitter images 1200×630 present |
                                                                                                            | Analytics | `src/components/seo/Analytics.tsx` — GA4 only if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. **Not present on live HTML** (verified). |
                                                                                                            | Hosting | Vercel (`Server: Vercel`, `X-Vercel-Cache` headers on live) |
                                                                                                            | Tests | No unit/e2e test suite. `scripts/smoke-tools.mjs` exists (re-implements logic, does not import app code). |
                                                                                                            | Lint / types | `next lint` 0 issues · `tsc --noEmit` 0 errors (pre-change) |

                                                                                                            ### Data sources used
                                                                                                            - Local production build (`next build && next start`) — rendered HTML extracted for every route (`seo-extract.mjs`).
                                                                                                            - Live site via HTTP (status codes, redirects, robots, sitemap, headers).
                                                                                                            - Lighthouse 12.2.1, mobile emulation, local production server (lab data only).
                                                                                                            - Semrush (connected account): `domain_ranks` for pdfeditplus.com and `phrase_these` (US database) for the tool keyword set.
                                                                                                            - **Not available:** Google Search Console, GA data, CrUX field data, backlink-quality review (not requested beyond the domain overview).

                                                                                                            ---

                                                                                                            ## Phase B — Issue register (pre-change)

                                                                                                            Severity scale per brief. "Status" is filled in Phase D.

                                                                                                            | ID | Sev | Area | Affected | Issue & evidence | Recommended fix | Side-effects | Verify by |
                                                                                                            |---|---|---|---|---|---|---|---|
                                                                                                            | SEO-01 | **High** | Performance | `/text-to-pdf`, `/extract-text`, `/image-to-pdf`, `/word-to-pdf`, and `/` (via prefetch) | `@pdf-lib/fontkit` (318 KB gz) and `pdf-lib` (220 KB gz) are **statically imported** through `src/lib/pdf-generator.ts` and `src/lib/pdf-themes.ts` (`import { PageSizes } from "pdf-lib"`). They download and execute on page view, not on "Convert". Measured: these 4 pages reference ~720 KB gz JS vs ~185 KB for `/merge`. Home prefetches these routes → 984 KB script, **TBT 1,110 ms, perf 70**. `/text-to-pdf` lab **LCP 6.4 s**. *(Single pre-change runs; comparisons use medians — see D and R2.2.)* | Import `pdf-generator` lazily inside the action handler; replace the single `PageSizes.A4` constant in `pdf-themes.ts` with its literal value. | None expected — same functions run, just later. First conversion has a one-time chunk download. | Bundle sizes in HTML; Lighthouse before/after; smoke-test conversions. |
                                                                                                            | SEO-02 | **High** | Content accuracy | `/compress`, `/unlock` | Copy implies normal PDF output ("Some modes reduce image quality"; unlock "so you can edit… again"). Code (`CompressClient.tsx:52-55`, `UnlockClient.tsx:52-55`) **rasterizes every page to JPEG at all levels** → text is no longer selectable/searchable; text-only PDFs may grow. | Correct the FAQ/intro text to describe actual output. No functional change. | Visible copy change (accuracy). | Rendered HTML contains corrected text. |
                                                                                                            | SEO-03 | **High** | Trust / E-E-A-T, legal | `/` (HomeBelowFold) | "Loved by thousands" + three named 5-star testimonials (Priya Sharma, Marcus Chen, Elena Rossi). No source in repo; Semrush shows ~0 organic traffic. If not genuine, this is a fabricated-review risk (e.g., FTC rule on fake reviews/testimonials). | **Owner decision.** Replace with verifiable quotes or remove. | Visible content change. | — |
                                                                                                            | SEO-04 | Medium | Sitemap | `public/sitemap.xml` | Hand-maintained; hostname hard-coded while robots/canonicals use `SITE_URL`; every `lastmod` identical (`2026-10-08`) so it carries no signal; `/about` had to be added by hand. | Generate with `src/app/sitemap.ts` from `TOOLS` + static pages + `SITE_URL`; omit `lastmod`/`priority` rather than publish fake values. | Same URL `/sitemap.xml`. | Fetch & XML-validate; URL set = route set. |
                                                                                                            | SEO-05 | Medium | Canonical | 404 responses | Root layout sets `alternates.canonical = SITE_URL`; pages without own metadata inherit it. Rendered 404 has **canonical → homepage** and homepage title. (Next adds `noindex` so impact is limited.) | Drop the layout-level canonical (every real page sets its own) and give `not-found` its own title. | None — all 20 pages set explicit canonicals (verified). | Re-extract canonicals for all routes + 404. |
                                                                                                            | SEO-06 | Medium | Titles / keyword mapping | `/pdf-to-image`, `/image-to-pdf`, `/extract-text`, `/unlock` | Semrush US: "pdf to jpg" 301K vs "pdf to image" 14.8K; "jpg to pdf" 450K vs "image to pdf" 49.5K; "pdf to text" 8.1K vs "extract text from pdf" 3.6K. Titles only target the smaller variant even though the tools output/accept JPG/PNG and produce text. `/unlock` title "Unlock PDF Remove Password" is ungrammatical. | Adjust those 4 `<title>` segments only (accurate to features). H1s/URLs unchanged. | SERP title change only. | Re-extract titles; duplicates check. |
                                                                                                            | SEO-07 | Medium | Structured data | `/` | No `WebSite` schema — Google uses it to choose the displayed site name. | Add `WebSite` (name, alternateName, url) on the homepage only. | None. | JSON parses; present only on `/`. |
                                                                                                            | SEO-08 | Medium | Accessibility | Home tool cards, "Related PDF tools" links | Lighthouse `label-content-name-mismatch` (WCAG 2.5.3): `aria-label="Open Merge PDF — …"` overrides visible text. | Remove the overriding `aria-label`s; visible text becomes the accessible name. | None visual. | Lighthouse a11y audit. |
                                                                                                            | SEO-09 | Medium | Accessibility / navigation | Navbar "All tools" | Dropdown opens on `group-hover` only; links are `visibility:hidden` for keyboard users. | Add `group-focus-within` visibility classes. | None for mouse users. | Keyboard focus reveals menu (class present in HTML). |
                                                                                                            | SEO-10 | Medium | Accessibility | Sitewide | Lighthouse `color-contrast`: brand orange `#F97316` with white text / on cream ≈ 2.8:1 (< 4.5:1). | **Design decision** — e.g., use `primary-dark` (#C2410C) for text & button fills. Not changed (brand). | Visual change. | — |
                                                                                                            | SEO-11 | Medium | Content accuracy | `/word-to-pdf` | Copy says "Headings, lists, and formatting are mapped" — parser (`pdf-content-parser.ts`) has no image handling and flattens tables. | Add an FAQ stating images aren't included and tables are simplified. | Visible copy addition. | Rendered HTML. |
                                                                                                            | SEO-12 | Medium | Security | `next.config.mjs` | No `Content-Security-Policy`. App loads pdf.js worker from unpkg and Google Fonts CSS at runtime, so a CSP needs careful allow-listing. | Recommend CSP rollout in Report-Only first. **Not implemented** (functional risk). | Could break worker/fonts if wrong. | — |
                                                                                                            | SEO-13 | Medium | Privacy consistency | `/privacy` §5 vs `Analytics.tsx` | Privacy page says no third-party analytics suite; GA4 loads if the env var is set. Live: not set (consistent today). | If GA is ever enabled, update the privacy policy (and consent where required) first. | — | Live HTML check (done: no GA). |
                                                                                                            | SEO-14 | Low | robots.txt | `src/app/robots.ts` | Separate `Googlebot` group makes Googlebot ignore the `*` group; `Host:` is given a full URL (non-standard; Yandex dropped support). | Single `*` group + `Sitemap:`. | None (nothing is meant to be blocked). | Fetch `/robots.txt`. |
                                                                                                            | SEO-15 | Low | Accessibility | Home testimonials | `aria-label` on a plain `<div>` (aria-prohibited-attr). | Add `role="img"`. | None. | Lighthouse. |
                                                                                                            | SEO-16 | Low | Content / links | `/` | "Fifteen professional tools" — there are 16. Internal links use `<a>` (full reload). | Use `TOOLS.length`; use `next/link`. | None visual. | Rendered HTML. |
                                                                                                            | SEO-17 | Low | Links / UX | Footer | Social icons X/Share/Website link to `#`; newsletter form `preventDefault`s and does nothing. | **Owner input** — real profile URLs or remove; wire or remove form. | Visual. | — |
                                                                                                            | SEO-18 | Low | Redirects | Hosting | `http://pdfeditplus.com` → `https://pdfeditplus.com` → `https://www…` (2 hops, 308). Other variants are 1 hop. | Vercel domain settings: redirect apex directly to `https://www`. | — | curl chain. |
                                                                                                            | SEO-19 | Low | Hydration | `Footer.tsx:9` | `new Date().getFullYear()` in a statically built client component → mismatch after New Year until redeploy. | `suppressHydrationWarning` or build-time constant. Not changed (non-SEO). | — | — |
                                                                                                            | SEO-20 | Low | Performance | Logo | Both light & dark logo `<Image priority>` → both preloaded with `fetchpriority=high` (Lighthouse offscreen-images, ~8 KB). | Optional. Not changed. | — | — |
                                                                                                            | SEO-21 | Info | Third parties | `pdfjs.ts:17`, `SignatureModal.tsx:62`, `signature-engine.ts:66` | pdf.js worker from unpkg; Google Fonts CSS at runtime (IP exposure; offline FAQ claim depends on it). Privacy page §3 discloses generically. | Consider self-hosting the worker & signature fonts. | — | — |
                                                                                                            | SEO-22 | Info | Structured data | All | HowTo rich results were retired by Google (2023); FAQ rich results are limited to authoritative gov/health sites; SoftwareApplication rich results need ratings (none — must not be fabricated). Markup is valid and harmless. | Leave as-is. | — | JSON-LD parses on all pages. |
                                                                                                            | SEO-23 | Info | Structured data | Tool pages | BreadcrumbList middle item uses `/#tools` (fragment). Matches visible breadcrumb. | Leave. | — | — |
                                                                                                            | SEO-24 | Info | Off-page | Domain | Semrush `domain_ranks`: ~1 ranking keyword, ~0 estimated organic traffic in every database listed → new domain; head terms (KD 80–94) are unrealistic short-term. | Prioritise lower-KD intents: text to pdf (KD 26), add page numbers (39), extract text/pdf to text (40/46), unlock/remove password (41/42), watermark (42), split (49). | — | — |
                                                                                                            | SEO-25 | Info | Content depth | Tool pages | ~190–300 words of server-rendered copy each, consistent template. Adequate for tool intent; don't pad. | No change. | — | — |
                                                                                                            | SEO-26 | Info | Internal links | Footer | Footer lists 12/16 tools; the other 4 are linked from navbar dropdown, home grid, and related-tools blocks (no orphans). | No change. | — | Link extraction. |

**Verified OK (no action):** all 20 routes return 200 with `index, follow`; every title, description and canonical is **unique** (0 duplicates); exactly one H1 per page; no `<img>` without `alt`; `lang="en"`; HTTPS + HSTS; non-www/http variants 308 → `https://www`; trailing slash 308 → no slash; no `X-Robots-Tag`; OG/Twitter images 1200×630; JSON-LD parses on every page; **no client code transmits file data** (all `fetch()` calls read `data:` URLs or same-origin fonts); no `.env`/secrets in repo.


                                                                                                            ---

                                                                                                            ## C. Page-by-page SEO table (rendered from the final local production build, after rounds 1 and 2)

                                                                                                            Volumes/KD: Semrush US database, pulled 2026-10-13 — estimates, not Google data. Meta descriptions were all unique and accurate, so none were rewritten.

                                                                                                            | URL | Primary topic | US vol / KD | Title before audit | Title now | Meta description | H1 | Canonical | Indexable | Status |
                                                                                                            |---|---|---|---|---|---|---|---|---|---|
                                                                                                            | `/` | free pdf editor · pdf editor | 90.5K/79 · 246K/94 | PdfEdit+ - Free Online PDF Editor \| Merge, Split, Convert | unchanged | unique, unchanged | Edit, Convert & Manage PDFs Free & Online | self | 200, index/follow | unchanged |
                                                                                                            | `/merge` | merge pdf | 135K/62 | Merge PDF Files Online Free \| PdfEdit+ | unchanged | unique, unchanged | Merge PDF Files Online Free | self | 200, index/follow | unchanged |
                                                                                                            | `/split` | split pdf | 40.5K/49 | Split PDF Online Free \| PdfEdit+ | unchanged | unique, unchanged | Split PDF Online Free | self | 200, index/follow | unchanged |
                                                                                                            | `/compress` | compress pdf | 135K/76 | Compress PDF Online Free \| PdfEdit+ | unchanged | unique, unchanged | Compress PDF Online Free | self | 200, index/follow | unchanged |
                                                                                                            | `/pdf-to-image` | pdf to jpg · pdf to image | 301K/81 · 14.8K/70 | PDF to Image Converter Free \| PdfEdit+ | PDF to JPG & PNG Converter Free \| PdfEdit+ | unique, unchanged | Convert PDF to Image Online | self | 200, index/follow | updated |
                                                                                                            | `/image-to-pdf` | jpg to pdf · image to pdf | 450K/85 · 49.5K/66 | Image to PDF Converter Free \| PdfEdit+ | JPG to PDF – Convert Images to PDF Free \| PdfEdit+ | unique, unchanged | Convert Images to PDF Online | self | 200, index/follow | updated |
                                                                                                            | `/word-to-pdf` | word to pdf | 110K/77 | Word to PDF Converter Free \| PdfEdit+ | unchanged | unique, unchanged | Convert Word to PDF Online | self | 200, index/follow | unchanged |
                                                                                                            | `/text-to-pdf` | text to pdf | 4.4K/26 | Text to PDF Online Free \| PdfEdit+ | unchanged | unique, unchanged | Create a PDF from Text Online | self | 200, index/follow | unchanged |
                                                                                                            | `/rotate` | rotate pdf | 8.1K/59 | Rotate PDF Pages Online Free \| PdfEdit+ | unchanged | unique, unchanged | Rotate PDF Pages Online | self | 200, index/follow | unchanged |
                                                                                                            | `/watermark` | add watermark to pdf | 1.6K/42 | Add Watermark to PDF Free \| PdfEdit+ | unchanged | rewritten (accuracy) | Add a Watermark to PDF Online | self | 200, index/follow | updated |
                                                                                                            | `/page-numbers` | add page numbers to pdf | 1.9K/39 | Add Page Numbers to PDF Free \| PdfEdit+ | unchanged | unique, unchanged | Add Page Numbers to PDF Online | self | 200, index/follow | unchanged |
                                                                                                            | `/viewer` | pdf viewer | 9.9K/85 | PDF Viewer Online Free \| PdfEdit+ | unchanged | unique, unchanged | Free Online PDF Viewer | self | 200, index/follow | unchanged |
                                                                                                            | `/edit` | edit pdf | 74K/93 | Edit PDF Online Free \| PdfEdit+ | unchanged | unique, unchanged | Edit PDF Online Free | self | 200, index/follow | unchanged |
                                                                                                            | `/protect` | password protect pdf | 4.4K/56 | Password Protect PDF Free \| PdfEdit+ | unchanged | unique, unchanged | Password Protect a PDF Online | self | 200, index/follow | unchanged |
                                                                                                            | `/unlock` | unlock pdf · remove password from pdf | 12.1K/41 · 6.6K/42 | Unlock PDF Remove Password \| PdfEdit+ | Unlock PDF – Remove PDF Password Free \| PdfEdit+ | unique, unchanged | Unlock a Password-Protected PDF | self | 200, index/follow | updated |
                                                                                                            | `/sign` | sign pdf | 12.1K/56 | Sign PDF Online Free \| PdfEdit+ | unchanged | unique, unchanged | Sign PDF Online Free | self | 200, index/follow | unchanged |
                                                                                                            | `/extract-text` | extract text from pdf · pdf to text | 3.6K/40 · 8.1K/46 | Extract Text from PDF Free \| PdfEdit+ | Extract Text from PDF – PDF to Text Free \| PdfEdit+ | unique, unchanged | Extract Text from PDF Online | self | 200, index/follow | updated |
                                                                                                            | `/privacy` | — (legal page) | — | Privacy Policy \| PdfEdit+ | unchanged | unique, unchanged | Privacy Policy | self | 200, index/follow | unchanged |
                                                                                                            | `/terms` | — (legal page) | — | Terms of Service \| PdfEdit+ | unchanged | unique, unchanged | Terms of Service | self | 200, index/follow | unchanged |
                                                                                                            | `/about` | — (brand page) | — | About Us \| PdfEdit+ | unchanged | unique, unchanged | PDF tools that stay out of your way — and off our servers | self | 200, index/follow | unchanged |

                                                                                                            The 404 response (any unknown URL) now renders title "Page not found | PdfEdit+", **no canonical**, `noindex`, HTTP 404.

                                                                                                            ---

                                                                                                            ## D. Technical SEO report (verification results)

                                                                                                            | Area | Result | Evidence |
                                                                                                            |---|---|---|
                                                                                                            | Build / lint / types | **Pass** | `next build` (26 static pages incl. generated `/sitemap.xml`), `next lint` 0 issues, `tsc --noEmit` 0 errors |
                                                                                                            | HTTP status | **Pass** — 20/20 routes 200; unknown route 404 | `seo-extract.mjs` on production server |
                                                                                                            | Titles / descriptions / canonicals | **Pass** — 0 missing, 0 duplicates; every canonical self-referencing | same |
                                                                                                            | Client-side navigation metadata | **Pass** — title, description and canonical update on SPA navigation (`/`→`/merge`→`/pdf-to-image`→`/about`) | Puppeteer, no full reload |
                                                                                                            | H1 | **Pass** — exactly one per page | extraction |
                                                                                                            | sitemap.xml | **Pass** — valid `urlset`, `application/xml`, 20 URLs = 20 indexable routes, no extras, no duplicates | `verify.mjs` |
                                                                                                            | robots.txt | **Pass** — single `*` group, `Sitemap:` line, nothing important blocked | fetched |
                                                                                                            | Redirects (live) | https://www ✓ · apex → www 308 (1 hop) · http://www → https 308 (1 hop) · **http://apex → https://apex → https://www (2 hops)** · trailing slash → 308 to slashless | curl |
                                                                                                            | Structured data | **Pass** — every JSON-LD block parses on every route; `WebSite` only on `/` | `verify.mjs`. Google Rich Results Test not run (needs the live URL — see F). |
                                                                                                            | Internal links | **Pass** — 20 unique internal targets, all 200 | `verify.mjs` |
                                                                                                            | Accessibility (Lighthouse) | home **92→96**; `label-content-name-mismatch` and `aria-prohibited-attr` cleared on home; keyboard focus now opens "All tools" (visibility hidden→visible) | Lighthouse, Puppeteer. Remaining: brand-orange contrast (SEO-10), tool dropzone `aria-label` mismatch. |
                                                                                                            | Mobile layout | **Pass** — no horizontal overflow at 375 px on `/`, `/merge`, `/text-to-pdf`, `/about`, `/privacy` | Puppeteer |
                                                                                                            | Functionality | **Pass** — Text→PDF, Extract text (text matched), Image→PDF, Word→PDF each produced a valid 1-page PDF on both the before and after builds, with identical sizes. Project smoke script: 15/15 pass. | `smoke.mjs`, `scripts/smoke-tools.mjs` |
                                                                                                            | Privacy | **Corrected in round 2.** No file data is sent anywhere: 0 POST/PUT requests from the app. But **2 external GETs** do occur: the pdf.js worker from unpkg.com and Google Fonts CSS. Round 1 wrongly reported 0 external requests because its listener missed Web Worker traffic. See R2.3. | Chrome net-log (page + workers), code grep, live HTML |
                                                                                                            | Security headers | HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy present; **no CSP** (SEO-12) | live headers |

                                                                                                            ### Performance (round 1) — interleaved A/B, Lighthouse 12.2.1 mobile (lab), median of 3 · round-2 numbers are in R2.4

                                                                                                            | Page | Build | Perf | LCP | TBT | CLS | Script transfer |
                                                                                                            |---|---|---|---|---|---|---|
                                                                                                            | `/text-to-pdf` | before | 56 | 6.8 s | 889 ms | 0.068 | 712 KB |
                                                                                                            | | **after** | **87** | **3.3 s** | **245 ms** | **0** | **169 KB** |
                                                                                                            | `/extract-text` | before | 81 | 2.5 s | 631 ms | 0.049 | 715 KB |
                                                                                                            | | **after** | **96** | 2.5 s | **103 ms** | 0.049 | **172 KB** |
                                                                                                            | `/` | before | 62 | 3.8 s | 1,328 ms | 0.000 | 984 KB |
                                                                                                            | | **after** | **66** | **3.5 s** | **1,150 ms** | 0.000 | **477 KB** |

                                                                                                            Notes: lab numbers from a developer laptop with other processes running. Single runs varied by about ±10 points, so the table reports medians of interleaved runs. Homepage TBT is still too high. The remaining cost is hydration plus prefetching of the 16 tool-route links (item 6 in G). These are lab measurements, not the 75th-percentile field data that Core Web Vitals are assessed on.

                                                                                                            ---

                                                                                                            ## E. Exact code change log

                                                                                                            All changes are additive or minimal. Routes, URLs, layouts, colours and logic paths are unchanged apart from what is listed. Original copies of every touched file were saved before editing.

                                                                                                            | File | Change | Why (ID) | UI / functionality affected? | Test |
                                                                                                            |---|---|---|---|---|
                                                                                                            | `src/app/text-to-pdf/TextToPdfClient.tsx`, `src/app/extract-text/ExtractTextClient.tsx`, `src/app/word-to-pdf/WordToPdfClient.tsx`, `src/app/image-to-pdf/ImageToPdfClient.tsx` | Static `import … from "@/lib/pdf-generator"` → `await import("@/lib/pdf-generator")` inside the existing `try` of the convert handler (type-only import kept for `PdfImageInput`) | SEO-01 | No UI change. The first conversion downloads the PDF engine on demand, the same way `mammoth` already loaded. | A/B Lighthouse; smoke PASS ×4 |
                                                                                                            | `src/lib/pdf-themes.ts` | `PageSizes.A4` from pdf-lib → identical literal `[595.28, 841.89]` | SEO-01 | None (same value) | build sizes; smoke PASS |
                                                                                                            | `src/lib/seo-content.ts` | 4 titles (`pdf-to-image`, `image-to-pdf`, `extract-text`, `unlock`); compress FAQ corrected + 1 new FAQ; unlock intro "edit"→"annotate" + 1 new FAQ; word-to-pdf 1 new FAQ | SEO-06, SEO-02, SEO-11 | Visible copy on those 4 pages; FAQ JSON-LD updates automatically | rendered-HTML checks PASS |
                                                                                                            | `src/app/sitemap.ts` (new) · `public/sitemap.xml` (removed) | Sitemap generated from `SITE_URL` + `TOOLS` + about/privacy/terms; no fake `lastmod`/`priority` | SEO-04 | None | 20/20 match |
                                                                                                            | `src/app/robots.ts` | Removed Googlebot-only group and `host` | SEO-14 | None | fetched |
                                                                                                            | `src/app/layout.tsx` | Removed layout-level `alternates.canonical` | SEO-05 | None (all pages set their own) | canonicals re-verified |
                                                                                                            | `src/app/not-found.tsx` | Added `metadata` (title "Page not found", noindex) | SEO-05 | None visual | 404 check |
                                                                                                            | `src/components/seo/StructuredData.tsx`, `src/app/page.tsx` | New `WebSiteSchema`, rendered on home only | SEO-07 | None visual | JSON-LD parse |
                                                                                                            | `src/app/page.tsx` | "Fifteen" → `{TOOLS.length}` (16); 3 inline `<a>` → `next/link` | SEO-16 | Text now reads "16 professional tools" | HTML check |
                                                                                                            | `src/components/shared/ToolCard.tsx`, `src/components/seo/ToolSeoContent.tsx` | Removed overriding `aria-label`s | SEO-08 | None visual | Lighthouse |
                                                                                                            | `src/components/layout/Navbar.tsx` | Added `group-focus-within:visible group-focus-within:opacity-100` | SEO-09 | Menu also opens on keyboard focus | Puppeteer |
                                                                                                            | `src/components/home/HomeBelowFold.tsx` | `role="img"` on star rating | SEO-15 | None | Lighthouse |
                                                                                                            | `SEO-AUDIT-REPORT.md` (new) | This report | — | — | — |

                                                                                                            Dependencies were installed with `npm install` to run the build. `package.json` was not changed.

                                                                                                            ---

                                                                                                            ## F–H (round 1). Superseded

                                                                                                            Round 1's outstanding tasks, checklist and verdict are replaced by **Round 2** below.

                                                                                                            ---

                                                                                                            # Round 2 — follow-up fixes and verification (2026-10-13)

                                                                                                            **Version control.** The project is **not a git repository** (`git status` → "not a git repository"), so there is no git diff. Before each round of edits, the original files were backed up outside the project, and every change is listed in R2.8.

                                                                                                            **How builds were tested.** Every build and measurement ran in throw-away copies of the project outside your folder (`node_modules` linked in). Your dev server on port 3000 kept running throughout and was checked afterwards (pages and CSS return 200). This avoids repeating a round-1 mistake: a build inside the project folder overwrote the dev server's `.next` folder and left it serving pages without CSS. That has since been repaired.

                                                                                                            ## R2.1 `/about` route (item 1)

                                                                                                            | | Local build | Production (checked 2026-10-13) |
                                                                                                            |---|---|---|
                                                                                                            | `GET /about` | 200, title "About Us \| PdfEdit+" | **404** |
                                                                                                            | Canonical | `https://www.pdfeditplus.com/about` (self) | — |
                                                                                                            | In sitemap | yes (generated `sitemap.ts`) | no (live `sitemap.xml` is the old static file, 19 URLs) |
                                                                                                            | Linked from | footer ("About") | not linked |

                                                                                                            **Verdict:** the route is intended (you asked for it earlier in this session). It is consistent locally and simply not deployed yet. The page, its sitemap entry and its footer link ship in the same deploy, so production never lists a 404 in the sitemap. **No change needed.** After deploying, confirm `/about` returns 200 and request indexing in Search Console.

                                                                                                            ## R2.2 Report corrections (item 2)

                                                                                                            - **Metadata table (C):** regenerated by a script that escapes the `|` inside titles. Every row now has exactly 10 cells (the script checks this). Previously the rows had 12–13 cells against an 11-column header, which broke the table.
                                                                                                            - **Route counts reconciled:**
                                                                                                              - **20** indexable pages: `/`, 16 tools, `/about`, `/privacy`, `/terms`.
                                                                                                              - The build's route table has **23** entries: those 20 plus `/_not-found`, `/robots.txt` and `/sitemap.xml`.
                                                                                                              - Next's "Generating static pages (26/26)" also counts internal entries such as `/favicon.ico`.
                                                                                                              - Round 1's "25 static pages" was from before `sitemap.ts` existed.
                                                                                                              - The live sitemap has **19** URLs (no `/about`); the local one has **20**.
                                                                                                            - **Performance numbers reconciled.** The register's "perf 70 / TBT 1,110 ms / LCP 6.4 s" figures are **single runs** taken before any change. Every comparison table uses **medians of interleaved runs within one session**. The same unchanged homepage code had a median TBT anywhere from **467 to 1,150 ms** depending on the session, because laptop load varies. So absolute TBT values must not be compared across sessions. JS bytes are deterministic, and they are the most reliable signal here: 984 → 477 KB (round 1) → 178 KB (round 2).

                                                                                                            ## R2.3 Claims verified against code (item 3)

                                                                                                            | Claim (where) | Evidence | Verdict / action |
                                                                                                            |---|---|---|
                                                                                                            | "Files never leave your device / never uploaded" (home, tools, privacy, about) | Chrome net-log (includes workers) across all 20 routes, with a PDF/PNG/DOCX loaded into 16 tools: **0 non-GET requests from the app**. Every `fetch()` in `src/` reads a `data:` URL or a same-origin font. | **True.** |
                                                                                                            | "Processed locally" | Same evidence. The only external requests are GET `unpkg.com/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs` (code) and GET `fonts.googleapis.com/css2` (signature fonts). | **True**, but processing still depends on those two third parties (see R2.6). |
                                                                                                            | Compress "reduce size" | `CompressClient.tsx:17-20, 52-55` — every level re-renders pages to JPEG | Copy already corrected in round 1. |
                                                                                                            | Unlock "remove password" | `UnlockClient.tsx:40, 52-55` — needs the password; output is page images | Copy already corrected in round 1. |
                                                                                                            | Protect "password + permissions" | `ProtectClient.tsx:19-20, 95`; `operations.ts:203-214` | **True.** Strength depends on the input PDF's version (`@cantoo/pdf-lib` `PDFSecurity.js:20-34`): 40-bit RC4 (≤1.3 / 2.0), RC4 (1.4–1.5), AES-128 (1.6–1.7), AES-256 only for 1.7ext3. The copy makes no strength claim → SEO-33. |
                                                                                                            | Word→PDF structure | `pdf-content-parser.ts:133-137` (tables flattened; no image handling) | Round-1 FAQ is accurate. |
                                                                                                            | **Watermark "text or image watermarks", "tile placement"** | `watermark-engine.ts:12-22, 66-79` has text settings and 9 fixed positions only; the UI's only file input accepts PDFs | **False.** Corrected: text-only copy, nine positions (SEO-27). |
                                                                                                            | **"Runs using WebAssembly"** (home FAQ, browser FAQ, about) | No `wasmUrl`/WASM configuration anywhere in `src/` | **False.** Wording corrected (SEO-28). |
                                                                                                            | **"Works offline after the app loads"** (home FAQ) | No service worker; each tool's code (and pdf-lib / fontkit / pdf.js) loads on demand | **False.** Corrected to "Not yet…" (SEO-28). |
                                                                                                            | Image→PDF output (implied unmodified) | `ImageToPdfClient.tsx:78` `showFooter: true`; `pdf-generator.ts:686` prints "1 / N" on every page | Was undisclosed. **Disclosed in an FAQ** (SEO-29). Making it optional is a product decision. |
                                                                                                            | Privacy policy §3–§5 | §3 CDN worker ✓; §4 IndexedDB editor session (`editor-session.ts`), signatures in localStorage (`SignatureModal.tsx:22,32`, `SignatureBuilder.tsx:33,48`), debug flag (`coords.ts:295`) ✓; §5 no analytics ✓ (GA env var unset; no GA tag on live HTML) | **Accurate.** |
                                                                                                            | Upload limits | Hero 100 MB (`HeroSection.tsx:13`), tools 50 MB (`constants.ts:30`); FAQ states both | **Accurate.** |
                                                                                                            | Testimonials, "Loved by thousands" (home) | No source in the repo | **Unverified.** Not changed (SEO-03, your decision). No testimonials, reviews or counts were added. |
                                                                                                            | About page: origin story ("started from a simple frustration…") and "We read every email" | **I wrote these in this session without a source** | **Unverified.** Not changed; confirm or replace (SEO-32). The About stats ("16 tools", "$0", "0 files uploaded") are verified: `TOOLS.length` and the net-log evidence above. |

                                                                                                            ## R2.4 Homepage performance (item 4)

                                                                                                            **Diagnosis** (Lighthouse + raw Chrome trace, 4× CPU throttle, mobile viewport):
                                                                                                            - About 2 s of script, mostly Next.js/React hydration: framework chunk `6170` and the webpack runtime.
                                                                                                            - About 1.0 s of layout and 0.4 s of style recalculation.
                                                                                                            - **255 ms of script and a 207 KB gzipped download from the editor bundle (`EditClient`)**, which the homepage never uses. It was pulled in by viewport prefetching:
                                                                                                              - `ToolCard` links had `prefetch`.
                                                                                                              - The navbar "All tools" menu is always in the DOM, so its 16 links were prefetched on every page (desktop).
                                                                                                              - The three inline homepage links that round 1 converted from `<a>` to `<Link>` (SEO-16) also enabled prefetching. **That part was a regression I introduced in round 1.**

                                                                                                            **Changes and measurements.** Each step is an interleaved Lighthouse mobile comparison against A (round-1 code), 5 runs, medians:

                                                                                                            | Step | Change | Perf | LCP | TBT | Homepage JS |
                                                                                                            |---|---|---|---|---|---|
                                                                                                            | A → B | ToolCard + navbar menu: viewport prefetch → prefetch on hover/focus | 78 → 78 | 3.2 → 3.1 s | 586 → 540 ms | 477 → 439 KB |
                                                                                                            | A → C | B + the 3 inline links `prefetch={false}` (editor bundle no longer loads) | 71 → 81 | 3.5 → 3.3 s | 467 → 438 ms | 477 → **172 KB** |
                                                                                                            | A → final | everything in round 2 (adds CSP header + copy) | 71 → 77 | 3.3 → 3.1 s | 708 → 625 ms | 477 → **178 KB** |

                                                                                                            Navigation speed when a user intends to click is preserved: `ToolCard` already prefetched route data and bundles on hover, focus and touch (`warm()`), and the navbar menu links now do the same.

                                                                                                            **Tested but not changed** (runtime overrides only, 3 runs each):
                                                                                                            - Removing `text-wrap: balance`, blocking web fonts, or disabling the fade-up animations each cut about 250 ms of layout. That's within run-to-run noise, and all three would change the design.

                                                                                                            **Remaining:** homepage TBT is still about 450–650 ms in this lab setup. That is framework hydration. Reducing it further would mean moving homepage components to server components or upgrading Next.js/React, which is out of scope here. All of this is lab data; field data (CrUX, INP) will only exist after deploy and traffic.

                                                                                                            ## R2.5 Accessibility and colour contrast (item 5)

                                                                                                            Lighthouse accessibility is **96** on `/`, `/merge`, `/about`, `/edit`, `/sign` and `/privacy`. Every remaining failure is **brand-orange contrast**. Fixed without any visual change: tool dropzones (`FileUploader`) set an `aria-label` that didn't contain their visible text (WCAG 2.5.3). That rule now passes on `/merge`, `/edit` and `/sign`.

                                                                                                            Contrast pairs found (computed WCAG ratios):

                                                                                                            | Pair | Ratio | Needed | Where |
                                                                                                            |---|---|---|---|
                                                                                                            | white on `#F97316` (buttons, banners) | 2.80 | 4.5 (3.0 for large text) | all pages |
                                                                                                            | `#F97316` on cream `#FFF7ED` (links, labels, stats) | 2.64 | 4.5 / 3.0 | home, about, privacy |
                                                                                                            | `#F97316` on white (step labels) | 2.80 | 4.5 | home |
                                                                                                            | `#F97316` on the pale pill `#FEEAD8` | 2.40 | 4.5 | about |

                                                                                                            Options. **Not implemented: this needs your design approval.**
                                                                                                            - `#EA580C`: 3.56 on white. Passes for large text only, so it isn't enough for 14 px text.
                                                                                                            - **`#C2410C`** (your existing `primary-dark` token): **5.18** with white text, **4.88** on cream, **4.43** on the pill. Passes everywhere except the pill (just under 4.5).
                                                                                                            - Minimal-change version: use `primary-dark` only for small orange text and for orange fills behind white text, and keep `#F97316` for large decorative elements.

                                                                                                            ## R2.6 External assets and security headers (item 6)

                                                                                                            **Existing headers** (live and local): HSTS (2 years, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`. Unchanged.

                                                                                                            **CSP, added in Report-Only mode** (`next.config.mjs`). Browsers log violations to the console but block nothing:

                                                                                                            ```
                                                                                                            default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                                                                                                            font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' data: blob:;
                                                                                                            worker-src 'self' blob: https://unpkg.com; frame-src 'self' blob:; object-src 'none'; base-uri 'self';
                                                                                                            form-action 'self'; frame-ancestors 'self'
                                                                                                            ```

                                                                                                            - If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set at build time, the Google Analytics hosts are added automatically.
                                                                                                            - `'unsafe-inline'` for scripts is unavoidable on statically rendered Next.js pages; nonces require dynamic rendering.
                                                                                                            - **Test:** all 20 routes, with files loaded into 16 tools, produced **0 violations** and **0 page errors**.
                                                                                                            - **Positive control:** injecting an external fetch, script and image produced 4 `report`-mode violations, so the detector works.
                                                                                                            - **Not covered:** the editor's print/iframe path and the signature-drawing modal weren't exercised, so check them in the browser console after deploy.
                                                                                                            - **Enforcement needs your approval:** after a clean production observation period, rename the header key to `Content-Security-Policy`. There is no reporting endpoint, so production violations appear only in each visitor's console. Adding one (`report-to`) means adding a third-party service or a serverless endpoint, which is your call.

                                                                                                            **Third-party runtime dependencies:**

                                                                                                            | Asset | Used by | Risk | Status |
                                                                                                            |---|---|---|---|
                                                                                                            | `unpkg.com/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs` | Every pdf.js tool (viewer, split, rotate, pdf→image, compress, unlock, extract-text, sign, watermark preview, edit) | If unpkg is down or blocked, **all of these tools fail**; also exposes visitors' IPs to unpkg | **Self-hosting attempted and reverted.** Bundling the worker with `new URL(…, import.meta.url)` fails in Next 14 ("Syntax Error": the minifier re-parses the ES-module worker). Proposal, needs your approval because it changes the build: a `prebuild`/`predev` script copies `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` into `public/pdfjs/`, and `workerSrc` points there. This keeps it version-locked to the installed pdfjs-dist. |
                                                                                                            | `fonts.googleapis.com` / `fonts.gstatic.com` | Signature tools (Caveat, Dancing Script, Great Vibes, Pacifico) | Visitors' IPs go to Google | Proposal: self-host the 4 OFL fonts in `/public/fonts`. Not done, because the font-family names are referenced across the signature code. |
                                                                                                            | Google Fonts **at build time** (`next/font`, Plus Jakarta Sans and JetBrains Mono) | Every build | One build failed with a `next/font` fetch error; the retry passed | Informational (SEO-34): a Vercel build can fail the same way, and a redeploy fixes it. |

                                                                                                            ## R2.7 Final verification (item 7) — local production build

                                                                                                            | Check | Result |
                                                                                                            |---|---|
                                                                                                            | `tsc --noEmit` | 0 errors |
                                                                                                            | `next lint` | 0 warnings / errors |
                                                                                                            | `next build` | pass (2nd attempt; 1st hit the transient Google Fonts fetch, SEO-34) |
                                                                                                            | Metadata (20 routes): status, titles, descriptions, canonicals, H1, robots | **28 / 28 automated checks pass.** All 200 and index/follow; titles, descriptions and canonicals present, unique and self-referencing; one H1 each; 404 → no canonical + noindex |
                                                                                                            | Sitemap / robots | valid urlset; 20 URLs = 20 indexable routes, incl. `/about`; robots has a single `*` group + `Sitemap:` |
                                                                                                            | JSON-LD / internal links | all blocks parse, WebSite only on `/`; 20/20 internal targets return 200 |
                                                                                                            | Copy corrections in rendered HTML | all present (watermark, image-to-pdf FAQ, offline/WebAssembly FAQs, about) |
                                                                                                            | Network (Chrome net-log, page + workers) | 84 app requests; **0 non-GET**; external: the unpkg worker + Google Fonts CSS only |
                                                                                                            | CSP report-only | 0 violations, 0 page errors on 20 routes; positive control OK |
                                                                                                            | PDF smoke tests (real Chrome) | Text→PDF, Extract text (text matched), Image→PDF, Word→PDF each produced a valid PDF; output identical in size to round 1 |
                                                                                                            | Project script `scripts/smoke-tools.mjs` | 15 / 15 pass |
                                                                                                            | Client-side navigation | title, description and canonical update on SPA navigation (`/` → `/merge` → `/pdf-to-image` → `/about`) |
                                                                                                            | Keyboard / mobile | "All tools" menu opens on focus; no horizontal overflow at 375 px (5 pages) |
                                                                                                            | Lighthouse (final) | Accessibility 96 (contrast only), SEO 100, Best Practices 100 on `/`, `/merge`, `/about` |
                                                                                                            | Your dev server (port 3000) | 200 with CSS loading; shows the new copy |

                                                                                                            **Limitations:** lab data only; 4 of 16 tools have full end-to-end smoke tests, and the other 12 were load-tested (file loaded, no errors or CSP violations) without running the final export; the print/iframe and signature-drawing paths weren't exercised; nothing was verified on production.

                                                                                                            ## R2.8 Exact change log — round 2

                                                                                                            | File | Change | Issue | Visible UI change? | Test |
                                                                                                            |---|---|---|---|---|
                                                                                                            | `src/components/shared/ToolCard.tsx` | `prefetch` → `prefetch={false}` (existing hover/focus/touch `warm()` still prefetches) | SEO-30 | No | A/B Lighthouse; net-log |
                                                                                                            | `src/components/layout/Navbar.tsx` | "All tools" links: `prefetch={false}` + `router.prefetch` on hover/focus; imports `useRouter` | SEO-30 | No | A/B; keyboard test |
                                                                                                            | `src/app/page.tsx` | 3 inline links `prefetch={false}` | SEO-30 (fixes round-1 regression) | No | A/B (editor bundle gone) |
                                                                                                            | `src/components/shared/FileUploader.tsx` | Removed `aria-label` from dropzone (name now from visible text) | SEO-31 | No | Lighthouse |
                                                                                                            | `src/lib/seo-content.ts` | Watermark: description, intro, 1 step, 3 features → text-only / nine positions; Image→PDF: 1 FAQ added; home FAQs: 3 answers corrected (WebAssembly, offline, browsers) | SEO-27, 28, 29 | Copy only | HTML checks |
                                                                                                            | `src/app/about/page.tsx` | "via WebAssembly and JavaScript" → "as JavaScript" | SEO-28 | Copy only | HTML check |
                                                                                                            | `next.config.mjs` | `Content-Security-Policy-Report-Only` header (policy built in a `csp` constant; GA hosts conditional) | SEO-12 | No | flows + positive control |
                                                                                                            | `src/lib/pdf/pdfjs.ts` | Changed, then **reverted to the original** (self-hosting failed to build) | SEO-21 | No (net zero) | build |
                                                                                                            | `SEO-AUDIT-REPORT.md` | Table regenerated; numbers reconciled; round 1's "0 external requests" corrected; this section | — | — | cell-count self-check |

                                                                                                            New register entries (round 2):

                                                                                                            | ID | Sev | Issue | Status |
                                                                                                            |---|---|---|---|
                                                                                                            | SEO-27 | High | Watermark page promised image watermarks and tiling; neither exists | **Fixed** (copy) |
                                                                                                            | SEO-28 | Medium | Home/About claimed WebAssembly and offline use; neither is true | **Fixed** (copy) |
                                                                                                            | SEO-29 | Medium | Image→PDF stamps "1 / N" on every page without saying so | **Disclosed** (FAQ); option to disable = product decision |
                                                                                                            | SEO-30 | High | Homepage prefetched tool bundles incl. the 207 KB gzipped editor (partly a round-1 regression) | **Fixed** |
                                                                                                            | SEO-31 | Medium | Tool dropzones failed WCAG 2.5.3 (label in name) | **Fixed** |
                                                                                                            | SEO-32 | Medium | About-page origin story and "We read every email" are unverified (written by me) | **Your decision** |
                                                                                                            | SEO-33 | Info | Protect's encryption strength depends on the input PDF version | Product recommendation: force PDF 1.7 → AES-128, or 1.7ext3 → AES-256 |
                                                                                                            | SEO-34 | Info | `next/font` downloads Google Fonts during the build; one transient failure | Informational |

                                                                                                            Status of earlier items: SEO-12 is at the **report-only** stage (enforcing needs your approval). SEO-21 has a proposal awaiting approval. SEO-03, 10, 13, 17 and 18 are unchanged and still need your decision or hosting access. SEO-19 (footer year hydration) and SEO-20 (both logo variants preloaded) are optional low-priority fixes, not done.

                                                                                                            ## R2.9 Deployment checklist

                                                                                                            **Before deploying (local, done ✓ / your decision ☐):**
                                                                                                            1. ✓ Build, lint, types, metadata, sitemap, robots, links, smoke tests pass (R2.7).
                                                                                                            2. ☐ Decide SEO-03 (testimonials) and SEO-32 (About claims). Leaving them live keeps the trust risk.
                                                                                                            3. ☐ Optional: approve the brand-contrast change (R2.5) and the worker self-hosting (R2.6) and ship them in the same release.
                                                                                                            4. ☐ If `NEXT_PUBLIC_GA_MEASUREMENT_ID` will be set: update Privacy Policy §5 first.

                                                                                                            **Deploy (needs your Vercel access):**
                                                                                                            5. ☐ Deploy this code. If the build fails in `next/font`, redeploy (SEO-34).

                                                                                                            **Verify on production (not yet done; requires the live deploy):**
                                                                                                            6. ☐ `https://www.pdfeditplus.com/about` → 200; `/sitemap.xml` → 20 URLs incl. `/about`; `/robots.txt` → single `*` group; an unknown URL → 404.
                                                                                                            7. ☐ Response headers include `Content-Security-Policy-Report-Only`. Open `/`, `/merge`, `/edit` (try print) and `/sign` (open the signature modal) with DevTools open, and confirm no "[Report Only]" messages.
                                                                                                            8. ☐ Re-run the metadata extraction and smoke tests against `https://www.pdfeditplus.com` (scripts available on request).
                                                                                                            9. ☐ PageSpeed Insights on `/`, `/text-to-pdf`, `/extract-text`. Lab numbers should resemble R2.4; field data needs about 28 days of traffic.
                                                                                                            10. ☐ Google Rich Results Test / Schema Validator on `/` and one tool page.

                                                                                                            **After deploy (needs your account access):**
                                                                                                            11. ☐ Search Console: verify the property, submit `/sitemap.xml`, request indexing for `/about` and the 4 retitled pages.
                                                                                                            12. ☐ Vercel → Domains: redirect `pdfeditplus.com` straight to `https://www.pdfeditplus.com` (removes the double hop from http on the apex domain, SEO-18).
                                                                                                            13. ☐ After a clean report-only period: approve switching the CSP to enforce.

                                                                                                            ## R2.10 Final verdict

                                                                                                            | | |
                                                                                                            |---|---|
                                                                                                            | Audit | **Complete** (within the data limits above) |
                                                                                                            | Fixes | **Implemented locally** — 18 issues fixed or staged; 11 open (9 need your decision, access or approval; 2 optional) |
                                                                                                            | Tests | **Passed locally** — every check in R2.7 |
                                                                                                            | Production verification | **Pending** — nothing has been deployed; live state is unchanged except where noted from round-1 observation |
