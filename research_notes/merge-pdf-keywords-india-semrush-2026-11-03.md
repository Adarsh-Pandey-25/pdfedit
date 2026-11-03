# Merge PDF keyword research: Google India (Semrush)

- **Source:** Semrush API via the Semrush MCP connector (Keyword Research toolkit)
- **Target database:** `in` (Google India, desktop)
- **Research date:** 3 November 2026. No `display_date` was set, so Semrush returned its most recent monthly data.
- **Page:** https://www.pdfeditplus.com/merge (`merge` entry in `src/lib/seo-content.ts`)
- **Search Console context (owner-reported, last 3 months):** `/merge` had 3 impressions and 0 clicks. The visible query was `pdf merge online` (1 impression).

> **These are Semrush estimates, not Google's actual search volumes.** Semrush models volume and difficulty from clickstream and ranking data. Treat them as relative signals for prioritising, not as real demand. Some trends look like modelling artefacts, for example one-month spikes of "online pdf merger" and "adobe acrobat online merge pdf". Google Search Console (Performance, filtered by page `/merge` and country India) is the source of truth.

## API unit costs

| # | Report | Seed | Rows returned | API units | Units per row |
|---|---|---|---|---|---|
| 1 | `phrase_these` (batch summary) | 27 keywords | 22 | 220 | 10 |
| 2 | `phrase_questions` | merge pdf | 14 | 560 | 40 |
| 3 | `phrase_questions` | combine pdf | 16 | 640 | 40 |
| 4 | `phrase_related` | merge pdf | 8 | 320 | 40 |
| 5 | `phrase_related` | merge pdf files | 8 | 880 | 110 |
| 6 | `phrase_related` | pdf merger | 7 | 560 | 80 |
| 7 | `phrase_related` | combine pdf files | 7 | 560 | 80 |
| | **Total** | | **82** | **3,740** | |

Budget was 5,030 units (the cost of the `/word-to-pdf` research), and this stayed under it. No balance check was possible: the connector exposes no API-units report.

**Lessons for next time:**

- The cost per row is not constant. The same report type cost 40, 80 or 110 units per row on the same day, so check `usage.api_units` after each call and don't run expensive calls in parallel.
- `phrase_related` for closely related seeds returns nearly the same cluster. All four seeds returned the same 9 unique keywords, so one seed is enough. Reports 5–7 added almost nothing over report 4.
- `phrase_these` stays the cheapest way to get metrics: about 10 units per returned row, and no-data keywords are not charged.

## How to read the columns

- **Volume:** Semrush's estimated average monthly searches in Google India.
- **KD:** Semrush Keyword Difficulty, 0–100. 70+ very hard, 50–69 hard, 30–49 achievable, under 30 easy.
- **Intent:** Semrush intent codes: 0 = Commercial, 1 = Informational, 2 = Navigational, 3 = Transactional. A blank means Semrush returned no label.
- **CPC:** cost per click in USD. **Competition:** paid-search competitive density, 0–1.
- **Trend:** 12 monthly values normalised to the peak month (1.00), oldest first.

## 1. Batch summary (`phrase_these`)

