# PdfEdit+ — SEO Audit Report

Site: https://www.pdfeditplus.com/ · Repository: Adarsh-Pandey-25/pdfedit · Last updated: 2026-10-14

This report replaces the earlier rounds' report. Everything still true from them is carried over below. Older text is in the git history (commit `9b7c746`).

**How to read it.** Each fact is labelled with where it was checked:
- **Live** = the production site, fetched on 2026-10-14.
- **Local build** = a production build of the current working copy, run on this laptop.
- **Code** = read from the source files.
- **Not checked** = could not be verified from here. This includes anything inside Google Search Console, which this session cannot open.

---

## 1. Summary

| | |
|---|---|
| Pages audited | **20 public pages** (home, 16 tools, About, Privacy, Terms), plus the 404 response, `robots.txt` and `sitemap.xml` |
| Verified problems found this round | **5** |
| Fixed this round | **5**, in your working copy only. They are **not committed, pushed or deployed** yet. |
| Still open from earlier rounds | **10**. They need your decision, Vercel access or an approval (section 6). |
| Build, lint, type check | all pass |
| PDF smoke tests | pass (4 converters end to end, plus the project's own 15-check script) |

**The six "Discovered – currently not indexed" URLs.** I found **no technical reason** on any of them (section 3). All six are live, return HTTP 200, allow indexing, point their canonical link at themselves, appear in the sitemap, are linked from every other page, and serve exactly the same HTML to a Googlebot-style request as to a normal browser. Their text is also distinct from the other tool pages.

"Discovered – currently not indexed" means Google knows the URL exists but has not crawled it yet. It is not an error message, and I cannot tell from here why Google has not gotten to these six. A likely contributor is that the site is new (a Semrush check on 2026-10-13 showed almost no ranking keywords or traffic). That is a possibility, not a finding. No fix can force or speed up indexing.

**What this round fixed:**
1. `/edit` had a visible layout jump (a Core Web Vitals problem): **0.144 → 0.000** after the fix. Google counts 0.1 or lower as "good".
2. The `/edit` page claimed "stamps" and "underline", but the editor has neither. Corrected.
3. Three more pages described their features vaguely or missed things users need to know. Now accurate and specific.

---

## 2. Page-by-page audit (live site, 2026-10-14)

★ = one of the six Search Console URLs. "In-content links in" counts links from *inside other pages' text*, not the navbar or footer. Every page is also linked from all 19 other pages (through the navbar menu or the footer), so **no page is an orphan**.

| URL | Purpose / search intent | Title (live) | H1 | Canonical | Indexable | In sitemap | In-content links in | Words |
|---|---|---|---|---|---|---|---|---|
| `/` | Home: choose a tool; edit-PDF entry point | PdfEdit+ - Free Online PDF Editor \| Merge, Split, Convert | Edit, Convert & Manage PDFs Free & Online | self ✓ | 200 · index,follow ✓ | yes | 19 | 385 |
| `/merge` | Combine several PDFs into one | Merge PDF Files Online Free \| PdfEdit+ | Merge PDF Files Online Free | self ✓ | 200 · index,follow ✓ | yes | 10 | 255 |
| `/split` | Split a PDF / extract pages | Split PDF Online Free \| PdfEdit+ | Split PDF Online Free | self ✓ | 200 · index,follow ✓ | yes | 4 | 211 |
| `/compress` | Reduce PDF file size | Compress PDF Online Free \| PdfEdit+ | Compress PDF Online Free | self ✓ | 200 · index,follow ✓ | yes | 7 | 262 |
| `/pdf-to-image` | Turn PDF pages into JPG/PNG | PDF to JPG & PNG Converter Free \| PdfEdit+ | Convert PDF to Image Online | self ✓ | 200 · index,follow ✓ | yes | 3 | 213 |
| **`/image-to-pdf`** ★ | Turn images into one PDF | JPG to PDF – Convert Images to PDF Free \| PdfEdit+ | Convert Images to PDF Online | self ✓ | 200 · index,follow ✓ | yes | 2 | 232 |
| **`/word-to-pdf`** ★ | Convert DOCX to PDF | Word to PDF Converter Free \| PdfEdit+ | Convert Word to PDF Online | self ✓ | 200 · index,follow ✓ | yes | 2 | 234 |
| **`/text-to-pdf`** ★ | Make a PDF from text/Markdown | Text to PDF Online Free \| PdfEdit+ | Create a PDF from Text Online | self ✓ | 200 · index,follow ✓ | yes | 3 | 205 |
| `/rotate` | Rotate PDF pages | Rotate PDF Pages Online Free \| PdfEdit+ | Rotate PDF Pages Online | self ✓ | 200 · index,follow ✓ | yes | 2 | 189 |
| `/watermark` | Add a text watermark | Add Watermark to PDF Free \| PdfEdit+ | Add a Watermark to PDF Online | self ✓ | 200 · index,follow ✓ | yes | 5 | 223 |
| `/page-numbers` | Add page numbers | Add Page Numbers to PDF Free \| PdfEdit+ | Add Page Numbers to PDF Online | self ✓ | 200 · index,follow ✓ | yes | 3 | 204 |
| **`/viewer`** ★ | Read a PDF in the browser | PDF Viewer Online Free \| PdfEdit+ | Free Online PDF Viewer | self ✓ | 200 · index,follow ✓ | yes | 3 | 193 |
| **`/edit`** ★ | Edit and annotate a PDF | Edit PDF Online Free \| PdfEdit+ | Edit PDF Online Free | self ✓ | 200 · index,follow ✓ | yes | 6 | 300 |
| `/protect` | Password-protect a PDF | Password Protect PDF Free \| PdfEdit+ | Password Protect a PDF Online | self ✓ | 200 · index,follow ✓ | yes | 5 | 204 |
| **`/unlock`** ★ | Remove a password you know | Unlock PDF – Remove PDF Password Free \| PdfEdit+ | Unlock a Password-Protected PDF | self ✓ | 200 · index,follow ✓ | yes | 2 | 228 |
| `/sign` | Add a signature image | Sign PDF Online Free \| PdfEdit+ | Sign PDF Online Free | self ✓ | 200 · index,follow ✓ | yes | 5 | 215 |
| `/extract-text` | Copy the text out of a PDF | Extract Text from PDF – PDF to Text Free \| PdfEdit+ | Extract Text from PDF Online | self ✓ | 200 · index,follow ✓ | yes | 2 | 224 |
| `/privacy` | Privacy policy | Privacy Policy \| PdfEdit+ | Privacy Policy | self ✓ | 200 · index,follow ✓ | yes | 3 | 611 |
| `/terms` | Terms of service | Terms of Service \| PdfEdit+ | Terms of Service | self ✓ | 200 · index,follow ✓ | yes | 1 | 579 |
| `/about` | About the product | About Us \| PdfEdit+ | PDF tools that stay out of your way — and off our servers | self ✓ | 200 · index,follow ✓ | yes | 0 | 325 |

Checks that apply to all 20 pages:
- Titles, descriptions and canonical URLs are present and unique (0 duplicates).
- Exactly one H1 per page.
- No `X-Robots-Tag` header.
- No `noindex`.
- `robots.txt` blocks only `/api/` and `/admin/`, which don't exist.
- JavaScript and CSS files are reachable.
- An unknown URL returns a real **404** (no fake 200), with `noindex` and no canonical.
- `www`, HTTPS and no-trailing-slash are the single canonical form. Other forms redirect to it. The exception: `http://pdfeditplus.com` takes 2 redirects instead of 1 (open item C-4).

---

## 3. The six Search Console URLs

| URL | Live status | Index/follow | Canonical | In sitemap | Linked from | Words | Verdict |
|---|---|---|---|---|---|---|---|
| `/edit` | 200 | yes | self | yes | 19 pages (navbar or footer) + 6 in content | 300 | No technical issue. **Copy corrected** (stamps/underline claim). **Layout jump fixed.** |
| `/image-to-pdf` | 200 | yes | self | yes | 19 + 2 | 232 | No technical issue. **Copy made specific.** |
| `/text-to-pdf` | 200 | yes | self | yes | 19 + 3 | 205 | No technical issue. Google's live test already reported it eligible. **Copy extended.** |
| `/unlock` | 200 | yes | self | yes | 19 + 2 (footer link was missing before 2026-10-14; now live) | 228 | No technical issue. |
| `/viewer` | 200 | yes | self | yes | 19 + 3 | 193 | No technical issue. **Copy extended** (search, fit, 40-thumbnail limit). |
| `/word-to-pdf` | 200 | yes | self | yes | 19 + 2 | 234 | No technical issue. Copy already states its limits. |

**Evidence behind the verdicts (live):**
- **Googlebot parity:** each page returned byte-identical HTML to a normal browser and to a Googlebot-style user agent.
- **Content distinctness:** at most 30% of any page's text appears on another tool page, and almost all of that is one shared sentence ("Files processed locally in your browser — never uploaded to a server"). These six are no more templated than the other ten.
- **Length:** about 190–300 words of server-rendered text each. That is short, but typical for a tool page, and the six are not shorter than the rest. I did not pad them.
- **Structured data:** every FAQ question and HowTo step in the JSON-LD is visible on the page. No ratings or reviews exist anywhere. The last breadcrumb is the page's own URL.

**What I can't tell you:** why Google hasn't crawled them yet. What helps without guessing: keep the pages accurate, keep them linked (done), and give a young site time.

---

## 4. Findings

### Fixed this round (local only, not deployed)

| ID | Sev | Routes | Evidence | Fix | Files | Verified |
|---|---|---|---|---|---|---|
| R3-01 | Medium | `/edit` | Production: layout shift **0.144** (limit for "good" is 0.1). The loading placeholder was 534–630 px tall (it was sized to the browser window), but the editor's first screen is 233 px (under 640 px wide) or 269 px (640 px and up). When the editor loaded, the page text below jumped up by about 340–360 px. | Added a `compact` loading placeholder, used only for the in-page loading state, with those exact heights. The full-height placeholder used by `edit/loading.tsx` is unchanged. | `src/components/shared/ToolPageLoading.tsx`, `src/app/edit/page.tsx` | Chrome layout-shift recording: **0.144 → 0.000**. The real first-screen height was measured at 10 widths (360–1440 px) and flips at 640 px, the same breakpoint the placeholder uses; placeholder = real height at the 3 sizes checked (412, 1280, 1440 px) |
| R3-02 | Medium | `/edit` | Code: the editor has no stamp tool and no underline tool (`editor-types.ts` lists text, highlight, draw, rectangle, ellipse, line, arrow, cross, check, signature, note, image, link; toolbar labels in `EditClient.tsx`). Underline only appears on *existing* text. The page said "underline… and stamps". | "Highlight text and add notes to important sections"; "Insert signatures, images, shapes, lines, and arrows" | `src/lib/seo-content.ts` | New text present in rendered HTML; "stamps" gone |
| R3-03 | Low | `/image-to-pdf` | The feature "Professional page layout options" was vague. Code: A4 / Letter / custom size (mm), portrait/landscape, margin; 50 MB per file. | Specific feature text + one FAQ | `src/lib/seo-content.ts` | In rendered HTML |
| R3-04 | Low | `/text-to-pdf` | Page didn't say what's supported. Code: always A4; themes Modern / Professional / Minimal / Colorful; bold, italic and inline code. | One FAQ | `src/lib/seo-content.ts` | In rendered HTML |
| R3-05 | Low | `/viewer` | Search across all pages, fit-to-width/page and a 40-thumbnail limit exist in code but were not mentioned. | Feature line + one FAQ (incl. the limit and that scanned pages can't be searched) | `src/lib/seo-content.ts` | In rendered HTML |

### Noted, no change made

| ID | Sev | Note |
|---|---|---|
| R3-06 | Info | Every page carries both `WebApplication` and `SoftwareApplication` markup for the same product. Redundant but valid. Left alone to keep the change small. |
| R3-07 | Info | Layout shift on `/text-to-pdf` is 0.071 and on `/image-to-pdf` and `/word-to-pdf` 0.050. These are inside the "good" range (≤ 0.1). They have the same kind of cause (placeholder height) and could be tuned the same way later. |
| R3-08 | Info | Structured-data rich results: Google limits FAQ rich results to certain sites and has retired HowTo rich results, so this markup is unlikely to change how the pages appear. It's accurate, so it stays. |

### Still open from earlier rounds (10)

| ID | Sev | Issue | What's needed |
|---|---|---|---|
| C-1 | High | Home page "Loved by thousands" and three named testimonials have no source in the project. If they aren't real customers' words they are a legal and trust risk. | **Your decision:** confirm they are real, replace them, or remove them. |
| C-2 | Medium | About page: the origin story ("started from a simple frustration…") and "We read every email" were written by me without a source. | **Your decision:** confirm or edit. |
| C-3 | Medium | Brand orange `#F97316` has too little contrast: 2.8:1 white-on-orange and 2.6:1 orange-on-cream; WCAG AA needs 4.5:1 for small text. Lighthouse flags it on all 7 pages measured. Your existing darker orange `#C2410C` reaches 5.2:1 (white on it) and 4.9:1 (on cream). | **Design approval** (it changes the look). |
| C-4 | Low | `http://pdfeditplus.com` takes 2 redirects before reaching `https://www`. | Vercel → Domains setting. |
| C-5 | Medium | The Content-Security-Policy header is in **report-only** mode. Live check: 0 violations on all 20 pages. | **Your approval** to enforce (rename the header). |
| C-6 | Medium | PDF.js worker loads from `unpkg.com` and signature fonts from Google Fonts. If unpkg were unreachable, the tools that open PDFs would likely stop working (not tested). No file data is sent (0 POST/PUT requests). Hosting the worker yourself failed in a trial build (Next 14 can't bundle it directly), so it needs a copy-file build step. | **Your approval** for a build change. |
| C-7 | Low | Footer X / Share / Website icons link to `#`; the newsletter form does nothing. | Real URLs, or remove them. |
| C-8 | Info | Protect PDF's encryption strength depends on the input PDF's version (40-bit RC4 up to AES-128). The page makes no strength claim. | Product decision. |
| C-9 | Low | Footer year is computed in a client component (could mismatch after New Year until redeploy). | Optional. |
| C-10 | Low | Both light and dark logos are preloaded (~8 KB). | Optional. |

### Fixed and deployed in earlier rounds (re-verified live today)
Generated sitemap now served (20 URLs including `/about`; the old static file is gone); `/about` live; Unlock PDF linked from the footer; the dark header strip removed; `robots.txt` simplified; 404 pages no longer inherit the home canonical; WebSite structured data on the home page; homepage downloads about 80% less JavaScript.

---

## 5. Performance

All numbers are **lab measurements** (Lighthouse 12.2.1, mobile emulation, run from this laptop). They are not Google's field data (real visitors, collected over 28 days), which isn't available from here. A single run can vary by about ±10 points.

**Production, 2026-10-14 (one run per page):**

| Page | Perf | A11y | Best practices | SEO | LCP | TBT | CLS | JS transferred |
|---|---|---|---|---|---|---|---|---|
| `/` | 86 | 96 | 100 | 100 | 2.4 s | 475 ms | 0.000 | 172 KB |
| `/edit` | 72 | 96 | 100 | 100 | 3.5 s | 509 ms | 0.144 | 393 KB |
| `/image-to-pdf` | 94 | 96 | 100 | 100 | 2.5 s | 208 ms | 0.050 | 170 KB |
| `/text-to-pdf` | 96 | 96 | 100 | 100 | 2.6 s | 64 ms | 0.071 | 169 KB |
| `/unlock` | 98 | 96 | 100 | 100 | 2.4 s | 43 ms | 0.000 | 170 KB |
| `/viewer` | 89 | 96 | 100 | 100 | 2.6 s | 273 ms | 0.000 | 167 KB |
| `/word-to-pdf` | 99 | 96 | 100 | 100 | 2.0 s | 71 ms | 0.050 | 170 KB |

- Only `/edit` is heavy (393 KB of JavaScript), because it contains the whole editor.
- Layout shift on `/edit` (0.144) is the item fixed above; the others are inside Google's "good" range.
- `color-contrast` is the only accessibility failure left (C-3).
- `valid-source-maps` on `/edit` is a Lighthouse note, not a user problem.

**Layout-shift fix, measured in Chrome (4× CPU slowdown, phone viewport):**

| | Layout shift | Where the SEO text sits (phone) |
|---|---|---|
| Before (production) | 0.144 | 882 px while loading → jumps to 539 px |
| After (local build) | **0.000** | 539 px, no movement |

**Earlier rounds (medians of 3–5 interleaved runs in one session):** homepage JavaScript 984 KB → 178 KB; `/text-to-pdf` Lighthouse 56 → 87 and largest-paint 6.8 s → 3.3 s; `/extract-text` 81 → 96.

---

## 6. Testing results

| Check | Result |
|---|---|
| Git state at start | `main` = `origin/main` (`10fbea0`), nothing uncommitted except regenerated smoke-test PDFs |
| `npx tsc --noEmit` | 0 errors |
| `npx next lint` | 0 warnings or errors |
| `npx next build` (isolated copy) | pass |
| Pre-existing failures | none this round. Once in an earlier round a build failed while downloading Google Fonts and passed on retry. |
| Metadata, sitemap, robots, links, JSON-LD (28 automated checks) | all pass: 20 routes 200; titles/descriptions/canonicals unique; sitemap = the 20 routes; every internal link target returns 200 |
| New copy in rendered HTML | present on `/edit`, `/image-to-pdf`, `/text-to-pdf`, `/viewer`; "stamps" gone |
| PDF conversions in real Chrome | text→PDF, extract-text, image→PDF, Word→PDF each made a valid PDF; 0 POST requests |
| `scripts/smoke-tools.mjs` | 15 passed, 0 failed |
| All 20 routes, console + security policy (local build **and** live) | 0 page errors, 0 policy violations. Only external requests: the PDF.js worker (unpkg) and Google Fonts CSS. |
| Googlebot-style fetch vs browser (live, six URLs) | identical HTML |
| Layout shift on `/edit` | 0.144 → 0.000 |

**Not tested:** Search Console (no access); the 12 tools not listed above were not run end to end; the editor's print preview and the signature-drawing window; field Core Web Vitals.

---

## 7. What to do next (step by step)

**A. Review and save the changes** (in the project folder, in Git Bash or PowerShell):

```
git status
git diff
```

You should see exactly 3 changed code files (`src/app/edit/page.tsx`, `src/components/shared/ToolPageLoading.tsx`, `src/lib/seo-content.ts`) plus this report. If other files appear, leave them out of the commit below.

**B. Commit and push (this deploys to Vercel):**

```
git add src/lib/seo-content.ts src/components/shared/ToolPageLoading.tsx src/app/edit/page.tsx SEO-AUDIT-REPORT.md
git commit -m "Fix /edit layout shift and correct tool page copy"
git push origin main
```

Then open vercel.com → your project → **Deployments** and wait for the newest one to say **Ready** (usually 1–3 minutes).

**C. Check the live site** (use `curl.exe` in PowerShell):

```
curl.exe -s https://www.pdfeditplus.com/edit | findstr /C:"Highlight text and add notes"
curl.exe -s https://www.pdfeditplus.com/sitemap.xml | findstr /C:"/unlock"
```

Each should print a line. Open `/edit` on your phone: the text under the tool should no longer jump when the page finishes loading.

**D. Google Search Console** (about 5 minutes; **local checks above don't replace this**):
1. Search Console → **Sitemaps**: `sitemap.xml` should say **Success** with 20 discovered pages. You do not need to resubmit it.
2. Search Console → **URL Inspection**: paste `https://www.pdfeditplus.com/edit`, press Enter, then **Test live URL**. If it says "URL is available to Google", press **Request indexing**.
3. Repeat for `/image-to-pdf`, `/text-to-pdf`, `/unlock`, `/viewer` and `/word-to-pdf`. Request each **once**. Repeated requests do not speed anything up, and Google limits how many you can send per day.
4. Check **Indexing → Pages** about once a week. Indexing time is not predictable, and a request is not a guarantee.
5. In **Experience → Core Web Vitals**, field data appears only after enough real visits (it uses a 28-day window).

Record the date and result of each check, so you can see what changed.

**E. Decisions waiting for you:** items C-1 to C-7 in section 4 (testimonials and About claims first).

---

## 8. Final status

| | |
|---|---|
| Audit | **Complete** within the limits above |
| Fixes | 5 fixed this round; 10 open; **nothing committed or deployed** by me |
| Tests | **Passed** locally; production checks (live HTTP, Lighthouse, console/policy audit) done for **today's deployed code** |
| Production verification of this round's changes | **Pending** until you deploy |
