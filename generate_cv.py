import os
import glob
import argparse
import textwrap
from pathlib import Path

from dotenv import load_dotenv
import markdown
from google import genai
from google.genai import types
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


# 1. Načtení .env souboru
load_dotenv()

# 2. Kontrola a příprava API klíče
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ CHYBA: Proměnná GEMINI_API_KEY nebyla v .env souboru nalezena!")

# 3. Nastavení proxy prostředí pro HTTP požadavky
http_proxy = os.getenv("HTTP_PROXY") or os.getenv("http_proxy")
if http_proxy:
    os.environ["HTTP_PROXY"] = http_proxy
    os.environ["HTTPS_PROXY"] = os.getenv("HTTPS_PROXY") or http_proxy

# 4. Inicializace klienta
client = genai.Client(api_key=api_key)

# CSS styl s explicitní registrací fontu Arial pro českou diakritiku v xhtml2pdf
CV_CSS_STYLE = """
@page {
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
}

body {
    font-family: 'Roboto', sans-serif;
    color: #2c3e50;
    line-height: 1.4;
    font-size: 10pt;
}

h1 {
    color: #1a365d;
    font-size: 20pt;
    border-bottom: 2px solid #2b6cb0;
    padding-bottom: 4px;
    margin-bottom: 6px;
    margin-top: 0;
}

h2 {
    color: #2b6cb0;
    font-size: 13pt;
    margin-top: 14px;
    margin-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
    text-transform: uppercase;
}

h3 {
    color: #2d3748;
    font-size: 11pt;
    margin-top: 8px;
    margin-bottom: 4px;
}

p, li {
    font-size: 9.5pt;
    color: #4a5568;
}

ul {
    margin-top: 3px;
    margin-bottom: 8px;
    padding-left: 18px;
}

li {
    margin-bottom: 2px;
}

strong {
    color: #1a202c;
}

hr {
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 12px 0;
}
"""