| Keyword | Volume | KD | Intent | CPC | Competition | Trend (12 months) |
|---|---|---|---|---|---|---|
| merge pdf | 3,350,000 | 63 | 0 Commercial | 0.03 | 0.01 | 0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,1.00,0.82 |
| merge pdf online | 301,000 | 58 | 0 Commercial | 0.04 | 0.02 | 1.00,1.00,1.00,1.00,0.82,1.00,1.00,1.00,1.00,1.00,0.82,0.82 |
| pdf merge online | 135,000 | 57 | 0 Commercial | 0.02 | 0.02 | 0.55,0.82,1.00,1.00,0.67,0.55,0.55,0.55,0.55,0.45,0.55,0.55 |
| merge pdf files | 90,500 | 54 | 0 Commercial | 0.02 | 0.05 | 0.67,0.45,0.55,0.67,0.67,0.67,0.82,0.82,0.82,0.82,1.00,1.00 |
| merge pdf online free | 90,500 | 61 | (none) | 0.02 | 0.09 | 0.82,1.00,0.45,0.25,0.07,0.07,0.09,0.09,0.07,0.09,0.09,0.09 |
| online pdf merger | 40,500 | 57 | 0 Commercial | 0.02 | 0.03 | 0.16,0.13,0.13,0.13,1.00,0.13,0.13,0.13,0.13,0.13,0.11,0.13 |
| combine pdf online | 33,100 | 71 | (none) | 0.02 | 0.07 | 0.82,0.82,1.00,1.00,1.00,0.82,1.00,0.82,0.82,0.82,1.00,1.00 |
| pdf combiner | 27,100 | 23 | (none) | 0.05 | 0.05 | 0.67,0.82,0.67,0.82,0.82,0.82,0.82,0.82,0.82,1.00,1.00,0.82 |
| merge pdf files online | 9,900 | 57 | 0 Commercial | 0.04 | 0.08 | 0.82,1.00,0.82,1.00,0.82,1.00,0.82,0.82,0.30,0.30,0.30,0.24 |
| how to merge pdf files | 8,100 | 62 | 1 Informational | 0.03 | 0.41 | 1.00,0.82,1.00,1.00,0.82,0.82,0.82,0.82,0.67,0.67,0.67,0.55 |
| merge pdf and jpg | 6,600 | 44 | 1 Informational | 0.02 | 0.02 | 0.81,0.81,1.00,1.00,1.00,0.67,0.67,0.67,0.67,0.81,0.81,0.81 |
| merge pdf files into one | 4,400 | 63 | 1,0 Informational, Commercial | 0.03 | 0.19 | 0.67,0.67,0.81,0.81,0.81,0.81,1.00,1.00,1.00,1.00,1.00,0.81 |
| combine pdf files | 3,600 | 60 | 1 Informational | 0.03 | 0.18 | 0.12,1.00,0.44,0.12,0.30,0.44,0.54,0.67,0.67,0.67,0.67,0.67 |
| merge pdf and images | 3,600 | 53 | 0 Commercial | 0.02 | 0.09 | 0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,1.00,0.82 |
| free pdf merger | 2,400 | 63 | 0 Commercial | 0.03 | 0.22 | 0.67,0.67,0.67,0.67,0.67,0.53,0.67,0.81,0.81,1.00,1.00,1.00 |
| how to merge pdf files into one | 1,900 | 58 | 1 Informational | 0.04 | 0.50 | 0.67,0.67,0.79,0.79,0.79,0.67,0.79,0.79,1.00,1.00,0.16,0.25 |
| merge multiple pdf files | 880 | 57 | 0 Commercial | 0.03 | 0.20 | 0.68,0.68,0.68,0.77,0.77,0.68,0.68,0.68,0.68,0.68,1.00,0.68 |
| merge two pdf files | 720 | 66 | 0 Commercial | 0.03 | 0.19 | 1.00,0.82,0.82,0.82,0.82,0.82,1.00,1.00,0.82,0.82,1.00,0.82 |
| merge pdf online free unlimited | 170 | 56 | 1 Informational | 0.03 | 0.15 | 1.00,0.54,0.65,0.54,0.54,0.54,0.54,0.35,0.42,0.54,0.42,0.19 |
| combine multiple pdf files | 110 | 56 | 1 Informational | 0.02 | 0.04 | 0.02,0.02,0.02,0.02,0.12,1.00,0.44,0.02,0.02,0.07,0.02,0.54 |
| combine pdf documents | 20 | 0 | (none) | 0.04 | 0.32 | 0.60,0.20,0.60,0.20,0.20,0.40,0.20,0.20,0.60,0.20,1.00,0.20 |
| merge password protected pdf | 20 | 0 | (none) | 0.03 | 0.10 | 0.22,0.11,0.11,0.11,1.00,0.11,0.11,0.56,0.33,0.11,0.11,0.11 |

### Keywords that returned no data

Semrush returned no row for these five (requested in the same batch, not charged):

- merge pdf without uploading
- merge pdf without signup
- merge pdf online and reduce size
- reduce merged pdf size
- merge selected pdf pages

## 2. Questions (`phrase_questions`, top rows by volume)

Seed "merge pdf" (14 rows) and seed "combine pdf" (16 rows). Semrush only returns questions containing the seed phrase, so there were no rows on page order, passwords, bookmarks, forms or page selection.

