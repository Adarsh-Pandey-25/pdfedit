# Word to PDF keyword research: Google India (Semrush)

- **Source:** Semrush API via the Semrush MCP connector (Keyword Research toolkit)
- **Target database:** `in` (Google India, desktop)
- **Research date:** 2 November 2026. No `display_date` was set, so Semrush returned its most recent monthly data.
- **Used for:** the `/word-to-pdf` keyword map and SEO content (`src/lib/seo-content.ts`)

> **These are Semrush estimates, not Google's actual search volumes.** Semrush models volume and difficulty from clickstream and ranking data. Treat them as relative signals for prioritising, not as real demand. Some rows in the related-keywords report look like modelling artefacts. For example, several different Adobe phrases each show exactly 1,000,000/month. Google Search Console (Performance, filtered by page `/word-to-pdf` and country India) is the source of truth once the page is indexed.

## API unit costs: avoid repeating expensive reports

| Report | Rows | API units | Approx. units per row |
|---|---|---|---|
| `phrase_these` (batch keyword summary) | 26 keywords requested, 23 returned | 230 | 10 |
| `phrase_questions` for "word to pdf" | 30 | 2,400 | 80 |
| `phrase_related` for "docx to pdf" | 30 | 2,400 | 80 |
| **Total** | | **5,030** | |

The questions and related reports cost about 8 times as much per row as the batch summary. Reuse this file instead of re-running them, and use `phrase_these` with a specific keyword list when you need fresh numbers.

## How to read the columns

- **Volume:** Semrush's estimated average monthly searches in Google India.
- **KD:** Semrush Keyword Difficulty, 0–100. 70+ very hard, 50–69 hard, 30–49 achievable, under 30 easy.
- **Intent:** Semrush intent codes: 0 = Commercial, 1 = Informational, 2 = Navigational, 3 = Transactional. A blank means Semrush returned no intent label.
- **CPC:** cost per click in USD. **Competition:** paid-search competitive density, 0–1.
- **Trend:** 12 monthly values normalised to the peak month (1.00), oldest first.

## 1. Batch summary (`phrase_these`)

