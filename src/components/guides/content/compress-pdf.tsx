import type { GuideContent } from "@/components/guides/GuideArticle";
import { A, Bullets, Code, Note, Steps, Table } from "@/components/guides/GuideProse";

export const compressPdfGuide: GuideContent = {
  intro: (
    <>
      <p>
        To make a PDF smaller, upload it to{" "}
        <A href="/compress">Compress PDF</A>, pick a compression level, and
        download the result. The tool rebuilds every page as a JPEG image at
        a lower resolution, which works well for scanned documents and
        photo-heavy files.
      </p>
      <p>
        It is not the right tool for every PDF. Text-based files, such as
        documents exported from Word, often get <em>larger</em>, and the
        result has no selectable text. The tool tells you whether your file
        got smaller or larger, so you can keep whichever version is better.
        This guide explains why PDFs get big, how to choose a level, and how
        to check the result before you send it.
      </p>
    </>
  ),
  sections: [
    {
      id: "why-large",
      title: "Why PDF files get large",
      body: (
        <>
          <p>
            Most of a PDF’s size usually comes from images, not text. In
            general:
          </p>
          <Bullets>
            <li>
              <strong>Scanned pages</strong> are stored as full-page pictures.
              A scan made at high resolution or in full colour can take
              hundreds of kilobytes or more per page.
            </li>
            <li>
              <strong>Photos and graphics</strong> are often embedded at their
              full original resolution, even when they appear small on the
              page.
            </li>
            <li>
              <strong>Text and simple drawings</strong> are stored as
              instructions (letters, lines, shapes) and take up very little
              space, even across many pages.
            </li>
          </Bullets>
          <p>
            So a 3-page scan can be much bigger than a 50-page report that was
            exported straight from a word processor. Knowing which kind of PDF
            you have tells you whether compression will help.
          </p>
        </>
      ),
    },
    {
      id: "how-it-works",
      title: "How compression trades quality for size",
      body: (
        <>
          <p>
            PdfEdit+ draws each page as an image, saves that image as a JPEG,
            and places it on a page of the same size in a new PDF. Two
            settings decide the result: the image’s resolution (pixels per
            inch) and the JPEG quality. Lower values give smaller files, but
            small text and fine lines get softer.
          </p>
          <Table
            caption="Compression levels in PdfEdit+"
            head={["Level", "What it uses"]}
            rows={[
              [<strong key="l">Low</strong>, "About 108 pixels per inch, JPEG quality 0.85. Sharpest result, least reduction."],
              [<strong key="m">Medium</strong>, "About 86 pixels per inch, JPEG quality 0.7. The default; a balance of size and readability."],
              [<strong key="h">High</strong>, "About 65 pixels per inch, JPEG quality 0.5. Smallest files; small print can blur."],
            ]}
          />
          <p>
            Every level rebuilds the pages as images, not just High. The
            levels only change how much detail those images keep.
          </p>
        </>
      ),
    },
    {
      id: "steps",
      title: "How to compress a PDF step by step",
      body: (
        <Steps>
          <li>
            Open <A href="/compress">Compress PDF</A> and upload one PDF (up
            to 50 MB). The page shows the file name and original size.
          </li>
          <li>
            Choose <strong>Low</strong>, <strong>Medium</strong>, or{" "}
            <strong>High</strong>. Medium is selected to start with.
          </li>
          <li>
            Select <strong>Compress PDF</strong>.
          </li>
          <li>
            Read the result line. It shows the new size and either “…%
            smaller” or “…% larger”. If the file got larger, the page says so
            and suggests keeping your original.
          </li>
          <li>
            Download the file. It is saved as{" "}
            <Code>compressed-</Code> followed by your original file name.
          </li>
        </Steps>
      ),
    },
    {
      id: "choose-level",
      title: "Which level should you choose?",
      body: (
        <>
          <p>
            Start with Medium, check the result, and adjust. Selecting a
            different level clears the previous result, so you can try another
            level on the same file without uploading it again.
          </p>
          <Bullets>
            <li>
              <strong>Scanned letters, forms, or contracts:</strong> try
              Medium. If small print is hard to read, use Low.
            </li>
            <li>
              <strong>Photo-heavy brochures or slides:</strong> Medium or High
              usually gives the biggest savings. Check that faces and charts
              still look acceptable.
            </li>
            <li>
              <strong>A file that must fit an email or upload limit:</strong>{" "}
              try High, then check readability carefully. If High still isn’t
              small enough, split the document into parts.
            </li>
            <li>
              <strong>Text-based PDFs</strong> (exported from Word, Google
              Docs, or similar): compression here will usually make the file
              bigger and remove the selectable text. Keep the original.
            </li>
          </Bullets>
        </>
      ),
    },
    {
      id: "check",
      title: "How to check the result",
      body: (
        <>
          <p>Before you send a compressed PDF, open it and check:</p>
          <Bullets>
            <li>
              <strong>The smallest text</strong> at 100% zoom, such as
              footnotes, small print, and table numbers.
            </li>
            <li>
              <strong>Signatures, stamps, and diagrams.</strong> Thin lines
              soften first.
            </li>
            <li>
              <strong>The page count.</strong> It should match the original,
              and each page keeps its original size.
            </li>
          </Bullets>
          <p>
            Also remember what changes when pages become images. You can no
            longer select, copy, or search the text, and screen readers can’t
            read it. Links stop working, and fillable form fields are no
            longer fillable. If any of that matters for the person receiving
            the file, send the original instead.
          </p>
        </>
      ),
    },
    {
      id: "limitations",
      title: "Limitations, and when to keep the original",
      body: (
        <>
          <Bullets>
            <li>
              <strong>Text-based PDFs can grow a lot.</strong> In our own test,
              a 3-page text-only PDF grew from about 5 KB to about 470 KB at
              Medium, because an image of a page is far larger than the text
              instructions it replaces.
            </li>
            <li>
              <strong>PDFs that need a password to open</strong> can’t be
              compressed until you remove the password with{" "}
              <A href="/unlock">Unlock PDF</A>.
            </li>
            <li>
              <strong>One file at a time,</strong> up to 50 MB each.
            </li>
          </Bullets>
          <Note title="Other ways to get a smaller file">
            <p>
              If you still have the original document, many apps that create
              PDFs offer a smaller-file or “minimum size” option when you save
              or export. That shrinks the images but keeps the text
              selectable. You can also send only the pages that are needed:{" "}
              <A href="/guides/how-to-split-a-pdf">split the PDF</A> and share
              the part that matters.
            </p>
          </Note>
        </>
      ),
    },
  ],
  ctaText: "Shrink scanned and image-heavy PDFs in your browser.",
};
