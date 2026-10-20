import type { GuideContent } from "@/components/guides/GuideArticle";
import { A, Bullets, Code, Note, Steps } from "@/components/guides/GuideProse";

export const mergePdfGuide: GuideContent = {
  intro: (
    <>
      <p>
        To merge PDF files, add them to <A href="/merge">Merge PDF</A>, drag
        them into the order you want, select <strong>Merge All</strong>, and
        download the combined file. You need at least two PDFs, and each one
        can be up to 50 MB.
      </p>
      <p>
        The files are combined in your browser on your own device, so they
        aren’t uploaded to a server. This guide covers the steps, how to get
        the order right, what to check in the finished file, and what to do
        when something goes wrong.
      </p>
    </>
  ),
  sections: [
    {
      id: "when-to-merge",
      title: "When merging PDFs is useful",
      body: (
        <>
          <p>
            Merging is worth doing whenever someone expects one document but
            you have several. Common examples:
          </p>
          <Bullets>
            <li>
              An application that asks for a single upload: a cover letter,
              CV, and certificates in one file.
            </li>
            <li>
              A month of invoices or receipts collected into one PDF for an
              accountant.
            </li>
            <li>
              A document scanned in batches, where each batch was saved as a
              separate file.
            </li>
            <li>
              A report whose chapters were written and exported by different
              people.
            </li>
          </Bullets>
          <p>
            One file is easier to email, upload, print, and archive, and the
            reader sees the pages in the order you intended.
          </p>
        </>
      ),
    },
    {
      id: "steps",
      title: "How to merge PDFs step by step",
      body: (
        <>
          <Steps>
            <li>
              Open <A href="/merge">Merge PDF</A>.
            </li>
            <li>
              Drag your PDFs onto the upload area, or click it to choose files.
              You can select several files at once and add more later. Each
              file appears as a card showing its first page, its position
              (#1, #2, and so on), and its size.
            </li>
            <li>
              Drag the cards into the order you want. Card #1 becomes the start
              of the merged document.
            </li>
            <li>
              Optional: use the eye icon to open a file in a new tab and check
              it, or the bin icon to remove it.
            </li>
            <li>
              Select <strong>Merge All</strong>. The button is available once
              at least two files are added.
            </li>
            <li>
              Download the result. It is saved as <Code>merged.pdf</Code>, so
              rename it to something descriptive before you share it.
            </li>
          </Steps>
        </>
      ),
    },
    {
      id: "order",
      title: "Getting the order right",
      body: (
        <>
          <p>
            The merged PDF follows the order of the cards exactly: every page
            of file #1, then every page of file #2, and so on. Pages inside
            each file keep their original order.
          </p>
          <Bullets>
            <li>
              <strong>Check the numbers on the cards.</strong> When you select
              several files at once, your device decides the order they
              arrive in, and it isn’t always alphabetical.
            </li>
            <li>
              <strong>Number your files first</strong> if you merge the same
              kind of document often, for example <Code>01-cover.pdf</Code>,{" "}
              <Code>02-report.pdf</Code>. It makes the right order easy to
              spot.
            </li>
            <li>
              <strong>If you can’t drag the cards</strong> on your device,
              remove a file with the bin icon and add it again. Newly added
              files always go to the end of the list.
            </li>
          </Bullets>
          <Note title="Need to reorder or drop individual pages?">
            <p>
              Merge PDF moves whole files, not single pages. To leave pages
              out or change their order, first pull the pages you need out of
              each file with <A href="/split">Split PDF</A> (see{" "}
              <A href="/guides/how-to-split-a-pdf">how to split a PDF</A>),
              then merge the pieces in the order you want.
            </p>
          </Note>
        </>
      ),
    },
    {
      id: "check",
      title: "How to check the merged file",
      body: (
        <>
          <p>Before you send the merged PDF, open it and check:</p>
          <Bullets>
            <li>
              <strong>Page count.</strong> It should equal the pages of all
              the original files added together.
            </li>
            <li>
              <strong>The joins.</strong> Look at the last page of each
              original file and the first page of the next one. This is where
              an ordering mistake shows up.
            </li>
            <li>
              <strong>Page size and orientation.</strong> Each page keeps its
              original size and orientation, so a landscape page stays
              landscape between portrait pages. That is expected.
            </li>
            <li>
              <strong>Text and links.</strong> Text stays selectable and
              searchable, and web links keep working.
            </li>
          </Bullets>
          <p>Some things belong to a whole document rather than to its pages, and they are not carried over:</p>
          <Bullets>
            <li>
              <strong>Bookmarks</strong> (the outline or table of contents in
              a viewer’s sidebar).
            </li>
            <li>
              <strong>Fillable form fields.</strong> A form stops being
              fillable after merging. If a form must stay fillable, send it as
              a separate file.
            </li>
            <li>
              <strong>Document properties</strong> such as the title shown in
              some viewers.
            </li>
          </Bullets>
        </>
      ),
    },
    {
      id: "problems",
      title: "Common problems and fixes",
      body: (
        <>
          <Bullets>
            <li>
              <strong>Merge All is greyed out.</strong> Add a second PDF. A
              merge needs at least two files.
            </li>
            <li>
              <strong>“… could not be merged”.</strong> The message names the
              file that failed. That file usually isn’t a valid PDF or is
              damaged. Open it in a PDF viewer; if it opens, save or export it
              as a new PDF and try again.
            </li>
            <li>
              <strong>“File too large”.</strong> Each file can be up to 50 MB.
              Split a very large file into smaller parts first.
            </li>
            <li>
              <strong>The merged file is very large.</strong> Its size is
              roughly the sizes of the originals added together. If it holds
              scanned pages, <A href="/guides/how-to-compress-a-pdf">compressing it</A>{" "}
              can help.
            </li>
            <li>
              <strong>It’s slow on a phone.</strong> The work happens on your
              device, so big files take longer on older or busy phones. Close
              other tabs, or merge fewer files at a time.
            </li>
          </Bullets>
          <Note title="Password-protected or restricted PDFs come out blank" tone="warning">
            <p>
              If one of your files needs a password to open, or has
              restrictions such as “no editing”, its pages can come out blank
              in the merged PDF, without an error message. Remove the
              protection first with <A href="/unlock">Unlock PDF</A>, then
              merge the unlocked copy. You need the password for files that
              require one to open. Unlock rebuilds each page as an image, so
              text in the unlocked copy can’t be selected or searched.
            </p>
          </Note>
        </>
      ),
    },
  ],
  ctaText: "Combine PDFs in your browser. No signup.",
};
