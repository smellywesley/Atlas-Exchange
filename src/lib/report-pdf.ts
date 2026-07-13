import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ExchangePlan } from "./schema";

const PAGE = { width: 595.28, height: 841.89, margin: 42 };
const COLORS = {
  ink: rgb(0.08, 0.13, 0.13),
  muted: rgb(0.35, 0.43, 0.44),
  accent: rgb(0.08, 0.54, 0.61),
  line: rgb(0.82, 0.87, 0.87),
  warning: rgb(0.98, 0.91, 0.68)
};

type PdfContext = {
  document: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y: number;
};

export async function renderPlanPdf(plan: ExchangePlan) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const context: PdfContext = {
    document,
    page: document.addPage([PAGE.width, PAGE.height]),
    regular,
    bold,
    y: PAGE.height - PAGE.margin
  };

  drawText(context, "ATLAS EXCHANGE", { size: 9, color: COLORS.accent, font: bold });
  drawText(context, plan.partnerUniversity.name, { size: 22, color: COLORS.ink, font: bold, gapAfter: 4 });
  const dates = plan.profile.startDate && plan.profile.endDate
    ? `${plan.profile.startDate} to ${plan.profile.endDate}`
    : "Exchange dates need confirmation";
  drawText(context, `${plan.profile.destinationCity}, ${plan.profile.destinationCountry} | ${dates}`, {
    size: 9,
    color: COLORS.muted,
    gapAfter: 14
  });

  drawBox(context, "Verify live prices, availability, visa rules, and official deadlines before booking or departure.");

  section(context, "Plan overview");
  row(context, "Monthly budget", `SGD ${plan.profile.monthlyBudgetSgd.toLocaleString()}`);
  row(context, "Budget basis", plan.budget.basis.replace(/-/g, " "));
  row(context, "Housing preference", plan.profile.housingPreference);
  row(context, "Travel style", plan.profile.travelStyle);
  paragraph(context, plan.budget.notes.join(" "));

  section(context, "Accommodation");
  const topAccommodation = plan.accommodation.rankedOptions[0];
  if (topAccommodation) {
    drawText(context, topAccommodation.title, { font: bold, size: 10 });
    paragraph(context, topAccommodation.rankingReasons[0]);
    const cost = topAccommodation.estimatedMonthlyCostSgd !== undefined
      ? `SGD ${topAccommodation.estimatedMonthlyCostSgd.toLocaleString()}`
      : "Check source";
    const commute = topAccommodation.commuteMinutes !== undefined
      ? `${topAccommodation.commuteMinutes} min`
      : "Check route";
    paragraph(context, `Cost: ${cost} | Commute: ${commute}`);
    linkLine(context, topAccommodation.url);
  } else {
    paragraph(context, "No accommodation route is ready.");
  }

  section(context, "Packing priorities");
  [...plan.packing.essentials, ...plan.packing.weatherBased, ...plan.packing.documents]
    .filter((item) => item.priority === "must")
    .slice(0, 10)
    .forEach((item) => {
      drawText(context, item.label, { font: bold, size: 9 });
      paragraph(context, item.reason);
    });

  section(context, "Deadlines and checks");
  plan.deadlines.forEach((item) => {
    drawText(context, item.title, { font: bold, size: 9 });
    paragraph(context, item.dueDate ?? "Exact date needs official verification");
  });

  section(context, "Local life: 20 live searches");
  plan.localLife.places.forEach((place) => {
    drawText(context, `${place.title} | ${place.category}`, { font: bold, size: 8 });
    linkLine(context, place.mapsUrl);
  });

  section(context, "Sources");
  plan.sources.forEach((source) => {
    drawText(context, source.title, { font: bold, size: 8 });
    paragraph(context, `${source.provider} | ${source.confidence} confidence | discovery link generated ${source.fetchedAt}`);
    linkLine(context, source.url);
  });

  drawText(context, `Generated ${plan.generatedAt}. Planning guidance only; not a booking or visa guarantee.`, {
    size: 7,
    color: COLORS.muted,
    gapBefore: 10
  });

  document.setTitle(`${plan.partnerUniversity.name} exchange plan`);
  document.setAuthor("Atlas Exchange");
  return Buffer.from(await document.save());
}

