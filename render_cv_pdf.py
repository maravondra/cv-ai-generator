import argparse
import os
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    HRFlowable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)

# ---------------------------------------------------------------------------
# Barevná paleta ("Professional & Premium Look")
# ---------------------------------------------------------------------------
PRIMARY = colors.HexColor("#0F172A")     # námořnická modrá / slate pro nadpisy
SECONDARY = colors.HexColor("#0D9488")   # teal akcent pro odkazy, odrážky, linky
TEXT = colors.HexColor("#334155")        # tmavě břidlicová místo černé
MUTED = colors.HexColor("#64748B")       # tlumená šedá pro data/lokace
FAINT = colors.HexColor("#94A3B8")       # nejjemnější šedá (patička)
SIDEBAR_BG = colors.HexColor("#F1F5F9")  # ledově šedé pozadí postranního panelu
DIVIDER = colors.HexColor("#E2E8F0")     # jemná dělicí linka mezi sloupci

SECONDARY_HEX = "#0D9488"
MUTED_HEX = "#64748B"

PAGE_SIZE = A4
MARGIN_L, MARGIN_R, MARGIN_T, MARGIN_B = 40, 40, 32, 42


def register_project_fonts():
    """Načte lokální Roboto fonty z projektu (regular/bold/italic/bold-italic)
    a zaregistruje je jako fontovou rodinu, aby <b>/<i> tagy v Paragraph
    fungovaly automaticky. Při absenci Roboto fontů zkusí systémové náhrady
    (Arial, DejaVuSans) a nakonec spadne na vestavěný Helvetica."""
    base_dir = Path(__file__).resolve().parent / "font" / "static"
    candidates = [
        {
            "regular": base_dir / "Roboto-Regular.ttf",
            "bold": base_dir / "Roboto-Bold.ttf",
            "italic": base_dir / "Roboto-Italic.ttf",
            "boldItalic": base_dir / "Roboto-BoldItalic.ttf",
        },
        {
            "regular": Path("C:/Windows/Fonts/arial.ttf"),
            "bold": Path("C:/Windows/Fonts/arialbd.ttf"),
            "italic": Path("C:/Windows/Fonts/ariali.ttf"),
            "boldItalic": Path("C:/Windows/Fonts/arialbi.ttf"),
        },
        {
            "regular": Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            "bold": Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
            "italic": Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf"),
            "boldItalic": Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf"),
        },
    ]

    for variant in candidates:
        if not variant["regular"].exists():
            continue

        pdfmetrics.registerFont(TTFont("Roboto", str(variant["regular"])))
        bold_name = italic_name = bold_italic_name = "Roboto"

        if variant["bold"].exists():
            pdfmetrics.registerFont(TTFont("Roboto-Bold", str(variant["bold"])))
            bold_name = "Roboto-Bold"
        if variant["italic"].exists():
            pdfmetrics.registerFont(TTFont("Roboto-Italic", str(variant["italic"])))
            italic_name = "Roboto-Italic"
        if variant["boldItalic"].exists():
            pdfmetrics.registerFont(TTFont("Roboto-BoldItalic", str(variant["boldItalic"])))
            bold_italic_name = "Roboto-BoldItalic"

        pdfmetrics.registerFontFamily(
            "Roboto",
            normal="Roboto",
            bold=bold_name,
            italic=italic_name,
            boldItalic=bold_italic_name,
        )
        print(f"Používám font: {variant['regular']}")
        return "Roboto"

    return "Helvetica"


FONT_NAME = register_project_fonts()