| Keyword | Volume | KD | Intent | CPC | Competition | Trend (12 months) |
|---|---|---|---|---|---|---|
| word to pdf | 3,350,000 | 76 | 0 Commercial | 0.02 | 0.01 | 1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00 |
| word to pdf converter | 1,500,000 | 72 | 0 Commercial | 0.02 | 0.03 | 1.00,0.81,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00 |
| convert word to pdf | 450,000 | 69 | (none) | 0.02 | 0.02 | 0.67,1.00,0.37,0.82,0.67,0.67,0.82,0.82,0.67,0.67,0.82,0.67 |
| doc to pdf | 201,000 | 65 | 0 Commercial | 0.03 | 0.06 | 1.00,0.24,0.30,0.24,0.37,0.37,0.45,0.45,0.45,0.45,0.45,0.45 |
| convert word to pdf online | 135,000 | 61 | (none) | 0.04 | 0.05 | 0.13,0.67,0.67,0.20,1.00,0.16,0.13,0.16,0.16,0.16,0.16,0.13 |
| docx to pdf | 110,000 | 57 | 0 Commercial | 0.02 | 0.02 | 0.67,0.67,0.81,0.67,0.67,0.67,0.81,1.00,1.00,0.81,1.00,1.00 |
| docx to pdf converter | 33,100 | 54 | (none) | 0.07 | 0.08 | 0.82,1.00,0.82,0.82,0.82,1.00,0.82,0.82,0.82,1.00,1.00,1.00 |
| word to pdf converter free | 33,100 | 62 | 0 Commercial | 0.02 | 0.07 | 0.20,0.24,0.30,0.37,0.45,0.45,0.55,0.67,0.82,0.82,1.00,0.82 |
| word to pdf converter online free | 27,100 | 61 | 0 Commercial | 0.03 | 0.07 | 0.45,0.55,0.67,0.67,0.67,0.67,0.67,0.82,1.00,0.82,1.00,0.82 |
| word file to pdf | 14,800 | 60 | 1 Informational | 0.02 | 0.04 | 1.00,0.82,1.00,0.82,0.82,0.82,0.82,1.00,0.82,0.82,0.82,0.82 |
| convert docx to pdf | 12,100 | 54 | (none) | 0.02 | 0.05 | 0.82,0.67,0.82,0.82,0.82,0.82,1.00,1.00,1.00,1.00,1.00,1.00 |
| word to pdf convert | 9,900 | 67 | 0 Commercial | 0.02 | 0.03 | 1.00,0.82,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.82 |
| word to pdf online | 6,600 | 77 | 0 Commercial | 0.03 | 0.08 | 1.00,0.81,1.00,1.00,0.81,0.81,0.81,0.81,0.67,0.67,0.81,0.67 |
| word document to pdf | 5,400 | 62 | 1 Informational | 0.04 | 0.07 | 1.00,1.00,0.54,0.67,0.54,0.44,0.54,0.44,0.36,0.36,0.44,0.36 |
| multiple word to pdf | 880 | 56 | 0 Commercial | 0.02 | 0.01 | 1.00,1.00,1.00,1.00,1.00,0.82,1.00,1.00,1.00,1.00,1.00,1.00 |
| hindi word to pdf | 480 | 29 | 1 Informational | 0.04 | 0.02 | 1.00,0.66,0.66,0.81,0.81,0.66,0.66,0.66,0.66,0.66,0.81,0.81 |
| docx to pdf online | 480 | 52 | 0 Commercial | 0.02 | 0.09 | 0.81,0.66,0.66,0.66,0.81,0.66,0.81,0.81,0.81,1.00,1.00,0.81 |
| kruti dev word to pdf | 110 | 43 | 1 Informational | 0.05 | 0.07 | 1.00,0.82,0.82,0.65,0.65,0.65,0.53,0.53,0.53,0.53,0.65,0.41 |
| word to pdf in mobile | 30 | 0 | (none) | 0.01 | 0.18 | 0.43,0.71,0.71,1.00,0.29,0.14,0.14,0.14,0.14,0.14,0.29,0.14 |
| word to pdf converter for mobile | 20 | 0 | (none) | 0.01 | 0.36 | 1.00,0.50,0.25,1.00,0.25,0.50,0.50,0.50,0.25,0.25,0.25,0.75 |
| word to pdf offline | 20 | 0 | (none) | 0 | 0.01 | 0.14,0.14,0.29,0.14,0.57,1.00,0.14,0.29,0.71,0.14,0.29,0.14 |
| online word to pdf converter | 0 | 60 | 0 Commercial | 0 | 0 | all 0.00 |
| word to pdf with images | 0 | 0 | (none) | 0 | 0 | all 0.00 |

### Keywords that returned no data

Semrush returned no row for these three (requested in the same batch):

- word to pdf without losing formatting
- word ko pdf kaise banaye
- convert word to pdf without microsoft word

## 2. Questions (`phrase_questions`, seed "word to pdf", top 30 by volume)

| Keyword | Volume | KD | Intent |
|---|---|---|---|
| how to convert pdf to word | 74,000 | 79 | 1 Informational |
| how to convert word to pdf | 6,600 | 66 | 1 Informational |
| how to convert word file to pdf | 3,600 | 67 | 1 Informational |
| how to change pdf to word | 2,400 | 78 | 1 Informational |
| how to convert pdf into word | 1,900 | 71 | 1 Informational |
| how to open pdf in word | 1,600 | 37 | 1 Informational |
| how to save word file as pdf | 1,600 | 37 | 1 Informational |
| how to convert word to pdf in laptop | 1,300 | 62 | 1 Informational |
| how to convert pdf to word document | 1,000 | 70 | 1 Informational |
| how to edit a pdf in word | 1,000 | 32 | 1 Informational |
| how to edit pdf file in word | 1,000 | 35 | 1 Informational |
| how to insert pdf into word | 1,000 | 41 | 1 Informational |
| how to convert pdf file into word file | 880 | 70 | 1 Informational |
| how to convert pdf to word in laptop | 880 | 22 | 1 Informational |
| how to convert word into pdf | 880 | 55 | 1 Informational |
| how to add pdf in word | 720 | 35 | 1 Informational |
| how to convert ms word to pdf | 720 | 64 | 1 Informational |
| how to convert pdf file to word | 720 | 79 | 1 Informational |
| how to convert pdf file to word for free | 720 | 74 | 1 Informational |
| how to convert pdf to word free | 720 | 57 | 1 Informational |
| how to convert scanned pdf to word | 720 | 66 | 1 Informational |
| how to convert word document to pdf | 720 | 66 | 1 Informational |
| how to save a word document as a pdf | 720 | 42 | 1 Informational |
| how to save word as pdf | 720 | 39 | 1 Informational |
| how to translate pdf to word | 720 | 77 | 1 Informational |
| how to convert pdf to word in mobile | 590 | 40 | 1 Informational |
| how to search a word in pdf | 590 | 33 | 1 Informational |
| how to search word in pdf in mobile | 590 | 19 | 1 Informational |
| how to convert word to pdf in phone | 480 | 41 | 1 Informational |
| how to make a pdf into a word document | 480 | 74 | 1 Informational |