function section(context: PdfContext, title: string) {
  ensureSpace(context, 34);
  context.y -= 12;
  context.page.drawLine({
    start: { x: PAGE.margin, y: context.y + 8 },
    end: { x: PAGE.width - PAGE.margin, y: context.y + 8 },
    color: COLORS.line,
    thickness: 0.8
  });
  drawText(context, title, { font: context.bold, size: 12, color: COLORS.ink, gapAfter: 6 });
}

function row(context: PdfContext, label: string, value: string) {
  ensureSpace(context, 16);
  context.page.drawText(label, { x: PAGE.margin, y: context.y, size: 8.5, font: context.regular, color: COLORS.muted });
  const valueWidth = context.bold.widthOfTextAtSize(value, 8.5);
  context.page.drawText(value, {
    x: Math.max(PAGE.margin + 180, PAGE.width - PAGE.margin - valueWidth),
    y: context.y,
    size: 8.5,
    font: context.bold,
    color: COLORS.ink
  });
  context.y -= 15;
}

function drawBox(context: PdfContext, text: string) {
  ensureSpace(context, 54);
  const lines = wrapText(text, context.regular, 9, PAGE.width - PAGE.margin * 2 - 18);
  const height = lines.length * 12 + 18;
  context.page.drawRectangle({ x: PAGE.margin, y: context.y - height + 8, width: PAGE.width - PAGE.margin * 2, height, color: COLORS.warning });
  context.y -= 5;
  lines.forEach((line) => drawText(context, line, { size: 9, gapAfter: 1, indent: 9 }));
  context.y -= 8;
}

function paragraph(context: PdfContext, text: string) {
  drawText(context, text, { size: 8.5, color: COLORS.muted, gapAfter: 5 });
}

function linkLine(context: PdfContext, url: string) {
  const size = 7.5;
  const label = `Open ${safeHostname(url)}`;
  ensureSpace(context, 16);
  context.page.drawText(label, {
    x: PAGE.margin,
    y: context.y,
    size,
    font: context.regular,
    color: COLORS.accent
  });
  const width = context.regular.widthOfTextAtSize(label, size);
  const annotation = context.document.context.register(context.document.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: [PAGE.margin, context.y - 2, PAGE.margin + width, context.y + size + 2],
    Border: [0, 0, 0],
    A: {
      Type: PDFName.of("Action"),
      S: PDFName.of("URI"),
      URI: PDFString.of(url)
    }
  }));
  context.page.node.addAnnot(annotation);
  context.y -= 16;
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function drawText(
  context: PdfContext,
  text: string,
  options: {
    size?: number;
    color?: ReturnType<typeof rgb>;
    font?: PDFFont;
    gapBefore?: number;
    gapAfter?: number;
    indent?: number;
  } = {}
) {
  const size = options.size ?? 9;
  const font = options.font ?? context.regular;
  const maxWidth = PAGE.width - PAGE.margin * 2 - (options.indent ?? 0);
  const lines = wrapText(text, font, size, maxWidth);
  const lineHeight = size * 1.35;
  ensureSpace(context, lines.length * lineHeight + (options.gapBefore ?? 0) + (options.gapAfter ?? 0));
  context.y -= options.gapBefore ?? 0;
  lines.forEach((line) => {
    context.page.drawText(line, {
      x: PAGE.margin + (options.indent ?? 0),
      y: context.y,
      size,
      font,
      color: options.color ?? COLORS.ink
    });
    context.y -= lineHeight;
  });
  context.y -= options.gapAfter ?? 0;
}

function ensureSpace(context: PdfContext, required: number) {
  if (context.y - required >= PAGE.margin) {
    return;
  }
  context.page = context.document.addPage([PAGE.width, PAGE.height]);
  context.y = PAGE.height - PAGE.margin;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
    }
    line = word;
  }
  if (line) {
    lines.push(line);
  }
  return lines.length > 0 ? lines : [""];
}