# ---------------------------------------------------------------------------
# Markdown → ReportLab (inline) parsing
# ---------------------------------------------------------------------------
def _escape(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def inline_markdown_to_html(text):
    """Převede základní inline Markdown (**bold**, *italic*, [text](url)) na
    HTML-like značky, kterým rozumí ReportLab Paragraph (<b>, <i>, <link>).
    Datum/lokace psané kurzívou automaticky obarví tlumenou barvou."""
    text = _escape(text.strip())

    text = re.sub(r"\[(.+?)\]\((.+?)\)", rf'<link href="\2"><font color="{SECONDARY_HEX}">\1</font></link>', text)

    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"<b><i>\1</i></b>", text)
    text = re.sub(r"___(.+?)___", r"<b><i>\1</i></b>", text)

    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"__(.+?)__", r"<b>\1</b>", text)

    text = re.sub(r"\*(.+?)\*", rf'<i><font color="{MUTED_HEX}">\1</font></i>', text)
    text = re.sub(r"(?<!\w)_(.+?)_(?!\w)", rf'<i><font color="{MUTED_HEX}">\1</font></i>', text)

    # Zvýrazni popisky typu "**Email:**" (po konverzi <b>Email:</b>) sekundární barvou.
    text = re.sub(
        r"<b>([^<:]{1,40}):</b>",
        rf'<b><font color="{SECONDARY_HEX}">\1:</font></b>',
        text,
    )
    return text


ROLE_DATE_RE = re.compile(r"^\*\*(.+?)\*\*\s*\*\((.+?)\)\*$")
PRIMARY_HEX = "#0F172A"


def role_date_to_html(role_raw, date_raw):
    return (
        f'<b><font color="{PRIMARY_HEX}">{_escape(role_raw)}</font></b>'
        f'  <font color="{MUTED_HEX}"><i>· {_escape(date_raw)}</i></font>'
    )


# ---------------------------------------------------------------------------
# Markdown → strukturované bloky
# ---------------------------------------------------------------------------
class Section:
    def __init__(self, title):
        self.title = title
        self.blocks = []  # list of tuples: ("subheading", txt) / ("paragraph", txt) / ("bullet", txt, level) / ("blank",)


