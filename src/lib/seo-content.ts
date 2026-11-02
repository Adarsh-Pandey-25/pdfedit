import type { ToolSlug } from "@/lib/constants";

export type FaqItem = {
  q: string;
  a: string;
  /** Optional: renders `text` (which must appear in `a`) as a link on tool pages. */
  link?: { text: string; href: string };
};

/** Plain text, or text where each `links[].text` (which must appear in `text`) becomes a link. */
export type SeoRichText =
  | string
  | { text: string; links: { text: string; href: string }[] };

/** Optional extra section on a tool page, rendered between Features and the FAQ. */
export type ToolSeoSection = {
  /** Used for the section's id; keep it unique within the page. */
  id: string;
  heading: string;
  paragraphs?: SeoRichText[];
  items?: SeoRichText[];
  /** Rendered as H3 + paragraph pairs (for example, troubleshooting). */
  subsections?: { heading: string; text: SeoRichText }[];
};

export type ToolSeoContent = {
  slug: ToolSlug;
  /** Page <title> segment (layout appends | PdfEdit+). Keep ~45 chars. */
  title: string;
  description: string;
  keywords: string[];
  /** Keyword-rich H1 override (optional; defaults to tool title) */
  h1: string;
  intro: string;
  howToTitle: string;
  steps: string[];
  featuresTitle: string;
  features: string[];
  sections?: ToolSeoSection[];
  faqs: FaqItem[];
  related: ToolSlug[];
};

export const HOME_FAQS: FaqItem[] = [
  {
    q: "Are my files uploaded to a server?",
    a: "No. Every tool runs entirely in your browser using client-side JavaScript libraries such as pdf-lib and PDF.js. Your files never leave your device.",
  },
  {
    q: "Is PdfEdit+ really free?",
    a: "Yes. All tools are free to use with no signup, no watermarks on exports, and no usage caps beyond the per-file size limit.",
  },
  {
    q: "What file size is supported?",
    a: "Up to 50MB per file for most tools (hero edit upload supports larger files). For best performance we recommend PDFs under 20MB, especially on mobile.",
  },
  {
    q: "Does it work offline?",
    a: "Not yet. Your files are processed on your device, but the site needs an internet connection to load each tool and its PDF engine when you use it.",
  },
  {
    q: "Which browsers are supported?",
    a: "Recent versions of Chrome, Edge, Firefox, and Safari.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The interface is fully responsive. Complex multi-page edits are still smoother on a desktop.",
  },
];

