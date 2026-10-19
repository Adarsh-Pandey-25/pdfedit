import type { GuideContent } from "@/components/guides/GuideArticle";
import { A, Bullets, Code, H3, Note, Steps, Table } from "@/components/guides/GuideProse";

export const splitPdfGuide: GuideContent = {
  intro: (
    <>
      <p>
        To split a PDF, upload it to <A href="/split">Split PDF</A>, choose
        pages by clicking them or typing a range such as{" "}
        <Code>1-3, 5</Code>, and select <strong>Extract selected</strong> to
        get one new PDF with just those pages. To turn every page into its
        own file instead, select <strong>Split all pages (ZIP)</strong>.
      </p>
      <p>
        The file is split in your browser on your own device, so it isn’t
        uploaded to a server. This guide walks through both options, shows
        how page ranges work, and covers the mistakes that most often lead to
        the wrong pages.
      </p>
    </>
  ),
  sections: [
    {
      id: "two-ways",
      title: "Two ways to split a PDF",
      body: (
        <Bullets>
          <li>
            <strong>Extract selected</strong> creates <em>one</em> PDF from
            the pages you choose, saved as <Code>extracted-pages.pdf</Code>.
            Use it to pull out a chapter, a signed page, or everything except
            a few pages.
          </li>
          <li>
            <strong>Split all pages (ZIP)</strong> creates one PDF per page
            and packs them into <Code>split-pages.zip</Code>. Inside are{" "}
            <Code>page-1.pdf</Code>, <Code>page-2.pdf</Code>, and so on. It
            always uses every page, whatever is selected.
          </li>
        </Bullets>
      ),
    },
    {
      id: "steps",
      title: "How to extract pages step by step",
      body: (
        <>
          <Steps>
            <li>
              Open <A href="/split">Split PDF</A> and upload one PDF (up to
              50 MB). A thumbnail of every page appears.
            </li>
            <li>
              Note that <strong>all pages start selected</strong>. Select{" "}
              <strong>Clear</strong> if you only want a few pages.
            </li>
            <li>
              Choose pages by clicking their thumbnails, or type a range into{" "}
              <strong>Custom range</strong> (see the examples below).
            </li>
            <li>
              Check the count on the <strong>Extract selected (N)</strong>{" "}
              button, then select it.
            </li>
            <li>
              Download <Code>extracted-pages.pdf</Code> and rename it to
              something descriptive.
            </li>
          </Steps>
          <Note title="Pages keep their original order">
            <p>
              Extracted pages always come out in the order they had in the
              original file. Typing <Code>5, 1</Code> gives page 1 followed
              by page 5. To change the order, extract the pieces separately
              and combine them with <A href="/merge">Merge PDF</A>, which
              follows the order you arrange the files in.
            </p>
          </Note>
        </>
      ),
    },
    {
      id: "page-ranges",
      title: "Writing page ranges",
      body: (
        <>
          <p>
            Separate pages and ranges with commas. Spaces don’t matter. Typing
            a range replaces the current selection. Here is what each entry
            selects in a 10-page PDF:
          </p>
          <Table
            caption="Page range examples for a 10-page PDF"
            head={["You type", "Pages selected"]}
            rows={[
              [<Code key="a">1-3</Code>, "1, 2, 3"],
              [<Code key="b">1-3, 5, 7-10</Code>, "1, 2, 3, 5, 7, 8, 9, 10"],
              [<Code key="c">2-10</Code>, "Everything except the first page"],
              [<Code key="d">8-4</Code>, "4, 5, 6, 7, 8 (reversed ranges work)"],
              [<Code key="e">9-20</Code>, "9, 10 (stops at the last page)"],
              [<Code key="f">2, 2, 1</Code>, "1, 2 (duplicates are ignored)"],
              [<Code key="g">12</Code>, "Nothing (there is no page 12)"],
              [<Code key="h">3-</Code>, "Nothing (a range needs both numbers)"],
            ]}
          />
          <p>
            Entries that don’t match a page are skipped without a warning. If
            nothing you typed matches, the previous selection stays as it was.
            That is why it’s worth checking the number on the{" "}
            <strong>Extract selected</strong> button before you select it.
          </p>
        </>
      ),
    },
    {
      id: "examples",
      title: "Practical examples",
      body: (
        <>
          <H3>Split a long PDF into several parts</H3>
          <p>
            Say a 30-page report should become three files. Type{" "}
            <Code>1-10</Code>, extract, and download. Without uploading again,
            type <Code>11-20</Code>, extract, and download, then do the same
            for <Code>21-30</Code>. Each download is named{" "}
            <Code>extracted-pages.pdf</Code>, so your browser may add a number
            to later copies. Rename each file as you go.
          </p>
          <H3>Send only the signed page</H3>
          <p>
            Select <strong>Clear</strong>, click the signed page’s thumbnail,
            and extract it. Seeing the thumbnail helps when you don’t know the
            page number.
          </p>
          <H3>Remove blank or unwanted pages</H3>
          <p>
            Leave all pages selected, click the pages you don’t want to
            deselect them, and extract. The new PDF has everything except
            those pages.
          </p>
          <H3>Separate a batch of scanned documents</H3>
          <p>
            If you scanned several one-page documents into one file, use{" "}
            <strong>Split all pages (ZIP)</strong>, then open the ZIP. On
            Windows, right-click it and choose Extract All; on a Mac,
            double-click it.
          </p>
        </>
      ),
    },
    {
      id: "check",
      title: "Checking the result and known limits",
      body: (
        <>
          <p>
            Open the new file and check the page count and the first and last
            pages. Text stays selectable and searchable, and web links keep
            working. These are not carried over:
          </p>
          <Bullets>
            <li>
              <strong>Bookmarks</strong> (the outline in a viewer’s sidebar).
            </li>
            <li>
              <strong>Fillable form fields.</strong> They stop being fillable.
            </li>
            <li>
              <strong>Document properties</strong> such as the title.
            </li>
          </Bullets>
          <Note title="Password-protected or restricted PDFs come out blank" tone="warning">
            <p>
              If the PDF needs a password to open, or has restrictions such
              as “no editing”, the thumbnails can look normal while the
              extracted pages come out blank, without an error message.
              Remove the protection first with <A href="/unlock">Unlock PDF</A>,
              then split the unlocked copy. Unlock rebuilds each page as an
              image, so the text in that copy can’t be selected or searched.
            </p>
          </Note>
          <p>
            Every page gets a thumbnail, so very long PDFs can take a while to
            display, especially on phones. If your goal is a smaller file
            rather than fewer pages, see{" "}
            <A href="/guides/how-to-compress-a-pdf">how to compress a PDF</A>.
          </p>
        </>
      ),
    },
  ],
  ctaText: "Extract pages or split every page into its own PDF.",
};