def load_knowledge_base(kb_dir="./knowledge_base"):
    knowledge_text = ""
    md_files = sorted(glob.glob(os.path.join(kb_dir, "*.md")))
    if not md_files:
        print(f"⚠️ Varování: Ve složce '{kb_dir}' nebyly nalezeny žádné .md soubory.")
    for filepath in md_files:
        filename = os.path.basename(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            knowledge_text += f"\n\n--- ZNALOSTNÍ DOKUMENT: {filename} ---\n{f.read()}\n"
    return knowledge_text

def load_job_description(filename, jd_dir="./job_descriptions"):
    if not filename.endswith(".md"):
        filename += ".md"
    filepath = os.path.join(jd_dir, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"❌ Inzerát nebyl nalezen v cestě: '{filepath}'")
    print(f"📖 Načítám popis pozice z: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read(), filename



def find_unicode_font_path():
    """Return a TrueType font path that supports Central European characters."""
    candidates = []

    try:
        import reportlab
        reportlab_dir = Path(reportlab.__file__).resolve().parent
        candidates.append(reportlab_dir / "fonts")
    except Exception:
        pass

    candidates.extend([
        Path(__file__).resolve().parent / "font",
        Path(__file__).resolve().parent / "font" / "static",
        Path("C:/Windows/Fonts"),
        Path("/usr/share/fonts/truetype/dejavu"),
        Path("/usr/share/fonts/truetype/liberation"),
        Path("/usr/share/fonts"),
    ])

    preferred_names = [
        "DejaVuSans.ttf",
        "DejaVuSansCondensed.ttf",
        "LiberationSans-Regular.ttf",
        "Arial.ttf",
        "arial.ttf",
        "ArialUnicodeMS.ttf",
    ]

    for folder in candidates:
        if not folder.exists():
            continue

        for font_name in preferred_names:
            candidate = folder / font_name
            if candidate.exists():
                return str(candidate)

        for matching_font in sorted(folder.rglob("*.ttf")):
            name = matching_font.name.lower()
            if any(token in name for token in ["dejavu", "liberation", "arial", "unicode"]):
                return str(matching_font)

    return None


def register_unicode_fonts():
    """Register a font family with a Unicode-capable TTF in ReportLab."""
    font_path = find_unicode_font_path()
    if not font_path:
        return None

    file_name = Path(font_path).name.lower()
    if 'arial' in file_name:
        family_name = 'Arial'
    elif 'dejavu' in file_name:
        family_name = 'DejaVuSans'
    elif 'liberation' in file_name:
        family_name = 'LiberationSans'
    else:
        family_name = 'Arial'

    pdfmetrics.registerFont(TTFont(family_name, font_path))
    pdfmetrics.registerFontFamily(
        family_name,
        normal=family_name,
        bold=family_name,
        italic=family_name,
        boldItalic=family_name,
    )
    return family_name


def convert_md_to_pdf(md_text, output_pdf_path):
    font_path = find_unicode_font_path()
    if not font_path:
        print("⚠️ Nebyl nalezen kompatibilní font pro české znaky.")
        return False

    font_name = register_unicode_fonts() or 'Arial'
    pdfmetrics.registerFont(TTFont(font_name, font_path))

    width, height = A4
    pdf = canvas.Canvas(output_pdf_path, pagesize=A4)
    pdf.setTitle("CV")
    left_margin = 50
    top_margin = height - 40
    line_height = 14

    def draw_lines(text_lines, font_size=10, bold=False):
        nonlocal top_margin
        pdf.setFont(font_name, font_size)
        if bold:
            pdf.setFont(font_name, font_size)
        for line in text_lines:
            if not line.strip():
                top_margin -= line_height / 2
                continue
            wrapped = textwrap.wrap(line, width=110, break_long_words=False, break_on_hyphens=False)
            for wrapped_line in wrapped:
                if top_margin < 40:
                    pdf.showPage()
                    top_margin = height - 40
                    pdf.setFont(font_name, font_size)
                pdf.drawString(left_margin, top_margin, wrapped_line)
                top_margin -= line_height

    raw_lines = md_text.splitlines()
    for line in raw_lines:
        if not line.strip():
            continue
        if line.startswith("# "):
            draw_lines([line[2:]], 18, True)
        elif line.startswith("## "):
            draw_lines([line[3:]], 14, True)
        elif line.startswith("### "):
            draw_lines([line[4:]], 12, True)
        elif line.startswith("- ") or line.startswith("* "):
            draw_lines(["• " + line[2:]], 10)
        else:
            draw_lines([line], 10)

    pdf.save()
    print(f"📄 PDF bylo úspěšně vytvořeno: {output_pdf_path}")
    return True

def generate_tailored_cv(jd_filename):
    try:
        job_description, clean_filename = load_job_description(jd_filename)
        print("📖 Načítám podklady ze složky ./knowledge_base/...")
        knowledge_base = load_knowledge_base("./knowledge_base")
    except Exception as e:
        print(e)
        return

    prompt = f"""
    Jsi špičkový executive kariérní poradce a IT recruiter. Tvým úkolem je vytvořit **strukturované, vysoce profesionální CV v češtině (ve formátu Markdown)** pro kandidáta Marka Vondru, které bude přesně ušité na míru zadané pracovní pozici.

    ### POPIS PRACOVNÍ POZICE (Job Description):
    {job_description}

    ### KANDIDÁTOVA ZNALOSTNÍ BÁZE (Knowledge Base):
    {knowledge_base}

    ---

    ### POKYNY PRO VYTVOŘENÍ CV:
    1. **Cílení na pozici:** CV musí okamžitě rezonovat s požadavky v Job Description – zejm. přechod na **AI Agentic Engineering**, řízení/architektura na velké škále (300+ FTE), cloudová modernizace (AWS/OTC), transformace legacy systémů a rovnocenné partnerství s businessem.
    2. **Struktura CV:**
       - **Hlavička:** Jméno, titul, kontakt, klíčové pozicionování (Tech Lead | Cloud Architect | AI Transformation Leader).
       - **Executive Profile / Osobní profil:** Úderný souhrn (3-4 věty) vyzdvihující technické lídršip, AI agentic vision a zkušenosti s transformací rozsáhlých systémů.
       - **Klíčové kompetence (Core Competencies):** Rozdělené do přehledných oblastí (AI Agentic SDLC & Governance, Cloud Architecture & Transformation, Leadership & Governance, Business-IT Partnership).
       - **Profesní zkušenosti (Professional Experience):** Detailní chronologický přehled s důrazem na měřitelné výsledky, architekturu, transformaci legacy systémů a vedení lidí.
       - **Vzdělání a Certifikace (Education & Certifications):** ČVUT v Praze, AWS certifikace, Quality Lead Check, atd.
       - **Jazykové znalosti:** CZ (rodilý), EN (C1), DE (B2/C1).
    3. **Tón:** Profesionální, sebevědomý, zaměřený na dopad (Impact & Outcomes), nikoliv jen na popis práce.

    Vygeneruj kompletní Markdown výstup.
    """

    print("🤖 Generuji CV pomocí AI (Gemini 3.6 Flash)...")
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
        )
    )

    base_name = os.path.splitext(clean_filename)[0]
    md_filename = f"CV_Marek_Vondra_{base_name}.md"
    pdf_filename = f"CV_Marek_Vondra_{base_name}.pdf"
    
    with open(md_filename, "w", encoding="utf-8") as f:
        f.write(response.text)
    print(f"✅ Markdown uložen do: {md_filename}")
    
    print("🎨 Převádím Markdown do PDF s českou diakritikou...")
    convert_md_to_pdf(response.text, pdf_filename)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generátor CV na míru z podkladů v Knowledge Base.")
    parser.add_argument("job", type=str, help="Název souboru s inzerátem ve složce /job_descriptions")
    
    args = parser.parse_args()
    generate_tailored_cv(args.job)