## 3. Related keywords (`phrase_related`, seed "docx to pdf", top 30 by volume)

| Keyword | Volume | KD | Intent |
|---|---|---|---|
| word to pdf | 3,350,000 | 76 | 0 Commercial |
| word to pdf converter | 1,500,000 | 72 | 0 Commercial |
| adobe acrobat convert word to pdf | 1,000,000 | 66 | 2,3 Navigational, Transactional |
| adobe acrobat document pdf to word converter | 1,000,000 | 83 | 1,2 Informational, Navigational |
| adobe acrobat pdf to word converter | 1,000,000 | 80 | (none) |
| convert word to adobe acrobat pdf | 1,000,000 | 77 | (none) |
| pdf to word converter adobe acrobat | 1,000,000 | 79 | 1 Informational |
| doc to pdf converter | 823,000 | 67 | 0 Commercial |
| pdf converter | 823,000 | 72 | 0 Commercial |
| convert word to pdf | 450,000 | 69 | (none) |
| adobe acrobat online converter | 201,000 | 80 | 2,3 Navigational, Transactional |
| adobe acrobat word to pdf | 201,000 | 76 | 3 Transactional |
| doc to pdf | 201,000 | 65 | 0 Commercial |
| convert to pdf | 165,000 | 57 | 0 Commercial |
| convert word to pdf online | 135,000 | 61 | (none) |
| convert word into pdf | 90,500 | 60 | 0 Commercial |
| word to pdf converter online | 90,500 | 60 | 0 Commercial |
| i love pdf word to pdf | 74,000 | 74 | 2 Navigational |
| adobe acrobat to pdf converter online | 60,500 | 80 | 3 Transactional |
| ilovepdf word to pdf converter | 60,500 | 85 | 2,3 Navigational, Transactional |
| adobe acrobat pdf converter | 40,500 | 79 | 2,3 Navigational, Transactional |
| docs to pdf | 40,500 | 70 | 1,3 Informational, Transactional |
| document to pdf | 40,500 | 70 | 1 Informational |
| i love word to pdf | 40,500 | 75 | 1 Informational |
| pdf to word converter online free | 40,500 | 77 | (none) |
| docx to pdf converter | 33,100 | 54 | (none) |
| ilovepdf word to pdf | 33,100 | 83 | 1 Informational |
| ms word to pdf | 33,100 | 62 | 1 Informational |
| word to pdf converter free | 33,100 | 62 | 0 Commercial |
| adobe pdf to doc converter | 27,100 | 73 | 3 Transactional |

## Takeaways (judgement based on the data above)

- The main terms ("word to pdf", "word to pdf converter") are very hard (KD 72–76). They define the page's focus but won't bring traffic soon.
- The DOCX keywords are the easiest of the large ones (KD 54): "docx to pdf converter" and "convert docx to pdf".
- "online word to pdf converter" shows 0 volume. Indian searchers use the order "word to pdf converter online" (90,500).
- The "free" variants are rising over the 12 months.
- "word file to pdf" outranks "word document to pdf" in India.
- The lowest-difficulty questions the tool can answer honestly: "how to save word file as pdf" (KD 37) and "how to save word as pdf" (KD 39). Good topic for a future guide.
- **Not targeted, because the tool doesn't support them:** `.doc` keywords ("doc to pdf", "doc to pdf converter"), Hindi and Kruti Dev keywords (the bundled Inter font has no Indian-script glyphs; checked with fontkit on 2 Nov 2026), image preservation, multiple-file conversion, offline use, rival brand names, and PDF-to-Word.
- Phone searches are small and on hold until the converter is tested on real phones.
