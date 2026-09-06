import argparse
import os
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import ListFlowable, Paragraph, SimpleDocTemplate, Spacer


def register_project_fonts():
    """Načte lokální Roboto fonty z projektu, které obsahují české znaky."""
    base_dir = Path(__file__).resolve().parent / "font" / "static"
    font_map = {
        "Roboto": base_dir / "Roboto-Regular.ttf",
        "Roboto-Bold": base_dir / "Roboto-Bold.ttf",
        "Roboto-Italic": base_dir / "Roboto-Italic.ttf",
        "Roboto-BoldItalic": base_dir / "Roboto-BoldItalic.ttf",
    }

    for family_name, font_path in font_map.items():
        if font_path.exists():
            pdfmetrics.registerFont(TTFont(family_name, str(font_path)))
            print(f"Používám font: {font_path}")

    if all((base_dir / name).exists() for name in ["Roboto-Regular.ttf", "Roboto-Bold.ttf"]):
        return "Roboto"

    for font_path in [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]:
        if font_path.exists():
            pdfmetrics.registerFont(TTFont("Roboto", str(font_path)))
            return "Roboto"

    return "Helvetica"


FONT_NAME = register_project_fonts()


def clean_text(text):
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    return text.strip()


def add_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#718096"))
    canvas.setFont(FONT_NAME, 7.5)
    canvas.drawRightString(555, 790, "Generováno AI agentem, kterého vyvinul Marek Vondra")

    canvas.setFillColor(colors.HexColor("#a0aec0"))
    canvas.setFont(FONT_NAME, 8)
    canvas.drawCentredString(297, 20, f"Strana {canvas.getPageNumber()}")
    canvas.restoreState()


def render_md_to_pdf(md_filepath, output_pdf_filepath=None):
    if not os.path.exists(md_filepath):
        print(f"❌ Soubor nenalezen: {md_filepath}")
        return

    if not output_pdf_filepath:
        output_pdf_filepath = os.path.splitext(md_filepath)[0] + ".pdf"

    print(f"📖 Načítám Markdown z: {md_filepath}")
    with open(md_filepath, "r", encoding="utf-8") as f:
        md_text = f.read()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CVTitle",
        parent=styles["Title"],
        fontName=FONT_NAME,
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1a365d"),
        alignment=1,
        spaceAfter=6,
    )
    section_style = ParagraphStyle(
        "CVSection",
        parent=styles["Heading2"],
        fontName=FONT_NAME,
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1a365d"),
        spaceBefore=14,
        spaceAfter=6,
        borderPadding=0,
    )
    subheading_style = ParagraphStyle(
        "CVSubheading",
        parent=styles["Heading3"],
        fontName=FONT_NAME,
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#2b6cb0"),
        spaceBefore=10,
        spaceAfter=3,
    )
    normal_style = ParagraphStyle(
        "CVNormal",
        parent=styles["BodyText"],
        fontName=FONT_NAME,
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#2d3748"),
        spaceAfter=5,
    )
    bullet_style = ParagraphStyle(
        "CVBullet",
        parent=normal_style,
        leftIndent=18,
        bulletIndent=8,
        spaceAfter=3,
    )

    story = []
    bullet_items = []

    def flush_bullets():
        if bullet_items:
            story.append(
                ListFlowable(
                    [Paragraph(clean_text(item), bullet_style) for item in bullet_items],
                    bulletType="bullet",
                    leftIndent=12,
                    bulletText="•",
                )
            )
            story.append(Spacer(1, 6))
            bullet_items.clear()

    for raw_line in md_text.splitlines():
        line = raw_line.strip()
        if not line:
            flush_bullets()
            story.append(Spacer(1, 4))
            continue

        if line.startswith("# "):
            flush_bullets()
            story.append(Paragraph(clean_text(line[2:]), title_style))
            continue

        if line.startswith("## "):
            flush_bullets()
            story.append(Paragraph(clean_text(line[3:]).upper(), section_style))
            continue

        if line.startswith("### "):
            flush_bullets()
            story.append(Paragraph(clean_text(line[4:]), subheading_style))
            continue

        if line.startswith("- ") or line.startswith("* "):
            bullet_items.append(line[2:].strip())
            continue

        flush_bullets()
        story.append(Paragraph(clean_text(line), normal_style))

    flush_bullets()

    doc = SimpleDocTemplate(
        output_pdf_filepath,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=35,
        bottomMargin=35,
    )

    print(f"🎨 Generuji PDF s původním designem a českými znaky...")
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"✨ PDF úspěšně vytvořeno: {output_pdf_filepath}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Převodník Markdown CV na PDF.")
    parser.add_argument("md_file", type=str, help="Cesta k .md souboru s CV")
    parser.add_argument("--output", "-o", type=str, default=None, help="Volitelný název výstupního PDF")
    args = parser.parse_args()
    render_md_to_pdf(args.md_file, args.output)