| Keyword | Seed | Volume | KD | Intent |
|---|---|---|---|---|
| how to merge pdf files | merge pdf | 8,100 | 62 | 1 Informational |
| how to merge two pdf files | merge pdf | 2,900 | 61 | 1 Informational |
| how to combine two pdf files | combine pdf | 2,900 | 60 | 1 Informational |
| how to merge pdf | merge pdf | 1,900 | 52 | 1 Informational |
| how to merge pdf files into one | merge pdf | 1,900 | 58 | 1 Informational |
| how to merge two pdf files into one | merge pdf | 1,900 | 61 | 1 Informational |
| how to combine pdf files | combine pdf | 1,900 | 61 | 1 Informational |
| how to merge different pdf files into one | merge pdf | 880 | 64 | 1 Informational |
| how to merge 2 pdf files | merge pdf | 720 | 64 | 1 Informational |
| how to merge pdf files in one pdf | merge pdf | 480 | 54 | 1 Informational |
| how to merge pdf into one pdf | merge pdf | 480 | 63 | 1 Informational |
| how to merge pdfs into one pdf | merge pdf | 480 | 62 | 1 Informational |
| how to combine pdf files into one pdf | combine pdf | 480 | 63 | 1 Informational |
| how to combine two pdf files into one | combine pdf | 390 | 55 | 1 Informational |
| how to combine pdfs in one pdf | combine pdf | 320 | 52 | 1 Informational |
| how to merge pdf files in mobile | merge pdf | 260 | 29 | 1 Informational |
| how to combine multiple pdf files into one | combine pdf | 210 | 62 | 1 Informational |
| how to combine pdf files into one | combine pdf | 210 | 58 | 1 Informational |
| how to merge 3 pdf files into one | merge pdf | 170 | 57 | 1 Informational |
| how to merge jpg files in one pdf | merge pdf | 170 | 35 | 1 Informational |
| how to merge jpg files into one pdf | merge pdf | 170 | 43 | 1 Informational |
| how to combine 3 pdf files into 1 | combine pdf | 170 | 50 | 1 Informational |
| how to combine 3 pdf files into one | combine pdf | 170 | 57 | 1 Informational |
| how to combine different pdf into one | combine pdf | 170 | 55 | 1 Informational |
| how to combine jpg files into one pdf | combine pdf | 170 | 42 | 1 Informational |
| can we combine two pdf files | combine pdf | 140 | 63 | 1 Informational |
| how to combine 2 pdf files | combine pdf | 140 | 67 | 1 Informational |
| how to combine 2 pdf files into 1 | combine pdf | 140 | 60 | 1 Informational |
| how to combine 2 pdf pages into 1 | combine pdf | 140 | 31 | 1 Informational |
| how to combine multiple pdf pages into one page | combine pdf | 140 | 49 | 1 Informational |

## 3. Related keywords (`phrase_related`)

Four seeds were run (merge pdf: 8 rows, merge pdf files: 8, pdf merger: 7, combine pdf files: 7). The 30 rows contain only **9 unique keywords**. Metrics were identical wherever a keyword appeared for more than one seed.

| Keyword | Volume | KD | Intent | Trend (12 months) | Returned for seeds |
|---|---|---|---|---|---|
| merge pdf | 3,350,000 | 63 | 0 Commercial | 0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,0.82,1.00,0.82 | merge pdf files, pdf merger, combine pdf files |
| pdf merge | 1,220,000 | 65 | (none) | 0.67,0.55,0.67,0.81,0.81,0.81,0.81,0.81,1.00,1.00,1.00,1.00 | all four |
| pdf merger | 450,000 | 75 | 0 Commercial | 0.67,0.55,0.67,0.82,0.82,0.82,0.82,1.00,0.82,1.00,1.00,1.00 | merge pdf, merge pdf files, combine pdf files |
| combine pdf | 368,000 | 67 | 0 Commercial | 0.30,0.45,1.00,1.00,0.25,0.20,0.25,0.25,0.25,0.25,0.25,0.25 | all four |
| merge pdf online | 301,000 | 58 | 0 Commercial | 1.00,1.00,1.00,1.00,0.82,1.00,1.00,1.00,1.00,1.00,0.82,0.82 | all four |
| adobe acrobat online merge pdf | 135,000 | 56 | 1 Informational | 0.00,0.03,0.07,0.00,0.00,0.67,1.00,0.02,0.11,0.55,1.00,0.55 | all four |
| pdf merge online | 135,000 | 57 | 0 Commercial | 0.55,0.82,1.00,1.00,0.67,0.55,0.55,0.55,0.55,0.45,0.55,0.55 | all four |
| ilovepdf pdf merge | 110,000 | 44 | 1 Informational | 0.01,0.01,0.01,0.01,0.01,0.01,0.09,0.37,1.00,0.82,0.25,0.09 | merge pdf, merge pdf files, pdf merger |
| merge | 90,500 | 75 | 1 Informational | 1.00,0.45,0.37,0.45,0.45,0.45,0.45,0.45,0.45,0.55,0.55,0.55 | merge pdf |

## 4. What the product supports (checked in code on `main` at 1185b4e)

From `src/app/merge/MergeClient.tsx` and `mergePdfs` in `src/lib/pdf/operations.ts`:

- **Supported:** PDF files only, up to 50 MB each, with no set limit on the number of files. Files can be added later and go to the end of the list. Merge All needs at least two files. Cards can be reordered by dragging (HTML5 drag; not tested on touch screens). The eye icon opens a file in a new tab and the bin icon removes it. Whole files are merged, every page in card order. The output is always `merged.pdf`. No watermark, no signup, no daily limit. Processing happens in the browser.
- **Not supported:** JPG/image input (use Image to PDF first), choosing individual pages (use Split PDF first), putting several pages onto one sheet ("2 pages into 1"), compressing during the merge (use Compress PDF afterwards), and reliable merging of password-protected PDFs (pages can come out blank).
- **Stated in the merge guide, not re-tested here:** bookmarks, fillable form fields and document properties are not kept, while text, links, and page size and orientation are kept.