export const TOOL_SEO: Record<ToolSlug, ToolSeoContent> = {
  edit: {
    slug: "edit",
    title: "Edit PDF Online Free",
    description:
      "Edit PDF files online for free. Add text, images, signatures, highlights, and annotations. No signup — files stay private in your browser.",
    keywords: ["edit pdf", "pdf editor", "add text to pdf", "annotate pdf", "sign pdf online"],
    h1: "Edit PDF Online Free",
    intro:
      "Edit PDF files directly in your browser with PdfEdit+’s free online PDF editor. Add text, images, signatures, highlights, shapes, and annotations without installing software. Your documents stay private — all editing happens locally on your device. Ideal for contracts, invoices, resumes, and everyday PDF documents.",
    howToTitle: "How to Edit a PDF Online",
    steps: [
      "Upload your PDF by dragging it onto the page or choosing a file.",
      "Use the toolbar to add text, highlights, signatures, shapes, or images.",
      "To change existing text, choose Edit Text, then double-click the text.",
      "Select Done, then choose Save as PDF or Searchable Text to download.",
    ],
    featuresTitle: "PDF Editor Features",
    features: [
      "Add and style new text with fonts and colors",
      "Highlight text and add notes to important sections",
      "Insert signatures, images, shapes, lines, and arrows",
      "Works entirely in your browser — no server upload",
      "Free to use with no export watermarks",
    ],
    faqs: [
      {
        q: "Can I edit existing PDF text?",
        a: "Yes. Where the PDF contains selectable text, you can edit it in the browser. Scanned pages may need annotation overlays instead.",
      },
      {
        q: "Is the PDF editor free?",
        a: "Yes. PdfEdit+’s online PDF editor is free with no signup and no watermarks on downloads.",
      },
      {
        q: "Do you upload my PDF?",
        a: "No. Editing runs locally in your browser so your file never leaves your device.",
      },
      {
        q: "Will the text stay selectable?",
        a: "Choose Searchable Text to keep the original text layer. Save as PDF saves each page as an image, so its text can't be selected or searched.",
      },
    ],
    related: ["sign", "watermark", "unlock"],
  },
  merge: {
    slug: "merge",
    title: "Merge PDF – Combine PDF Files Online for Free",
    description:
      "Combine PDF files online for free. Add two or more PDFs, drag them into order, and merge them into one document in your browser. No signup needed.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge pdf free"],
    h1: "Merge PDF Files Online Free",
    intro:
      "Combine multiple PDF files into one document with PdfEdit+, a free online PDF merge tool. Add two or more PDFs, drag them into the order you want, and download a single merged file. The files are combined in your browser, so they aren’t uploaded to a server. Useful for reports, contracts, portfolios, and application packets.",
    howToTitle: "How to Merge PDFs",
    steps: [
      "Add two or more PDF files (up to 50 MB each).",
      "Drag the files to set the order you want.",
      "Select Merge All to combine them into one PDF.",
      "Select Download merged PDF to save the file.",
    ],
    featuresTitle: "Merge PDF Features",
    features: [
      "Combine two or more PDFs at once (up to 50 MB each)",
      "Drag-and-drop reordering before merge",
      "Preview or remove any file before merging",
      "Runs in your browser, with no signup",
      "Keeps page content and layout from each source file",
    ],
    faqs: [
      {
        q: "How many PDFs can I merge?",
        a: "There is no set limit on the number of files, but each PDF must be 50 MB or smaller. Many or very large files need more memory and can be slow, especially on phones.",
      },
      {
        q: "Will page order be preserved?",
        a: "Yes. Files are merged in the order you arrange them in the list.",
      },
      {
        q: "Can I merge password-protected PDFs?",
        a: "Not reliably. Pages from a password-protected PDF can come out blank. If you have permission, remove the protection first, for example with Unlock PDF if you know the password, then merge the unlocked copy. Unlocking doesn't work with every protected PDF, and Unlock PDF rebuilds pages as images, so their text can't be selected.",
      },
    ],
    related: ["split", "compress", "page-numbers"],
  },
  split: {
    slug: "split",
    title: "Split PDF Online Free",
    description:
      "Split a PDF into multiple files or extract specific pages online for free. Custom ranges, private browser processing, no signup.",
    keywords: ["split pdf", "extract pdf pages", "pdf splitter", "divide pdf"],
    h1: "Split PDF Online Free",
    intro:
      "Split large PDFs into smaller files or extract only the pages you need. PdfEdit+’s free PDF splitter lets you choose page ranges and download the result instantly. Everything runs in your browser for maximum privacy.",
    howToTitle: "How to Split a PDF",
    steps: [
      "Upload the PDF you want to split.",
      "Click the pages you want or type a range such as 1-3, 5.",
      "Extract them into one PDF, or split every page into its own PDF (ZIP).",
      "Download your extracted pages.",
    ],
    featuresTitle: "Split PDF Features",
    features: [
      "Extract custom page ranges",
      "Split into individual pages when needed",
      "Private local processing",
      "No signup or watermarks",
    ],
    faqs: [
      {
        q: "Can I extract only certain pages?",
        a: "Yes. Enter ranges like 1-3, 5, 8-10 to extract exactly the pages you need.",
      },
    ],
    related: ["merge", "rotate", "compress"],
  },
  compress: {
    slug: "compress",
    title: "Compress PDF Online Free – PDF Compression Tool",
    description:
      "Compress PDF files online for free with a simple PDF compression tool. Choose Low, Medium, or High compression and see how much smaller the file gets.",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "optimize pdf"],
    h1: "Compress PDF Online Free",
    intro:
      "Reduce PDF file size for email, uploads, and sharing with PdfEdit+, a free online PDF compression tool. Choose Low, Medium, or High compression, then compare the new file size with the original before you download. Compression runs in your browser, so your PDF isn’t uploaded to a server.",
    howToTitle: "How to Compress a PDF",
    steps: [
      "Drop a PDF into the upload area or choose one from your device (up to 50 MB).",
      "Choose Low, Medium, or High compression.",
      "Select Compress PDF and check how much smaller the new file is.",
      "Download the compressed PDF, or keep your original if it didn’t get smaller.",
    ],
    featuresTitle: "Compress PDF Features",
    features: [
      "Three compression levels: Low, Medium, and High",
      "Shows how much smaller (or larger) the new file is before you download",
      "Works entirely in your browser",
      "Great for email attachments and uploads",
      "Free with no account required",
    ],
    faqs: [
      {
        q: "Will compression reduce quality?",
        a: "Yes, to some degree. Every level re-renders each page as a JPEG image; stronger levels use lower resolution and image quality. Pick the lightest level when fidelity matters most.",
      },
      {
        q: "Will text stay selectable after compression?",
        a: "No. Because pages are converted to images, text, links, and form fields in the compressed copy are no longer selectable or searchable. Text-only PDFs may not get smaller, so keep your original file.",
      },
      {
        q: "Which compression level should I choose?",
        a: "Start with Medium. Low keeps pages sharper but saves less space. High makes the smallest files, but text and pictures look softer, so check the result before you share it.",
      },
      {
        q: "Why is my compressed PDF larger than the original?",
        a: "Compression turns every page into an image, so PDFs that are mostly text or already compressed can come out larger. The tool tells you when this happens; keep your original file in that case.",
      },
    ],
    related: ["merge", "pdf-to-image", "protect"],
  },
  "pdf-to-image": {
    slug: "pdf-to-image",
    title: "PDF to JPG & PNG Converter Free",
    description:
      "Convert PDF pages to PNG or JPG images online for free. Private browser conversion, no signup required.",
    keywords: ["pdf to image", "pdf to png", "pdf to jpg", "convert pdf pages"],
    h1: "Convert PDF to Image Online",
    intro:
      "Turn PDF pages into high-quality images with PdfEdit+’s free PDF to image converter. Export pages as PNG or JPG for presentations, web use, or editing. Conversion happens in your browser — your PDF is never uploaded.",
    howToTitle: "How to Convert PDF to Images",
    steps: [
      "Upload your PDF file.",
      "Choose PNG or JPG (and JPG quality).",
      "Render pages to images in your browser.",
      "Download all pages as a ZIP file.",
    ],
    featuresTitle: "PDF to Image Features",
    features: [
      "Export pages as PNG or JPG",
      "Preview pages before download",
      "Local rendering with PDF.js",
      "No signup or watermarks",
    ],
    faqs: [
      {
        q: "What image formats are supported?",
        a: "PNG or JPG. For JPG you can set the quality.",
      },
    ],
    related: ["image-to-pdf", "compress", "viewer"],
  },
  "image-to-pdf": {
    slug: "image-to-pdf",
    title: "JPG to PDF – Convert Images to PDF Free",
    description:
      "Convert JPG, PNG, and WebP images to one PDF for free. Arrange the pages, choose A4, Letter, or a custom size, and download. Made in your browser, no signup.",
    keywords: ["image to pdf", "jpg to pdf", "png to pdf", "webp to pdf", "convert images to pdf"],
    h1: "Convert Images to PDF Online",
    intro:
      "Turn photos, scans, and screenshots into a single PDF. Add JPG, PNG, or WebP images, put them in the order you want, choose the page size, orientation, and margin, then download one PDF with one image per page. The PDF is built in your browser, so your images are not uploaded to a server and you don't need an account.",
    howToTitle: "How to Convert Images to PDF",
    steps: [
      "Drop your JPG, PNG, or WebP images into the upload area, or select the upload area to choose them from your device. You can add more images at any time; new ones are added to the end.",
      "Drag the thumbnails, or use the arrow buttons under each one, to put the images in order. The number on each thumbnail is its page number in the PDF, and the bin icon removes an image.",
      "Choose the page size (A4, Letter, or a custom size in millimetres), the orientation, and the margin.",
      "Select Convert to PDF, then select Download to save the file (named images.pdf).",
    ],
    featuresTitle: "Image to PDF Features",
    features: [
      "Accepts JPG, PNG, and WebP images up to 50 MB each",
      "Combines several images into one PDF, one image per page",
      "Set the page order by dragging or with arrow buttons that work with touch and keyboard",
      "JPG phone photos are turned upright using the rotation saved by the camera",
      "A4, Letter, or custom page size, portrait or landscape, and an adjustable margin",
      "Each image is scaled to fit its page and centred, never cropped or stretched",
      "Created in your browser, with no upload and no signup",
    ],
    sections: [
      {
        id: "formats",
        heading: "Supported image formats",
        paragraphs: [
          "You can add .jpg, .jpeg, .png, and .webp files. JPG images are placed in the PDF without being re-compressed, and PNG images are stored without any loss of quality. WebP images are converted to PNG first. This keeps their quality, but the PDF can be noticeably larger than the original WebP files. Transparent areas in PNG images show the white page behind them.",
          "Other formats, including HEIC, GIF, BMP, TIFF, and SVG, are not accepted and show an \"Unsupported file type.\" message. If you add a mix of files, the supported images are still added. iPhone photos are often saved as HEIC, so export or share them as JPG first.",
          {
            text: "Converting a document rather than pictures? Use Word to PDF for .docx files or Text to PDF for plain text.",
            links: [
              { text: "Word to PDF", href: "/word-to-pdf" },
              { text: "Text to PDF", href: "/text-to-pdf" },
            ],
          },
        ],
      },
      {
        id: "layout",
        heading: "Page size, orientation, and margins",
        paragraphs: [
          "Every page in the PDF uses the same size and orientation. A4 is 210 × 297 mm and Letter is 8.5 × 11 inches. Custom lets you type a width and height in millimetres. Portrait always makes the longer side vertical and landscape makes it horizontal, including for custom sizes.",
          "The margin is the empty space kept around each image, 20 mm by default. Set it to 0 to make images as large as possible. Each image is then scaled up or down to fit inside the margins, kept in proportion, and centred on its page. A small page number such as \"2 / 5\" is printed at the bottom of every page, and a narrow strip is kept free for it.",
        ],
      },
      {
        id: "uses",
        heading: "What you can use it for",
        items: [
          "Combining photos of receipts, forms, or ID documents into one PDF to email or upload",
          "Turning screenshots into a PDF you can share or print",
          "Putting scanned pages saved as JPG or PNG into a single document",
          "Collecting phone photos of handwritten notes or a whiteboard into one file",
        ],
      },
      {
        id: "limitations",
        heading: "Limitations",
        items: [
          "Each image must be 50 MB or smaller.",
          "All pages share one page size and orientation. You can't set them per image.",
          "The page number at the bottom of each page can't be turned off.",
          "Text in your images stays part of the picture. It is not selectable or searchable in the PDF.",
          "Images aren't shrunk or compressed, so a PDF made from large photos is a large file, and WebP images can grow when converted to PNG.",
          "JPG photos keep any camera metadata they contain, which can include the GPS location where the photo was taken. If you don't want to share it, remove it with your photo app before adding the photo.",
          "Many or very large images need more memory and can be slow, especially on phones.",
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        subsections: [
          {
            heading: "\"Unsupported file type.\"",
            text: "Only JPG, PNG, and WebP images are accepted. Save or export the image in one of those formats, then add it again.",
          },
          {
            heading: "\"File too large. Max 50 MB.\"",
            text: "Resize the image or export it at a smaller size in your photo app, then add it again.",
          },
          {
            heading: "A photo appears sideways in the PDF",
            text: {
              text: "Phones often save photos sideways with a rotation setting that photo apps follow. For JPG photos, the PDF follows that setting too, so pages match the thumbnails. If a photo is still sideways, the image itself is stored that way, so the thumbnail will look sideways too. Rotate it in your photo app and save a copy before adding it, or fix the page afterwards with Rotate PDF.",
              links: [{ text: "Rotate PDF", href: "/rotate" }],
            },
          },
          {
            heading: "The pages are in the wrong order",
            text: "Drag the thumbnails, or use the arrow buttons under each one, before you select Convert to PDF. The PDF uses the order shown by the numbers on the thumbnails. If you change the order after converting, select Convert to PDF again to make a new file.",
          },
          {
            heading: "The thumbnail looks cropped",
            text: "Thumbnails are cropped to squares to fit the grid. The PDF page shows the whole image.",
          },
          {
            heading: "An image looks blurry",
            text: "Small images are enlarged to fill the page and can look soft. Use the largest version of the image you have, or increase the margin so it is shown smaller.",
          },
          {
            heading: "The PDF is too large to send",
            text: {
              text: "Use smaller images, or run the finished file through Compress PDF.",
              links: [{ text: "Compress PDF", href: "/compress" }],
            },
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Can I combine multiple images into one PDF?",
        a: "Yes. Add several images and each one becomes a page in a single PDF, in the order shown by the numbers on the thumbnails.",
      },
      {
        q: "Are my images uploaded to a server?",
        a: "No. The PDF is created by JavaScript running in your browser, so your images stay on your device.",
      },
      {
        q: "Does converting reduce image quality?",
        a: "No. JPG images are placed in the PDF without being re-compressed, and PNG images are stored without loss. WebP images are converted to PNG, which keeps their quality but can make the PDF larger than the original WebP files.",
      },
      {
        q: "Can I convert HEIC photos from an iPhone?",
        a: "Not directly. HEIC files are not accepted, so export or share the photos as JPG first, then add them.",
      },
      {
        q: "Does it add anything to my pages?",
        a: "Yes. A small page number (for example, \"1 / 3\") is printed at the bottom of each page.",
      },
      {
        q: "Can I turn the PDF back into images?",
        a: "Yes. Use PDF to Image to save each page as a PNG or JPG file.",
      },
    ],
    related: ["pdf-to-image", "merge", "compress"],
  },
  "word-to-pdf": {
    slug: "word-to-pdf",
    title: "Word to PDF Converter Free",
    description:
      "Convert Word .docx files to PDF online for free. Preview your document, choose a theme, and download an A4 PDF. Processed in your browser, no signup.",
    keywords: ["word to pdf", "docx to pdf", "convert word", "office to pdf"],
    h1: "Convert Word to PDF Online",
    intro:
      "Convert a Word .docx file into a clean PDF without installing anything. PdfEdit+ reads your document in your browser, shows a preview, and lets you pick a theme before it creates the PDF. Headings, paragraphs, lists, and bold and italic text are carried over. Images are left out, tables become plain text, and the original page layout is not kept. Your file is not uploaded to a server.",
    howToTitle: "How to Convert Word to PDF",
    steps: [
      "Upload a .docx Word file by dragging it in or choosing it from your device.",
      "Check the preview to see the text, headings, and lists read from your document.",
      "Choose a theme (Modern, Professional, Minimal, or Colorful), then select Convert to PDF.",
      "Download the finished PDF.",
    ],
    featuresTitle: "Word to PDF Features",
    features: [
      "Reads .docx files in your browser (legacy .doc files are not accepted)",
      "Preview of your document's content before you convert",
      "Four themes: Modern, Professional, Minimal, and Colorful",
      "Keeps headings, paragraphs, bullet and numbered lists, and bold and italic text",
      "Handles accented letters and Greek text",
    ],
    faqs: [
      {
        q: "Does it support .doc files?",
        a: "No. The uploader accepts .docx files only, not legacy .doc files. In Word, choose Save As, pick Word Document (.docx), and upload the new file.",
      },
      {
        q: "Are images and tables included?",
        a: "No. Pictures may appear in the preview but are not included in the PDF. Tables are not kept as tables: their text is run together without rows, columns, or borders, so check any document that contains tables before you rely on the result.",
      },
      {
        q: "What formatting is kept?",
        a: "Headings (levels 4 to 6 are shown at the third heading level), paragraphs, bullet and numbered lists, and bold and italic text are kept. Nested list items are merged into their parent item. Underline, strikethrough, link formatting, colors, fonts, Word headers and footers, and page layout are not kept; the theme you choose sets the typography.",
      },
      {
        q: "What does the finished PDF look like?",
        a: "Pages are A4. The PDF starts with your file name as a title, followed by your content in the selected theme, and every page has a \"Page 1 of 3\"-style footer.",
      },
    ],
    related: ["text-to-pdf", "image-to-pdf", "compress"],
  },
  "text-to-pdf": {
    slug: "text-to-pdf",
    title: "Text to PDF Online Free",
    description:
      "Create a styled PDF from plain text or Markdown online for free. Color themes, headings, lists, and accented and Greek characters — private in your browser.",
    keywords: ["text to pdf", "markdown to pdf", "create pdf", "plain text pdf"],
    h1: "Create a PDF from Text Online",
    intro:
      "Turn notes, Markdown, or plain text into a beautiful PDF. PdfEdit+ supports headings, lists, quotes, and accented and Greek characters, with four color themes. Generation runs in your browser with embedded fonts.",
    howToTitle: "How to Create a PDF from Text",
    steps: [
      "Enter a document title. It becomes the heading at the top of the PDF and the name of the downloaded file.",
      "Pick a theme: Modern, Professional, Minimal, or Colorful.",
      "Paste or type your text, using Markdown-style syntax for headings, lists, and quotes if you like.",
      "Select Create PDF, then download your document.",
    ],
    featuresTitle: "Text to PDF Features",
    features: [
      "Headings with #, ##, and ###, plus bullet and numbered lists",
      "Quotes, fenced code blocks, and --- dividers",
      "Bold, italic, and inline code formatting",
      "Accented and Greek characters (emoji aren't supported)",
      "Four themes: Modern, Professional, Minimal, and Colorful",
      "No signup required",
    ],
    faqs: [
      {
        q: "Which Markdown syntax works?",
        a: "Start a line with #, ##, or ### followed by a space for three heading levels. Start lines with -, *, •, or → for bullets, or with 1. or 1) for a numbered list. Begin a line with > for a quote, put code between two lines of three backticks (```), and use --- on its own line for a divider. Inside text, **bold**, *italic*, ***bold italic***, and `inline code` work. A short line written in ALL CAPS also becomes a heading, and lines without a blank line between them join into one paragraph.",
      },
      {
        q: "What isn't supported?",
        a: "Links and images are printed as plain text, exactly as you typed them. Tables aren't laid out: their rows run together into one paragraph. Deeper headings such as #### and lines starting with + are shown as ordinary text, and indented sub-items become regular items in the same list. Emoji aren't supported.",
      },
      {
        q: "What page size and styles do I get?",
        a: "Pages are A4. You can choose the Modern, Professional, Minimal, or Colorful theme, and bold, italic, and inline code text are supported.",
      },
    ],
    related: ["word-to-pdf", "edit", "extract-text"],
  },
  rotate: {
    slug: "rotate",
    title: "Rotate PDF Pages Online Free",
    description:
      "Rotate PDF pages online for free. Fix upside-down or sideways scans privately in your browser — no signup.",
    keywords: ["rotate pdf", "rotate pdf pages", "fix pdf orientation"],
    h1: "Rotate PDF Pages Online",
    intro:
      "Fix PDF orientation in seconds. Rotate individual pages or the whole document clockwise by 90° or 180°. PdfEdit+ applies rotations locally so scanned documents and exports stay private.",
    howToTitle: "How to Rotate a PDF",
    steps: [
      "Upload your PDF.",
      "Rotate any page by 90° or 180°, or rotate all pages at once.",
      "Apply the rotation in your browser.",
      "Download the corrected PDF.",
    ],
    featuresTitle: "Rotate PDF Features",
    features: [
      "Rotate by 90° increments",
      "Per-page or whole-document control",
      "Local private processing",
      "Free unlimited use within size limits",
    ],
    faqs: [
      {
        q: "Can I rotate only one page?",
        a: "Yes. Choose specific pages when you need mixed orientations.",
      },
    ],
    related: ["split", "merge", "compress"],
  },
  watermark: {
    slug: "watermark",
    title: "Add Watermark to PDF Free",
    description:
      "Add a text watermark to PDF online for free. Control font, opacity, angle, and position. Private browser processing.",
    keywords: ["pdf watermark", "add watermark to pdf", "stamp pdf", "confidential watermark"],
    h1: "Add a Watermark to PDF Online",
    intro:
      "Protect and brand documents with a text watermark such as CONFIDENTIAL or DRAFT. Adjust font, size, opacity, rotation, color, and placement, then apply it across your PDF. PdfEdit+ watermarks your files in the browser so drafts and confidential docs never leave your device.",
    howToTitle: "How to Watermark a PDF",
    steps: [
      "Upload your PDF.",
      "Enter your watermark text.",
      "Tune opacity, angle, color, and position.",
      "Apply and download the watermarked PDF.",
    ],
    featuresTitle: "Watermark Features",
    features: [
      "Text watermarks with font and size options, plus bold and italic where the font supports them",
      "Opacity, angle, and color controls",
      "Nine placement positions, including corners and center",
      "Private local processing",
    ],
    faqs: [
      {
        q: "Can I use a diagonal CONFIDENTIAL stamp?",
        a: "Yes. Set the angle (for example −45°) and opacity to create a classic confidential watermark.",
      },
    ],
    related: ["protect", "page-numbers", "sign"],
  },
  "page-numbers": {
    slug: "page-numbers",
    title: "Add Page Numbers to PDF Free",
    description:
      "Add page numbers to PDF online for free. Choose position, number format, starting number, size, and color. Private browser processing, no signup.",
    keywords: ["add page numbers to pdf", "pdf pagination", "number pdf pages"],
    h1: "Add Page Numbers to PDF Online",
    intro:
      "Number your PDF pages with flexible formats and positions. PdfEdit+ lets you place page numbers at common corners or centers and download an updated PDF — all processed locally in your browser.",
    howToTitle: "How to Add Page Numbers",
    steps: [
      "Upload your PDF.",
      "Choose number format and position.",
      "Apply page numbers in your browser.",
      "Download the numbered PDF.",
    ],
    featuresTitle: "Page Number Features",
    features: [
      "Multiple positions (top/bottom, left/center/right)",
      "Custom start number and formats",
      "Adjustable font size and color",
      "No signup required",
    ],
    faqs: [
      {
        q: "Can I start numbering from a custom value?",
        a: "Yes. Set the first number, for example to continue from another document. Every page is numbered, including the first.",
      },
    ],
    related: ["watermark", "rotate", "split"],
  },
  viewer: {
    slug: "viewer",
    title: "PDF Reader Online",
    description:
      "Open and read PDF files online for free with page navigation, zoom controls, thumbnails, and text search. View your PDF directly in your browser.",
    keywords: ["pdf reader online", "online pdf reader", "open pdf online", "pdf viewer online", "free pdf viewer", "read pdf online"],
    h1: "PDF Reader Online",
    intro:
      "Open and read PDF files directly in your browser with PdfEdit+. Navigate between pages, view page thumbnails, zoom in or out, and search the document for words and phrases when the PDF has a text layer. No software installation is required, and your PDF stays on your device.",
    howToTitle: "How to Open and Read a PDF Online",
    steps: [
      "Choose a PDF from your device or drag it into the uploader.",
      "Wait for the PDF to load in your browser.",
      "Use Previous and Next to navigate through pages, or select a thumbnail.",
      "Use Zoom In, Zoom Out, Fit Width, or Fit Page to adjust the document.",
      "Enter a word or phrase in the search field and press Enter or click Search.",
    ],
    featuresTitle: "PDF Reader Features",
    features: [
      "Open and read PDF files in your browser",
      "Navigate through all pages using Previous and Next controls",
      "View thumbnails for the first 40 pages",
      "Zoom in, zoom out, and use Fit Width or Fit Page",
      "Search for words and phrases in PDFs that have a text layer",
      "Responsive layout for desktop and mobile",
      "Files processed locally in your browser",
    ],
    faqs: [
      {
        q: "Do I need to install software?",
        a: "No. You can open and read a PDF using a modern web browser without installing a separate PDF reader.",
      },
      {
        q: "How do I open a PDF online?",
        a: "Select a PDF file from your device or drag it into the uploader. The viewer loads the document in your browser.",
      },
      {
        q: "Can I search for text in a PDF?",
        a: "Yes. Enter a word or phrase to find pages containing it. Search works with PDFs that have a text layer. Scanned pages without a text layer cannot be searched.",
      },
      {
        q: "Can I zoom in and out of a PDF?",
        a: "Yes. Use Zoom In and Zoom Out, or choose Fit Width or Fit Page to adjust how the page appears.",
      },
      {
        q: "Can I view all pages in a PDF?",
        a: "Yes. You can navigate through all pages using the Previous and Next buttons. The thumbnail panel displays thumbnails for the first 40 pages.",
      },
      {
        q: "Can I select or copy text from a PDF?",
        a: "No. This viewer renders PDF pages on a canvas, so text cannot be selected or copied directly. Users who need to extract text can use the Extract Text tool.",
        link: { text: "Extract Text", href: "/extract-text" },
      },
      {
        q: "Can I open a password-protected PDF?",
        a: "The viewer does not provide a password prompt. If a PDF requires a password to open, it cannot be opened directly in this viewer. Users who know the password can try the Unlock PDF tool, subject to its supported encryption types.",
        link: { text: "Unlock PDF", href: "/unlock" },
      },
      {
        q: "Can I click links inside a PDF?",
        a: "No. Links inside a PDF are not clickable in this viewer.",
      },
      {
        q: "Can I scroll continuously through the document?",
        a: "No. The viewer displays one page at a time. Use Previous and Next or the page thumbnails to navigate.",
      },
      {
        q: "Can I open a PDF from a web address, print it, or download it?",
        a: "No. The viewer currently opens PDF files selected from your device. It does not provide URL-based opening, printing, or downloading controls.",
      },
    ],
    related: ["edit", "sign", "extract-text"],
  },
  protect: {
    slug: "protect",
    title: "Password Protect PDF Free",
    description:
      "Add password protection to PDF online for free. Encrypt documents in your browser — no signup, files stay private.",
    keywords: ["protect pdf", "password protect pdf", "encrypt pdf", "lock pdf"],
    h1: "Password Protect a PDF Online",
    intro:
      "Lock sensitive PDFs with a password before you share them. PdfEdit+ encrypts files in your browser so credentials and document contents are not sent to our servers. Use it for contracts, HR files, and personal records.",
    howToTitle: "How to Protect a PDF",
    steps: [
      "Upload the PDF you want to lock.",
      "Set an open password, an owner password, or both, and choose whether printing, copying, and editing are allowed.",
      "Encrypt the file locally.",
      "Download the protected PDF.",
    ],
    featuresTitle: "PDF Protection Features",
    features: [
      "Password encryption",
      "Printing, copying, and editing permissions",
      "Local processing for privacy",
      "Free to use without an account",
    ],
    faqs: [
      {
        q: "Can I remove a password later?",
        a: "If you know the password, use the Unlock PDF tool to remove protection.",
      },
      {
        q: "Do the permissions always apply?",
        a: "Not everywhere. Standard PDF viewers respect them, but some software can ignore them. If you leave the owner password blank, a separate random owner password is created, so the open password can't remove the restrictions. If you enter the same password in both fields, anyone who knows it can remove them.",
      },
    ],
    related: ["unlock", "watermark", "sign"],
  },
  unlock: {
    slug: "unlock",
    title: "Unlock PDF – Remove PDF Password Free",
    description:
      "Remove PDF password protection online when you know the password. Unlock PDFs privately in your browser — free, no signup.",
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "open protected pdf"],
    h1: "Unlock a Password-Protected PDF",
    intro:
      "Remove a PDF password when you are authorized and know the credentials. PdfEdit+ unlocks the file locally in your browser so you can merge, annotate, or share it again without uploading sensitive documents.",
    howToTitle: "How to Unlock a PDF",
    steps: [
      "Upload the protected PDF.",
      "Enter the correct password.",
      "Unlock the file in your browser.",
      "Download the unprotected PDF.",
    ],
    featuresTitle: "Unlock PDF Features",
    features: [
      "Remove password when authorized",
      "Local decryption workflow",
      "No account required",
      "Pairs with Protect PDF for round-trips",
    ],
    faqs: [
      {
        q: "Can you crack unknown passwords?",
        a: "No. You must provide the correct password. We do not offer password cracking.",
      },
      {
        q: "Will the unlocked PDF keep selectable text?",
        a: "No. The unlocked copy is rebuilt from page images, so text is not selectable or editable. Keep your original if you need the text layer.",
      },
    ],
    related: ["protect", "edit", "merge"],
  },
  sign: {
    slug: "sign",
    title: "Sign PDF Online Free",
    description:
      "Add your signature to PDF online for free. Draw, type, or upload a signature. Private browser signing — no signup.",
    keywords: ["sign pdf", "esign pdf", "add signature to pdf", "electronic signature"],
    h1: "Sign PDF Online Free",
    intro:
      "Sign agreements and forms without printing. Draw, type, or upload a signature image and place it on your PDF. PdfEdit+ keeps signing local to your browser for a private, free e-sign workflow.",
    howToTitle: "How to Sign a PDF",
    steps: [
      "Upload the PDF that needs a signature.",
      "Create a signature by drawing, typing, or uploading an image, then select Use this signature.",
      "Place and resize the signature on the page.",
      "Select Apply & download.",
    ],
    featuresTitle: "Sign PDF Features",
    features: [
      "Draw, type, or upload signatures",
      "Position freely on any page",
      "Save recent signatures on your device",
      "No signup or watermarked exports",
    ],
    faqs: [
      {
        q: "Is an electronic signature legally binding?",
        a: "Requirements vary by jurisdiction and document type. PdfEdit+ provides the signing tools; consult local rules for legal validity.",
      },
    ],
    related: ["edit", "protect", "watermark"],
  },
  "extract-text": {
    slug: "extract-text",
    title: "PDF to Text (TXT) – Extract Text from PDF Free",
    description:
      "Convert PDF to text online for free. Extract text from every page, edit it, then copy it or download a TXT file. Runs in your browser, no signup.",
    keywords: ["pdf to text", "extract text from pdf", "pdf to txt", "convert pdf to text", "copy text from pdf", "pdf text extractor"],
    h1: "Extract Text from PDF Online",
    intro:
      "Convert a PDF to text in your browser. PdfEdit+ reads the text stored on every page, shows it in an editable box, and lets you copy it, download it as a TXT file, or save it as a new formatted PDF. It works with PDFs that contain real text, not scanned images. Your PDF is processed locally in your browser and isn't uploaded during extraction.",
    howToTitle: "How to Extract Text from a PDF",
    steps: [
      "Drop a PDF into the upload area, or select the upload area to choose one from your device. You can extract one PDF at a time, up to 50 MB.",
      "The text on every page is extracted in your browser. Pages are separated by a blank line.",
      "Check the text in the box and edit it if you need to.",
      "Select Copy or Download .txt, or choose a theme and select Download PDF to save a formatted copy.",
    ],
    featuresTitle: "PDF to Text Features",
    features: [
      "Extracts the text stored on every page of a PDF",
      "Edit the extracted text before you use it",
      "Copy to the clipboard or download a UTF-8 .txt file",
      "Save the text as a new formatted PDF in four themes",
      "One PDF at a time, up to 50 MB",
      "Processed locally in your browser; your PDF isn't uploaded",
    ],
    sections: [
      {
        id: "what-you-get",
        heading: "What you get",
        paragraphs: [
          "The tool copies the text stored in the PDF, page by page. Text from the same page is joined into one block, and pages are separated by a blank line.",
          "Line breaks, columns, and tables aren't kept, and images aren't included. The text follows the order in which it is stored in the PDF. In some multi-column layouts, that order may differ from the reading order.",
          {
            text: "Need a formatted document instead? Download PDF lays the text out on new pages in one of four themes (Modern, Professional, Minimal, or Colorful), using the same layout engine as Text to PDF.",
            links: [{ text: "Text to PDF", href: "/text-to-pdf" }],
          },
        ],
      },
      {
        id: "limitations",
        heading: "Limitations",
        items: [
          "There's no OCR. Scanned pages that are only images have no text to extract.",
          "PDFs that need a password to open can't be read, because the tool has no password prompt.",
          "The formatted PDF supports Latin, Greek, and Cyrillic letters. Other characters, such as Chinese, Arabic, or Hindi, appear as \"?\" in it. Copy and the TXT file keep every character.",
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        subsections: [
          {
            heading: "\"Could not extract text\"",
            text: "The PDF may need a password to open, or it may be damaged. Check that it opens in another PDF app without a password.",
          },
          {
            heading: "The text box is empty",
            text: {
              text: "The PDF has no text layer, which is usual for scanned documents and photos of pages. This tool can't read text from images. You can confirm it in the PDF viewer: its search finds nothing on pages without a text layer.",
              links: [{ text: "PDF viewer", href: "/viewer" }],
            },
          },
          {
            heading: "Words run together or are in the wrong order",
            text: "Line breaks aren't kept, and the text follows the order stored in the PDF, which may differ from the reading order. Edit the text in the box before you copy or download it.",
          },
          {
            heading: "\"Clipboard access denied\"",
            text: "Your browser blocked copying. Select the text in the box and copy it yourself, or use Download .txt.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Can I convert a PDF to a TXT file?",
        a: "Yes. After the text is extracted, select Download .txt to save it as a plain text file (UTF-8).",
      },
      {
        q: "Does it work on scanned PDFs?",
        a: "No. The tool reads the text stored in the PDF and doesn't do OCR, so pages that are only images return no text.",
      },
      {
        q: "Is the layout kept?",
        a: "No. Text from each page is joined into one block, and pages are separated by a blank line, so line breaks, columns, and tables aren't preserved.",
      },
      {
        q: "Can I edit the text before copying or downloading it?",
        a: "Yes. The extracted text appears in an editable box, and Copy, Download .txt, and Download PDF all use your edited version.",
      },
      {
        q: "Can I extract text from a password-protected PDF?",
        a: "Not if the PDF needs a password to open. The tool has no password prompt, so it shows \"Could not extract text\" instead.",
      },
      {
        q: "Which languages are supported?",
        a: "Copy and Download .txt keep every character in the PDF's text. Download PDF supports Latin, Greek, and Cyrillic letters; other characters, such as Chinese, Arabic, or Hindi, appear as \"?\" in the formatted PDF.",
      },
      {
        q: "Is my PDF uploaded to a server?",
        a: "No. Text extraction runs locally in your browser, so your PDF isn't uploaded during extraction. The page still loads code from the internet, such as the library it uses to read PDFs.",
      },
    ],
    related: ["edit", "text-to-pdf", "viewer"],
  },
};

export function getToolSeo(slug: ToolSlug): ToolSeoContent {
  return TOOL_SEO[slug];
}
