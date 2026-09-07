import argparse
import os

from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer

from render_cv_pdf import (
    FONT_NAME,
    MARGIN_B,
    MARGIN_L,
    MARGIN_R,
    MARGIN_T,
    NumberedCanvas,
    PAGE_SIZE,
    TEXT,
    detect_language,
    inline_markdown_to_html,
)


def split_blocks(md_text):
    """Rozdělí Markdown na bloky (odstavce) oddělené prázdným řádkem;
    v rámci bloku se zachovávají jednotlivé řádky (pro podpis s více řádky)."""
    blocks, current = [], []
    for line in md_text.splitlines():
        if line.strip() == "":
            if current:
                blocks.append(current)
                current = []
        else:
            current.append(line)
    if current:
        blocks.append(current)
    return blocks


def build_styles():
    return {
        "body": ParagraphStyle(
            "LetterBody",
            fontName=FONT_NAME,
            fontSize=10.5,
            leading=16,
            textColor=TEXT,
            alignment=TA_JUSTIFY,
            spaceAfter=12,
        ),
        "signature": ParagraphStyle(
            "LetterSignature",
            fontName=FONT_NAME,
            fontSize=10,
            leading=15,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceAfter=12,
        ),
    }


def render_letter_to_pdf(md_filepath, output_pdf_filepath=None):
    if not os.path.exists(md_filepath):
        print(f"❌ Soubor nenalezen: {md_filepath}")
        return

    if not output_pdf_filepath:
        output_pdf_filepath = os.path.splitext(md_filepath)[0] + ".pdf"

    print(f"📖 Načítám Markdown z: {md_filepath}")
    with open(md_filepath, "r", encoding="utf-8") as f:
        md_text = f.read()

    lang = detect_language(md_text)
    print(f"🌐 Rozpoznaný jazyk dopisu: {lang}")

    styles = build_styles()
    blocks = split_blocks(md_text)

    story = []
    for lines in blocks:
        stripped_lines = [ln.strip() for ln in lines]

        if len(stripped_lines) == 1 and stripped_lines[0] == "---":
            continue
        if stripped_lines[0].startswith("🤖"):
            # AI disclaimer je vykreslován samostatně v patičce (viz NumberedCanvas)
            continue

        html_lines = [inline_markdown_to_html(ln) for ln in lines]
        is_signature_block = len(html_lines) > 1
        html = "<br/>".join(html_lines)
        style = styles["signature"] if is_signature_block else styles["body"]
        story.append(Paragraph(html, style))

    page_w, page_h = PAGE_SIZE
    content_w = page_w - MARGIN_L - MARGIN_R
    content_h = page_h - MARGIN_T - MARGIN_B

    doc = BaseDocTemplate(
        output_pdf_filepath,
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
    )
    frame = Frame(MARGIN_L, MARGIN_B, content_w, content_h, id="letter")
    doc.addPageTemplates([PageTemplate(id="Letter", frames=[frame])])

    print("🎨 Generuji PDF motivačního dopisu...")
    doc.build(story, canvasmaker=lambda *a, **kw: NumberedCanvas(*a, cv_lang=lang, **kw))
    print(f"✨ PDF úspěšně vytvořeno: {output_pdf_filepath}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Převodník Markdown motivačního dopisu na PDF.")
    parser.add_argument("md_file", type=str, help="Cesta k .md souboru s motivačním dopisem")
    parser.add_argument("--output", "-o", type=str, default=None, help="Volitelný název výstupního PDF")
    args = parser.parse_args()
    render_letter_to_pdf(args.md_file, args.output)