## 5. Keyword strategy and mapping

Chosen for relevance to what the tool really does, KD, and volume together, not volume alone.

### Primary keyword

- **merge pdf online** (301,000, KD 58). It has strong demand, is easier than "merge pdf" (KD 63), "pdf merge" (65) and "pdf merger" (75), and it contains "merge pdf". It's also the same family as the page's only Search Console query, "pdf merge online". **Place it in:** title, H1, meta description and the intro's first sentence.

### Secondary keywords (7)

| Keyword | Volume | KD | Why | Placement |
|---|---|---|---|---|
| pdf merge online | 135,000 | 57 | Search Console query; word-order variant | Intro ("online PDF merge tool"), privacy heading |
| merge pdf files | 90,500 | 54 | Lowest KD of the large terms | H1 (already "Merge PDF Files Online Free"), meta description |
| pdf combiner | 27,100 | **23** | Easiest keyword in the set with real volume | Intro or features, once and naturally |
| combine pdf files / combine pdf | 3,600 / 368,000 | 60 / 67 | Synonym that people search heavily | Title ("Combine PDF Files"), use-cases heading |
| merge pdf files into one | 4,400 | 63 | "into one" phrasing used throughout the questions | How-to heading, intro |
| online pdf merger / pdf merger | 40,500 / 450,000 | 57 / 75 | Noun form; the 40,500 figure is spiky | Intro or features, once |
| merge pdf online free | 90,500 | 61 | Still covered by "Online … Free" in the title. Its trend fell from 1.00 to about 0.09 over 8 months, so lower priority | Title, H1 (already present) |

### Long-tail keywords (8)

| Keyword | Volume | KD | Placement |
|---|---|---|---|
| how to merge pdf files | 8,100 | 62 | How-to section (the guide owns the full informational intent) |
| how to merge two pdf files / how to combine two pdf files | 2,900 / 2,900 | 61 / 60 | FAQ: "How do I merge two PDF files into one?" |
| how to merge pdf files into one | 1,900 | 58 | How-to heading "How to Merge PDF Files into One" |
| how to merge different pdf files into one | 880 | 64 | Intro or steps wording |
| merge multiple pdf files | 880 | 57 | Features ("merge multiple PDF files at once") |
| merge two pdf files | 720 | 66 | FAQ above |
| merge pdf online free unlimited | 170 | 56 | Features or FAQ: "no set limit on the number of files" (50 MB per file) |
| combine multiple pdf files | 110 | 56 | Use-cases wording |

### FAQ and question keywords

| Question | Data | Handling |
|---|---|---|
| How do I merge two PDF files into one? | 2,900 + 2,900 (KD 60–61) | New FAQ, answered with the real steps |
| Can I merge a PDF with JPG images? | merge pdf and jpg 6,600 (KD **44**), merge pdf and images 3,600 (KD 53), how to merge jpg files into one pdf 170 (KD 35–43) | Honest FAQ: not directly; use Image to PDF, then merge. **Good topic for a future guide** ("How to merge PDF and JPG into one PDF") |
| Can I merge password-protected PDFs? | 20 | Keep the existing FAQ and add a link to Unlock PDF |
| How do I make the merged PDF smaller? | no data | Keep as a helpful FAQ (link to Compress PDF); not a keyword target |
| Can I merge only some pages? | merge selected pdf pages: no data | Keep as a helpful FAQ (link to Split PDF); not a keyword target |
| Are bookmarks and fillable forms kept? | no data | Keep as a helpful FAQ (after re-testing); not a keyword target |

### Keywords to avoid

| Keyword | Data | Reason |
|---|---|---|
| how to combine 2 pdf pages into 1 / multiple pdf pages into one page | 140 / 140 (KD 31 / 49) | Means several pages on one sheet, which the tool doesn't do |
| merge selected pdf pages | no data | Not supported (whole files only); answer it in an FAQ instead |
| how to merge pdf files in mobile | 260 (KD 29) | Low KD, but reordering on touch screens hasn't been tested. Revisit after phone testing or adding arrow buttons like /image-to-pdf |
| merge pdf and jpg / images (as title or H1 targets) | 6,600 / 3,600 | Not supported directly. FAQ and future guide only |
| adobe acrobat online merge pdf, ilovepdf pdf merge | 135,000 / 110,000 | Rival brand searches |
| merge | 90,500 | Too generic |
| combine pdf online | 33,100 (KD 71) | Hardest variant; covered naturally by "combine PDF files", not targeted on its own |
| merge pdf online and reduce size, reduce merged pdf size | no data | Merging doesn't reduce size; point to Compress PDF in an FAQ |