def parse_markdown(md_text):
    lines = md_text.splitlines()
    name = ""
    header_lines = []
    sections = []
    current = None
    in_header = True

    for raw_line in lines:
        stripped = raw_line.strip()

        if in_header:
            if stripped.startswith("## "):
                in_header = False
            elif stripped.startswith("# "):
                name = stripped[2:].strip()
                continue
            elif stripped == "---" or not stripped:
                continue
            else:
                header_lines.append(stripped)
                continue

        if stripped.startswith("## "):
            current = Section(stripped[3:].strip())
            sections.append(current)
            continue

        if current is None:
            continue

        if not stripped:
            current.blocks.append(("blank",))
            continue

        if stripped == "---":
            continue

        if stripped.startswith("### "):
            current.blocks.append(("subheading", stripped[4:].strip()))
            continue

        if stripped.startswith("- ") or stripped.startswith("* "):
            indent = len(raw_line) - len(raw_line.lstrip(" "))
            level = min(indent // 2, 1)
            current.blocks.append(("bullet", stripped[2:].strip(), level))
            continue

        current.blocks.append(("paragraph", stripped))

    return name, header_lines, sections


# ---------------------------------------------------------------------------
# Rozřazení sekcí do sloupců
# ---------------------------------------------------------------------------
FULL_WIDTH_KEYWORDS = ["profil", "profile", "summary", "shrnutí", "shrnuti", "o mně", "o mne"]
SIDEBAR_KEYWORDS = [
    "jazyk", "language", "certifikace", "certification",
    "vzdělání", "vzdelani", "education", "kontakt", "contact",
]


def classify_section(title):
    t = title.lower()
    if any(k in t for k in FULL_WIDTH_KEYWORDS):
        return "full"
    if any(k in t for k in SIDEBAR_KEYWORDS):
        return "sidebar"
    return "main"


# ---------------------------------------------------------------------------
# Styly
# ---------------------------------------------------------------------------
def build_styles():
    base = getSampleStyleSheet()
    s = {}

    s["name"] = ParagraphStyle(
        "CVName", parent=base["Title"], fontName=FONT_NAME, fontSize=25, leading=28,
        textColor=PRIMARY, alignment=0, spaceAfter=4,
    )
    s["subtitle"] = ParagraphStyle(
        "CVSubtitle", fontName=FONT_NAME, fontSize=13, leading=16,
        textColor=SECONDARY, spaceAfter=8,
    )
    s["contact"] = ParagraphStyle(
        "CVContact", fontName=FONT_NAME, fontSize=9, leading=13,
        textColor=MUTED, spaceAfter=1,
    )
    s["section"] = ParagraphStyle(
        "CVSection", fontName=FONT_NAME, fontSize=11.5, leading=14,
        textColor=PRIMARY, spaceBefore=14, spaceAfter=2,
    )
    s["profile_intro"] = ParagraphStyle(
        "CVProfileIntro", fontName=FONT_NAME, fontSize=9.7, leading=14.5,
        textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=6,
    )
    s["subheading"] = ParagraphStyle(
        "CVSubheading", fontName=FONT_NAME, fontSize=10.5, leading=13,
        textColor=PRIMARY, spaceBefore=9, spaceAfter=1,
    )
    s["role"] = ParagraphStyle(
        "CVRole", fontName=FONT_NAME, fontSize=9.5, leading=12.5,
        textColor=TEXT, spaceBefore=0, spaceAfter=4,
    )

    s["body"] = ParagraphStyle(
        "CVBody", fontName=FONT_NAME, fontSize=9.3, leading=13,
        textColor=TEXT, spaceAfter=5,
    )
    s["bullet0"] = ParagraphStyle(
        "CVBullet0", parent=s["body"], leftIndent=14, bulletIndent=1,
        bulletFontSize=9, spaceAfter=3,
    )
    s["bullet0"].bulletColor = SECONDARY
    s["bullet1"] = ParagraphStyle(
        "CVBullet1", parent=s["body"], fontSize=8.8, leading=12.2,
        leftIndent=27, bulletIndent=15, bulletFontSize=8.3, spaceAfter=3,
    )
    s["bullet1"].bulletColor = MUTED

    s["body_sb"] = ParagraphStyle(
        "CVBodySidebar", fontName=FONT_NAME, fontSize=8.5, leading=12,
        textColor=TEXT, spaceAfter=4,
    )
    s["bullet0_sb"] = ParagraphStyle(
        "CVBullet0Sidebar", parent=s["body_sb"], leftIndent=11, bulletIndent=0,
        bulletFontSize=8.2, spaceAfter=3,
    )
    s["bullet0_sb"].bulletColor = SECONDARY
    s["bullet1_sb"] = ParagraphStyle(
        "CVBullet1Sidebar", parent=s["body_sb"], fontSize=8.1, leading=11.3,
        leftIndent=20, bulletIndent=11, bulletFontSize=7.8, spaceAfter=3,
    )
    s["bullet1_sb"].bulletColor = MUTED

    return s


# ---------------------------------------------------------------------------
# Sestavení flowables pro jednu sekci
# ---------------------------------------------------------------------------
def build_section_flowables(section, styles, sidebar=False, intro=False):
    if intro:
        body_style = styles["profile_intro"]
    elif sidebar:
        body_style = styles["body_sb"]
    else:
        body_style = styles["body"]
    bullet_styles = (styles["bullet0_sb"], styles["bullet1_sb"]) if sidebar else (styles["bullet0"], styles["bullet1"])

    flow = [
        Paragraph(section.title.upper(), styles["section"]),
        HRFlowable(width="100%", thickness=0.6, color=SECONDARY, spaceBefore=2, spaceAfter=7,
                   hAlign="LEFT", lineCap="round"),
    ]

    pending_space = False
    for block in section.blocks:
        kind = block[0]

        if kind == "blank":
            pending_space = True
            continue

        if pending_space:
            flow.append(Spacer(1, 4))
            pending_space = False

        if kind == "subheading":
            flow.append(Paragraph(inline_markdown_to_html(block[1]), styles["subheading"]))
            continue

        if kind == "paragraph":
            text = block[1]
            role_match = ROLE_DATE_RE.match(text)
            if role_match:
                flow.append(Paragraph(role_date_to_html(*role_match.groups()), styles["role"]))
            else:
                flow.append(Paragraph(inline_markdown_to_html(text), body_style))
            continue

        if kind == "bullet":
            _, text, level = block
            style = bullet_styles[min(level, len(bullet_styles) - 1)]
            bullet_char = "•" if level == 0 else "–"
            flow.append(Paragraph(inline_markdown_to_html(text), style, bulletText=bullet_char))
            continue

    flow.append(Spacer(1, 10))
    return flow


def measure_height(flowables, width):
    """Spočítá celkovou výšku, kterou by sada flowables zabrala v jednom
    rámci dané šířky. ReportLab (Frame._add) po vykreslení KAŽDÉHO flowable
    ihned odečte jeho spaceAfter a teprve mezeru před DALŠÍM prvkem "srazí"
    o už odečtené spaceAfter (max(spaceBefore - předchozí spaceAfter, 0)) –
    spaceAfter se tedy nikdy nezahodí, jen se s ním sníží následující mezera.
    Prostý součet wrap() výšek by proto výšku systematicky podhodnotil."""
    total = 0.0
    prev_after = 0.0
    for i, f in enumerate(flowables):
        gap = max(f.getSpaceBefore() - prev_after, 0.0) if i else 0.0
        _, h = f.wrap(width, 0xFFFFFF)
        sa = f.getSpaceAfter()
        total += gap + h + sa
        prev_after = sa
    return total


def paginate(flowables, width, page_heights):
    """Rozdělí flowables do 'stránek' tak, aby se každá vešla do odpovídající
    výšky z `page_heights` (poslední hodnota se opakuje pro další stránky).
    Napodobuje výpočet mezer, který ReportLab reálně provádí ve Frame (viz
    measure_height výše), takže takto vzniklé dávky lze bezpečně vložit do
    předem připravených rámců bez spoléhání na automatické (a přes sloupce
    nespolehlivé) přetékání rámců."""
    if not flowables:
        return [[]]

    def height_for(idx):
        return page_heights[idx] if idx < len(page_heights) else page_heights[-1]

    pages, current = [], []
    y_used = 0.0
    prev_after = 0.0
    page_idx = 0
    cur_max = height_for(0)

    for f in flowables:
        _, h = f.wrap(width, 0xFFFFFF)
        sa = f.getSpaceAfter()
        gap = max(f.getSpaceBefore() - prev_after, 0.0) if current else 0.0
        needed = gap + h + sa
        if current and (y_used + needed > cur_max):
            pages.append(current)
            page_idx += 1
            cur_max = height_for(page_idx)
            current, y_used = [], 0.0
            needed = h + sa
        current.append(f)
        y_used += needed
        prev_after = sa

    pages.append(current)
    return pages


# ---------------------------------------------------------------------------
# Číslované PDF (patička "Strana X z Y")
# ---------------------------------------------------------------------------
class NumberedCanvas(pdfcanvas.Canvas):
    def __init__(self, *args, **kwargs):
        pdfcanvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(total_pages)
            pdfcanvas.Canvas.showPage(self)
        pdfcanvas.Canvas.save(self)

    def _draw_footer(self, total_pages):
        page_w, _ = PAGE_SIZE
        self.saveState()
        self.setFont(FONT_NAME, 6.5)
        self.setFillColor(FAINT)
        self.drawRightString(page_w - MARGIN_R, PAGE_SIZE[1] - 20, "Generováno AI agentem, kterého vyvinul Marek Vondra")

        self.setStrokeColor(DIVIDER)
        self.setLineWidth(0.5)
        self.line(MARGIN_L, 30, page_w - MARGIN_R, 30)

        self.setFont(FONT_NAME, 8)
        self.setFillColor(MUTED)
        self.drawCentredString(page_w / 2, 18, f"Strana {self._pageNumber} z {total_pages}")
        self.restoreState()


# ---------------------------------------------------------------------------
# Hlavní vykreslovací funkce
# ---------------------------------------------------------------------------
def render_md_to_pdf(md_filepath, output_pdf_filepath=None):
    if not os.path.exists(md_filepath):
        print(f"❌ Soubor nenalezen: {md_filepath}")
        return

    if not output_pdf_filepath:
        output_pdf_filepath = os.path.splitext(md_filepath)[0] + ".pdf"

    print(f"📖 Načítám Markdown z: {md_filepath}")
    with open(md_filepath, "r", encoding="utf-8") as f:
        md_text = f.read()

    name, header_lines, sections = parse_markdown(md_text)
    styles = build_styles()

    # --- Záhlaví (jméno, pozice, kontakt) ---
    header_flow = []
    if name:
        header_flow.append(Paragraph(inline_markdown_to_html(name), styles["name"]))
    for i, line in enumerate(header_lines):
        style = styles["subtitle"] if i == 0 else styles["contact"]
        header_flow.append(Paragraph(inline_markdown_to_html(line), style))
    header_flow.append(HRFlowable(width="100%", thickness=1.2, color=PRIMARY, spaceBefore=10, spaceAfter=14))

    # --- Rozřazení sekcí: plná šířka (profil) / postranní panel / hlavní panel ---
    intro_flow, sidebar_flow, main_flow = [], [], []
    for section in sections:
        column = classify_section(section.title)
        if column == "full":
            intro_flow.extend(build_section_flowables(section, styles, intro=True))
        elif column == "sidebar":
            sidebar_flow.extend(build_section_flowables(section, styles, sidebar=True))
        else:
            main_flow.extend(build_section_flowables(section, styles, sidebar=False))

    page_w, page_h = PAGE_SIZE
    content_w = page_w - MARGIN_L - MARGIN_R
    content_h = page_h - MARGIN_T - MARGIN_B
    SAFETY = 8  # rezerva proti zaokrouhlovacím rozdílům oproti reportlab Frame

    top_flow = list(header_flow) + list(intro_flow)
    top_h = min(measure_height(top_flow, content_w), content_h - 100)
    page1_body_h = content_h - top_h - SAFETY
    rest_body_h = content_h - SAFETY

    sidebar_gutter = 18
    sidebar_w = content_w * 0.34
    main_w = content_w - sidebar_w
    sidebar_text_w = sidebar_w - 14 - sidebar_gutter
    main_text_w = main_w - sidebar_gutter

    # Vlastní odsazení rámců – MUSÍ být zohledněno i při ručním stránkování
    # níže (paginate počítá dostupnou výšku pro OBSAH, ne celou výšku rámce).
    SB_TOP, SB_BOTTOM = 14, 10
    MAIN_TOP, MAIN_BOTTOM = 6, 4

    use_two_columns = bool(sidebar_flow) and bool(main_flow)

    doc = BaseDocTemplate(
        output_pdf_filepath,
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
    )

    top_frame = Frame(MARGIN_L, page_h - MARGIN_T - top_h, content_w, top_h,
                       leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="top")

    story = list(top_flow)

    # Ruční stránkování postranního panelu a hlavního obsahu: každá dávka je
    # předem spočtená tak, aby se vešla do svého rámce. Díky tomu se dva
    # nezávisle dlouhé sloupce nikdy nesmíchají přes automatické "přetečení"
    # rámců (ReportLab by jinak přebytek jednoho sloupce nalil do druhého).
    if use_two_columns:
        sidebar_frame_p1 = Frame(MARGIN_L, MARGIN_B, sidebar_w, page1_body_h,
                                  leftPadding=14, rightPadding=sidebar_gutter,
                                  topPadding=SB_TOP, bottomPadding=SB_BOTTOM, id="sidebar1")
        main_frame_p1 = Frame(MARGIN_L + sidebar_w, MARGIN_B, main_w, page1_body_h,
                               leftPadding=sidebar_gutter, rightPadding=0,
                               topPadding=MAIN_TOP, bottomPadding=MAIN_BOTTOM, id="main1")
        sidebar_frame_rest = Frame(MARGIN_L, MARGIN_B, sidebar_w, rest_body_h,
                                    leftPadding=14, rightPadding=sidebar_gutter,
                                    topPadding=SB_TOP, bottomPadding=SB_BOTTOM, id="sidebar2")
        main_frame_rest = Frame(MARGIN_L + sidebar_w, MARGIN_B, main_w, rest_body_h,
                                 leftPadding=sidebar_gutter, rightPadding=0,
                                 topPadding=MAIN_TOP, bottomPadding=MAIN_BOTTOM, id="main2")

        sb_avail = [page1_body_h - SB_TOP - SB_BOTTOM, rest_body_h - SB_TOP - SB_BOTTOM]
        main_avail = [page1_body_h - MAIN_TOP - MAIN_BOTTOM, rest_body_h - MAIN_TOP - MAIN_BOTTOM]
        sidebar_pages = paginate(sidebar_flow, sidebar_text_w, sb_avail)
        main_pages = paginate(main_flow, main_text_w, main_avail)
        total_pages = max(len(sidebar_pages), len(main_pages))
        n_sidebar_pages = len(sidebar_pages)

        def draw_sidebar_bg(sidebar_h):
            def _draw(canvas_obj, doc_obj):
                # Jakmile postranní panel na dřívější stránce skončí, na
                # dalších stránkách už podbarvení nekreslíme (byl by to
                # prázdný obdélník bez obsahu).
                if canvas_obj.getPageNumber() > n_sidebar_pages:
                    return
                canvas_obj.saveState()
                canvas_obj.setFillColor(SIDEBAR_BG)
                canvas_obj.rect(MARGIN_L, MARGIN_B, sidebar_w, sidebar_h, stroke=0, fill=1)
                canvas_obj.setStrokeColor(DIVIDER)
                canvas_obj.setLineWidth(0.6)
                canvas_obj.line(MARGIN_L + sidebar_w, MARGIN_B, MARGIN_L + sidebar_w, MARGIN_B + sidebar_h)
                canvas_obj.restoreState()
            return _draw

        doc.addPageTemplates([
            PageTemplate(id="First", frames=[top_frame, sidebar_frame_p1, main_frame_p1],
                         onPage=draw_sidebar_bg(page1_body_h)),
            PageTemplate(id="Cont", frames=[sidebar_frame_rest, main_frame_rest],
                         onPage=draw_sidebar_bg(rest_body_h)),
        ])

        story.append(FrameBreak())
        story.extend(sidebar_pages[0])
        story.append(FrameBreak())
        story.extend(main_pages[0])

        for i in range(1, total_pages):
            story.append(NextPageTemplate("Cont"))
            story.append(PageBreak())
            if i < len(sidebar_pages):
                story.extend(sidebar_pages[i])
            story.append(FrameBreak())
            if i < len(main_pages):
                story.extend(main_pages[i])
    else:
        # Robustní záložní režim (např. Markdown bez rozpoznatelných sidebar sekcí):
        # vykreslí vše jednosloupcově, aby skript nikdy nespadl na neobvyklé struktuře.
        full_frame_p1 = Frame(MARGIN_L, MARGIN_B, content_w, page1_body_h,
                               leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="full1")
        full_frame_rest = Frame(MARGIN_L, MARGIN_B, content_w, rest_body_h,
                                 leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="full2")
        doc.addPageTemplates([
            PageTemplate(id="First", frames=[top_frame, full_frame_p1]),
            PageTemplate(id="Cont", frames=[full_frame_rest]),
        ])

        all_flow = list(sidebar_flow) + list(main_flow)
        pages = paginate(all_flow, content_w, [page1_body_h, rest_body_h])

        story.append(FrameBreak())
        story.extend(pages[0])
        for i in range(1, len(pages)):
            story.append(NextPageTemplate("Cont"))
            story.append(PageBreak())
            story.extend(pages[i])

    print("🎨 Generuji moderní dvousloupcové PDF s českou diakritikou...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✨ PDF úspěšně vytvořeno: {output_pdf_filepath}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Převodník Markdown CV na PDF.")
    parser.add_argument("md_file", type=str, help="Cesta k .md souboru s CV")
    parser.add_argument("--output", "-o", type=str, default=None, help="Volitelný název výstupního PDF")
    args = parser.parse_args()
    render_md_to_pdf(args.md_file, args.output)
