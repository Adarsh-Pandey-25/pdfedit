import type { ToolSlug } from "@/lib/constants";

export type FaqItem = { q: string; a: string };

export type ToolSeoContent = {
  slug: ToolSlug;
  /** Page <title> segment (layout appends | PDFForge). Keep ~45 chars. */
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
    a: "No. Every tool runs entirely in your browser using WebAssembly and client-side libraries. Your files never leave your device.",
  },
  {
    q: "Is PDFForge really free?",
    a: "Yes. All tools are free to use with no signup, no watermarks on exports, and no usage caps beyond the per-file size limit.",
  },
  {
    q: "What file size is supported?",
    a: "Up to 50MB per file for most tools (hero edit upload supports larger files). For best performance we recommend PDFs under 20MB, especially on mobile.",
  },
  {
    q: "Does it work offline?",
    a: "After the app loads, most tools work without a network connection since processing is local. The first visit needs internet to load scripts and fonts.",
  },
  {
    q: "Which browsers are supported?",
    a: "Chrome, Edge, Firefox, and Safari (recent versions). A modern browser with WebAssembly support is required.",
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
      "Edit PDF files directly in your browser with PDFForge’s free online PDF editor. Add text, images, signatures, highlights, shapes, and annotations without installing software. Your documents stay private — all editing happens locally on your device. Ideal for contracts, forms, invoices, resumes, and everyday PDF documents.",
    howToTitle: "How to Edit a PDF Online",
    steps: [
      "Upload your PDF by dragging it onto the page or choosing a file.",
      "Use the toolbar to add text, highlights, signatures, shapes, or images.",
      "Click existing text where supported to adjust content and styling.",
      "Download your edited PDF when you are finished.",
    ],
    featuresTitle: "PDF Editor Features",
    features: [
      "Add and style new text with fonts and colors",
      "Highlight, underline, and annotate important sections",
      "Insert signatures, shapes, arrows, and stamps",
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
        a: "Yes. PDFForge’s online PDF editor is free with no signup and no watermarks on downloads.",
      },
      {
        q: "Do you upload my PDF?",
        a: "No. Editing runs locally in your browser so your file never leaves your device.",
      },
    ],
    related: ["sign", "watermark", "merge"],
  },
  merge: {
    slug: "merge",
    title: "Merge PDF Files Online Free",
    description:
      "Merge multiple PDF files into one document online for free. Drag and drop to reorder pages. No signup, private browser processing.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge pdf free"],
    h1: "Merge PDF Files Online Free",
    intro:
      "Combine multiple PDF files into a single document with PDFForge’s free PDF merger. Upload several PDFs, drag to reorder, and download one merged file. Processing happens in your browser — nothing is uploaded to our servers. Perfect for reports, contracts, portfolios, and multi-document packets.",
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
      "Split large PDFs into smaller files or extract only the pages you need. PDFForge’s free PDF splitter lets you choose page ranges and download the result instantly. Everything runs in your browser for maximum privacy.",
    howToTitle: "How to Split a PDF",
    steps: [
      "Upload the PDF you want to split.",
      "Choose all pages or enter a custom page range.",
      "Run the split to generate new PDF files.",
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
      "Reduce PDF file size for email, uploads, and sharing with PDFForge’s free PDF compressor. Choose a quality level that balances clarity and size. Compression runs locally in your browser so your documents stay private.",
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
        a: "Some modes reduce image quality to shrink size. Pick a lighter setting when fidelity matters most.",
      },
    ],
    related: ["merge", "pdf-to-image", "protect"],
  },
  "pdf-to-image": {
    slug: "pdf-to-image",
    title: "PDF to Image Converter Free",
    description:
      "Convert PDF pages to PNG or JPG images online for free. Private browser conversion, no signup required.",
    keywords: ["pdf to image", "pdf to png", "pdf to jpg", "convert pdf pages"],
    h1: "Convert PDF to Image Online",
    intro:
      "Turn PDF pages into high-quality images with PDFForge’s free PDF to image converter. Export pages as PNG or JPG for presentations, web use, or editing. Conversion happens in your browser — your PDF is never uploaded.",
    howToTitle: "How to Convert PDF to Images",
    steps: [
      "Upload your PDF file.",
      "Choose image format and pages to export.",
      "Render pages to images in your browser.",
      "Download the image files.",
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
        a: "You can export common formats such as PNG and JPG depending on the tool options.",
      },
    ],
    related: ["image-to-pdf", "compress", "viewer"],
  },
  "image-to-pdf": {
    slug: "image-to-pdf",
    title: "Image to PDF Converter Free",
    description:
      "Convert JPG, PNG, and WebP images to PDF online for free. Combine multiple images into one PDF privately in your browser.",
    keywords: ["image to pdf", "jpg to pdf", "png to pdf", "convert images to pdf"],
    h1: "Convert Images to PDF Online",
    intro:
      "Create a polished PDF from your photos or screenshots. Upload JPG, PNG, or WebP files, arrange them, and download a single PDF. PDFForge builds the document locally so your images stay on your device.",
    howToTitle: "How to Convert Images to PDF",
    steps: [
      "Upload one or more images.",
      "Reorder images if needed.",
      "Generate the PDF in your browser.",
      "Download your new PDF file.",
    ],
    featuresTitle: "Image to PDF Features",
    features: [
      "Supports JPG, PNG, and WebP",
      "Combine multiple images into one PDF",
      "Professional page layout options",
      "100% browser-based and private",
    ],
    faqs: [
      {
        q: "Can I add multiple images?",
        a: "Yes. Add several images and they become pages in the output PDF.",
      },
    ],
    related: ["pdf-to-image", "merge", "compress"],
  },
  "word-to-pdf": {
    slug: "word-to-pdf",
    title: "Word to PDF Converter Free",
    description:
      "Convert Word DOCX documents to PDF online for free. Preserve structure with private browser conversion — no signup.",
    keywords: ["word to pdf", "docx to pdf", "convert word", "office to pdf"],
    h1: "Convert Word to PDF Online",
    intro:
      "Convert DOCX Word documents into shareable PDFs with PDFForge. Headings, lists, and formatting are mapped into a clean PDF layout using our browser-based generator. Your document is not uploaded to a server.",
    howToTitle: "How to Convert Word to PDF",
    steps: [
      "Upload your .docx Word file.",
      "Optionally choose a PDF theme or style.",
      "Convert the document in your browser.",
      "Download the finished PDF.",
    ],
    featuresTitle: "Word to PDF Features",
    features: [
      "DOCX support with structured layout",
      "Unicode-friendly fonts",
      "Theme presets for professional output",
      "Private local conversion",
    ],
    faqs: [
      {
        q: "Does it support .doc files?",
        a: "The converter focuses on modern DOCX files. Save older documents as DOCX before converting.",
      },
    ],
    related: ["text-to-pdf", "merge", "compress"],
  },
  "text-to-pdf": {
    slug: "text-to-pdf",
    title: "Text to PDF Online Free",
    description:
      "Create a styled PDF from plain text or Markdown online for free. Themes, headings, lists, and Unicode — private in your browser.",
    keywords: ["text to pdf", "markdown to pdf", "create pdf", "plain text pdf"],
    h1: "Create a PDF from Text Online",
    intro:
      "Turn notes, Markdown, or plain text into a beautiful PDF. PDFForge supports headings, lists, quotes, and Unicode characters with professional themes. Generation runs in your browser with embedded fonts.",
    howToTitle: "How to Create a PDF from Text",
    steps: [
      "Paste or type your text (Markdown-style syntax supported).",
      "Pick a theme for typography and colors.",
      "Generate the PDF locally.",
      "Download your document.",
    ],
    featuresTitle: "Text to PDF Features",
    features: [
      "Markdown-like headings and lists",
      "Unicode and special characters",
      "Multiple visual themes",
      "No signup required",
    ],
    faqs: [
      {
        q: "Can I use Markdown?",
        a: "Yes. Use headings, bullets, numbered lists, quotes, and code-style blocks for structure.",
      },
    ],
    related: ["word-to-pdf", "edit", "merge"],
  },
  rotate: {
    slug: "rotate",
    title: "Rotate PDF Pages Online Free",
    description:
      "Rotate PDF pages online for free. Fix upside-down or sideways scans privately in your browser — no signup.",
    keywords: ["rotate pdf", "rotate pdf pages", "fix pdf orientation"],
    h1: "Rotate PDF Pages Online",
    intro:
      "Fix PDF orientation in seconds. Rotate individual pages or the whole document left or right. PDFForge applies rotations locally so scanned documents and exports stay private.",
    howToTitle: "How to Rotate a PDF",
    steps: [
      "Upload your PDF.",
      "Select pages and rotation angle.",
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
      "Add text or image watermarks to PDF online for free. Control opacity, angle, and position. Private browser processing.",
    keywords: ["pdf watermark", "add watermark to pdf", "stamp pdf", "confidential watermark"],
    h1: "Add a Watermark to PDF Online",
    intro:
      "Protect and brand documents with text or image watermarks. Adjust opacity, rotation, color, and placement, then apply across your PDF. PDFForge watermarks your files in the browser so drafts and confidential docs never leave your device.",
    howToTitle: "How to Watermark a PDF",
    steps: [
      "Upload your PDF.",
      "Enter watermark text or choose an image.",
      "Tune opacity, angle, color, and position.",
      "Apply and download the watermarked PDF.",
    ],
    featuresTitle: "Watermark Features",
    features: [
      "Text and image watermarks",
      "Opacity, angle, and position controls",
      "Tile and corner placement options",
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
      "Add page numbers to PDF online for free. Choose position, format, and style. Private browser processing, no signup.",
    keywords: ["add page numbers to pdf", "pdf pagination", "number pdf pages"],
    h1: "Add Page Numbers to PDF Online",
    intro:
      "Number your PDF pages with flexible formats and positions. PDFForge lets you place page numbers at common corners or centers and download an updated PDF — all processed locally in your browser.",
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
      "Unicode-capable fonts",
      "No signup required",
    ],
    faqs: [
      {
        q: "Can I start numbering from a custom value?",
        a: "Yes. Set the starting number when you need front matter excluded or continued sequences.",
      },
    ],
    related: ["watermark", "merge", "split"],
  },
  viewer: {
    slug: "viewer",
    title: "PDF Viewer Online Free",
    description:
      "View and read PDF files online for free in your browser. Fast, private PDF viewer with no signup or uploads to our servers.",
    keywords: ["pdf viewer", "read pdf online", "online pdf reader"],
    h1: "Free Online PDF Viewer",
    intro:
      "Open and read PDFs instantly with PDFForge’s free online PDF viewer. Zoom, navigate pages, and review documents without installing a reader. Files are rendered locally for privacy.",
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
      "Page navigation and zoom",
      "Works on desktop and mobile",
      "Private local viewing",
    ],
    faqs: [
      {
        q: "Do I need to install software?",
        a: "No. The viewer runs in any modern web browser.",
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
      "Lock sensitive PDFs with a password before you share them. PDFForge encrypts files in your browser so credentials and document contents are not sent to our servers. Use it for contracts, HR files, and personal records.",
    howToTitle: "How to Protect a PDF",
    steps: [
      "Upload the PDF you want to lock.",
      "Set a user password and optional permissions.",
      "Encrypt the file locally.",
      "Download the protected PDF.",
    ],
    featuresTitle: "PDF Protection Features",
    features: [
      "Password encryption",
      "Permission controls where supported",
      "Local processing for privacy",
      "Free to use without an account",
    ],
    faqs: [
      {
        q: "Can I remove a password later?",
        a: "If you know the password, use the Unlock PDF tool to remove protection.",
      },
    ],
    related: ["unlock", "watermark", "sign"],
  },
  unlock: {
    slug: "unlock",
    title: "Unlock PDF Remove Password",
    description:
      "Remove PDF password protection online when you know the password. Unlock PDFs privately in your browser — free, no signup.",
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "open protected pdf"],
    h1: "Unlock a Password-Protected PDF",
    intro:
      "Remove a PDF password when you are authorized and know the credentials. PDFForge unlocks the file locally in your browser so you can edit, merge, or share it again without uploading sensitive documents.",
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
      "Sign agreements and forms without printing. Draw, type, or upload a signature image and place it on your PDF. PDFForge keeps signing local to your browser for a private, free e-sign workflow.",
    howToTitle: "How to Sign a PDF",
    steps: [
      "Upload the PDF that needs a signature.",
      "Create a signature by drawing, typing, or uploading an image.",
      "Place and resize the signature on the page.",
      "Download the signed PDF.",
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
        a: "Requirements vary by jurisdiction and document type. PDFForge provides the signing tools; consult local rules for legal validity.",
      },
    ],
    related: ["edit", "protect", "watermark"],
  },
  "extract-text": {
    slug: "extract-text",
    title: "Extract Text from PDF Free",
    description:
      "Extract text from PDF online for free. Copy content or download a formatted PDF. Private browser extraction, no signup.",
    keywords: ["extract text from pdf", "pdf to text", "copy pdf text", "pdf text extractor"],
    h1: "Extract Text from PDF Online",
    intro:
      "Pull selectable text out of PDF documents for notes, quotes, or reuse. PDFForge extracts text in your browser and can optionally generate a clean downloadable PDF from the result — without uploading your file.",
    howToTitle: "How to Extract Text from a PDF",
    steps: [
      "Upload your PDF.",
      "Extract text page by page in your browser.",
      "Copy the text or download a formatted PDF.",
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
    ],
    related: ["edit", "text-to-pdf", "viewer"],
  },
};

export function getToolSeo(slug: ToolSlug): ToolSeoContent {
  return TOOL_SEO[slug];
}
