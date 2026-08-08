import { PageSizes } from "pdf-lib";

export type PdfColor = [number, number, number];
export type PdfThemeName = keyof typeof THEMES;

export type PdfThemeDefinition = {
  pageSize: [number, number];
  margin: { top: number; right: number; bottom: number; left: number };
  colors: {
    text: PdfColor;
    heading: PdfColor;
    subheading: PdfColor;
    accent: PdfColor;
    muted: PdfColor;
    background: PdfColor;
    line: PdfColor;
    codeBackground: PdfColor;
  };
  sizes: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    body: number;
    small: number;
    code: number;
  };
  spacing: {
    paragraph: number;
    heading: number;
    line: number;
    listIndent: number;
  };
};

export const DEFAULT_THEME: PdfThemeDefinition = {
  pageSize: PageSizes.A4,
  margin: { top: 72, right: 72, bottom: 72, left: 72 },
  colors: {
    text: [0.15, 0.15, 0.17],
    heading: [0.08, 0.1, 0.2],
    subheading: [0.24, 0.26, 0.36],
    accent: [0.29, 0.36, 0.87],
    muted: [0.5, 0.5, 0.56],
    background: [1, 1, 1],
    line: [0.9, 0.9, 0.93],
    codeBackground: [0.965, 0.965, 0.985],
  },
  sizes: {
    h1: 28,
    h2: 22,
    h3: 17,
    h4: 14,
    body: 11,
    small: 9,
    code: 9.5,
  },
  spacing: {
    paragraph: 8,
    heading: 16,
    line: 1.5,
    listIndent: 22,
  },
};

function withColors(
  colors: Partial<PdfThemeDefinition["colors"]>
): PdfThemeDefinition {
  return {
    ...DEFAULT_THEME,
    margin: { ...DEFAULT_THEME.margin },
    sizes: { ...DEFAULT_THEME.sizes },
    spacing: { ...DEFAULT_THEME.spacing },
    colors: { ...DEFAULT_THEME.colors, ...colors },
  };
}

export const THEMES = {
  modern: withColors({}),
  professional: withColors({
    heading: [0.07, 0.16, 0.31],
    subheading: [0.16, 0.28, 0.43],
    accent: [0.08, 0.39, 0.67],
  }),
  minimal: withColors({
    text: [0.1, 0.1, 0.1],
    heading: [0, 0, 0],
    subheading: [0.2, 0.2, 0.2],
    accent: [0.3, 0.3, 0.3],
  }),
  colorful: withColors({
    heading: [0.48, 0.16, 0.55],
    subheading: [0.55, 0.22, 0.47],
    accent: [0.88, 0.25, 0.48],
  }),
} satisfies Record<string, PdfThemeDefinition>;

export const THEME_OPTIONS: { value: PdfThemeName; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "professional", label: "Professional" },
  { value: "minimal", label: "Minimal" },
  { value: "colorful", label: "Colorful" },
];

