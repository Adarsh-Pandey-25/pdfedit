import type { ToolSlug } from "@/lib/constants";

export type FaqItem = { q: string; a: string };

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
    title: "Merge PDF Files Online Free",
    description:
      "Merge multiple PDF files into one document online for free. Drag and drop to reorder files. No signup, private browser processing.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge pdf free"],
    h1: "Merge PDF Files Online Free",
    intro:
      "Combine multiple PDF files into a single document with PdfEdit+’s free PDF merger. Upload several PDFs, drag to reorder, and download one merged file. Processing happens in your browser — nothing is uploaded to our servers. Perfect for reports, contracts, portfolios, and multi-document packets.",
    howToTitle: "How to Merge PDFs",
    steps: [
      "Upload two or more PDF files.",
      "Drag the files to set the order you want.",
      "Click merge to combine them into one PDF.",
      "Download your merged document instantly.",
    ],
    featuresTitle: "Merge PDF Features",
    features: [
      "Combine unlimited PDFs in one session (within file size limits)",
      "Drag-and-drop reordering before merge",
      "Fast local processing with no signup",
      "Keeps page content and layout from each source file",
    ],
    faqs: [
      {
        q: "How many PDFs can I merge?",
        a: "You can merge multiple PDFs in one go. Keep each file within the size limit for best performance.",
      },
      {
        q: "Will page order be preserved?",
        a: "Yes. Files are merged in the order you arrange them in the list.",
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
    title: "Compress PDF Online Free",
    description:
      "Compress PDF files online to reduce size without signup. Fast, private browser compression for email and sharing.",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "optimize pdf"],
    h1: "Compress PDF Online Free",
    intro:
      "Reduce PDF file size for email, uploads, and sharing with PdfEdit+’s free PDF compressor. Choose a quality level that balances clarity and size. Compression runs locally in your browser so your documents stay private.",
    howToTitle: "How to Compress a PDF",
    steps: [
      "Upload your PDF file.",
      "Choose a compression level that fits your needs.",
      "Run compression and review the new file size.",
      "Download the optimized PDF.",
    ],
    featuresTitle: "Compress PDF Features",
    features: [
      "Multiple quality / size tradeoffs",
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
      "Convert JPG, PNG, and WebP images to PDF online for free. Combine multiple images into one PDF privately in your browser.",
    keywords: ["image to pdf", "jpg to pdf", "png to pdf", "convert images to pdf"],
    h1: "Convert Images to PDF Online",
    intro:
      "Create a polished PDF from your photos or screenshots. Upload JPG, PNG, or WebP files, arrange them, and download a single PDF. PdfEdit+ builds the document locally so your images stay on your device.",
    howToTitle: "How to Convert Images to PDF",
    steps: [
      "Upload one or more images.",
      "Drag the image thumbnails to change their order.",
      "Generate the PDF in your browser.",
      "Download your new PDF file.",
    ],
    featuresTitle: "Image to PDF Features",
    features: [
      "Supports JPG, PNG, and WebP",
      "Combine multiple images into one PDF",
      "Page size (A4, Letter, or custom), orientation, and margin options",
      "100% browser-based and private",
    ],
    faqs: [
      {
        q: "Can I add multiple images?",
        a: "Yes. Add several images and they become pages in the output PDF.",
      },
      {
        q: "Does it add anything to my pages?",
        a: "Yes. A small page number (for example, \"1 / 3\") is printed at the bottom of each page.",
      },
      {
        q: "Can I choose the page size and orientation?",
        a: "Yes. Choose A4, Letter, or a custom size in millimetres, switch between portrait and landscape, and set the page margin before you generate the PDF. Each image can be up to 50 MB.",
      },
      {
        q: "Does converting reduce image quality?",
        a: "No. JPG and PNG images are placed in the PDF as they are, without being re-compressed. WebP images are first converted to PNG, which keeps their quality but can make the PDF noticeably larger than the original WebP files.",
      },
      {
        q: "How are images placed on each page?",
        a: "Each image gets its own page. It is scaled to fit inside the margins, kept in proportion, and centred, so it is never cropped or stretched. Small images are enlarged to fill the space and can look soft, so use the largest version of an image you have, or increase the margin to keep it smaller on the page.",
      },
    ],
    related: ["pdf-to-image", "word-to-pdf", "compress"],
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
    title: "PDF Viewer Online Free",
    description:
      "View and read PDF files online for free in your browser. Fast, private PDF viewer with no signup or uploads to our servers.",
    keywords: ["pdf viewer", "read pdf online", "online pdf reader"],
    h1: "Free Online PDF Viewer",
    intro:
      "Open and read PDFs instantly with PdfEdit+’s free online PDF viewer. Zoom, navigate pages, and review documents without installing a reader. Files are rendered locally for privacy.",
    howToTitle: "How to View a PDF Online",
    steps: [
      "Upload or open your PDF file.",
      "Browse pages with the viewer controls.",
      "Zoom in for detailed reading.",
      "Close when finished — nothing was uploaded.",
    ],
    featuresTitle: "PDF Viewer Features",
    features: [
      "Fast in-browser rendering",
      "Page navigation, zoom, and fit-to-width or fit-to-page",
      "Works on desktop and mobile",
      "Search for a word or phrase across all pages",
      "Private local viewing",
    ],
    faqs: [
      {
        q: "Do I need to install software?",
        a: "No. The viewer runs in any modern web browser.",
      },
      {
        q: "Can I search for text and open long documents?",
        a: "Yes. Search looks through every page and tells you which pages contain the text; scanned pages without a text layer can't be searched. For long files, the thumbnail sidebar shows the first 40 pages, and you can still move through every page with the next and previous buttons.",
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
    title: "Extract Text from PDF – PDF to Text Free",
    description:
      "Extract text from PDF online for free. Copy it, download a .txt file, or save a formatted PDF. Private browser extraction, no signup.",
    keywords: ["extract text from pdf", "pdf to text", "copy pdf text", "pdf text extractor"],
    h1: "Extract Text from PDF Online",
    intro:
      "Pull selectable text out of PDF documents for notes, quotes, or reuse. PdfEdit+ extracts text in your browser and can optionally generate a clean downloadable PDF from the result — without uploading your file.",
    howToTitle: "How to Extract Text from a PDF",
    steps: [
      "Upload your PDF.",
      "The text is extracted automatically from every page.",
      "Copy the text, download it as .txt, or save a formatted PDF.",
      "Use the content wherever you need it.",
    ],
    featuresTitle: "Extract Text Features",
    features: [
      "Fast client-side text extraction",
      "Copy to clipboard support",
      "Optional download as a styled PDF",
      "Private local processing",
    ],
    faqs: [
      {
        q: "Does it work on scanned PDFs?",
        a: "Scanned pages without a text layer may return little or no text. Use OCR software first for image-only scans.",
      },
      {
        q: "Is the layout kept?",
        a: "No. Text from each page is joined into one block, so line breaks, columns, and tables aren't preserved.",
      },
    ],
    related: ["edit", "text-to-pdf", "viewer"],
  },
};

export function getToolSeo(slug: ToolSlug): ToolSeoContent {
  return TOOL_SEO[slug];
}
