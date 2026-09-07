import argparse
import glob
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ CHYBA: Proměnná GEMINI_API_KEY nebyla v .env souboru nalezena!")

http_proxy = os.getenv("HTTP_PROXY") or os.getenv("http_proxy")
if http_proxy:
    os.environ["HTTP_PROXY"] = http_proxy
    os.environ["HTTPS_PROXY"] = os.getenv("HTTPS_PROXY") or http_proxy

client = genai.Client(api_key=api_key)

REPO_URL = "https://github.com/maravondra/cv-ai-generator"

AI_DISCLAIMER_MD = (
    "\n\n---\n\n"
    "🤖 *Toto CV bylo vygenerováno AI agentem, kterého vyvinul Marek Vondra. "
    f"Podrobný popis, jak agent funguje: [{REPO_URL.split('//', 1)[1]}]({REPO_URL})*\n"
)


def load_knowledge_base(kb_dir="./knowledge_base"):
    knowledge_text = ""
    md_files = sorted(glob.glob(os.path.join(kb_dir, "*.md")))
    if not md_files:
        print(
            f"⚠️ Varování: Ve složce '{kb_dir}' nebyly nalezeny žádné .md soubory."
        )
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
        raise FileNotFoundError(
            f"❌ Inzerát nebyl nalezen v cestě: '{filepath}'"
        )
    print(f"📖 Načítám popis pozice z: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read(), filename


def generate_tailored_cv_md(jd_filename):
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
       - **Hlavička (H1):** Marek Vondra
       - **Podtitul / Pozicionování (Tučně hned pod H1):** Tech Lead | Cloud Architect | AI Transformation Leader
       - **Kontaktní údaje:** Email | Telefon | Lokalita | LinkedIn
       - **Executive Profile / Osobní profil (H2):** Úderný souhrn (3-4 věty) vyzdvihující technický lídršip, AI agentic vision a zkušenosti s transformací rozsáhlých systémů.
       - **Klíčové kompetence (H2):** Rozdělené do přehledných bodů/oblastí.
       - **Profesní zkušenosti (H2):** Detailní chronologický přehled (H3 pro pozice) s důrazem na měřitelné výsledky.
       - **Vzdělání a Certifikace (H2):** ČVUT v Praze, AWS certifikace, Quality Lead Check atd.
       - **Jazykové znalosti (H2):** CZ (rodilý), EN (C1), DE (B2/C1).
    3. **Tón:** Profesionální, sebevědomý, zaměřený na dopad (Impact & Outcomes).

    Vygeneruj kompletní čistý Markdown výstup bez zbytečného úvodního nebo závěrečného textu.
    """

    print("🤖 Generuji CV pomocí AI (Gemini 3.6 Flash)...")
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
        ),
    )

    base_name = os.path.splitext(clean_filename)[0]
    md_filename = f"CV_Marek_Vondra_{base_name}.md"

    cv_content = response.text.strip() + AI_DISCLAIMER_MD

    with open(md_filename, "w", encoding="utf-8") as f:
        f.write(cv_content)

    print(f"✅ Markdown byl úspěšně uložen do: {md_filename}")
    print(f"👉 Pro vygenerování PDF spusť: python render_cv_pdf.py {md_filename}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generátor CV v Markdownu na míru."
    )
    parser.add_argument(
        "job",
        type=str,
        help="Název souboru s inzerátem ve složce /job_descriptions",
    )
    args = parser.parse_args()
    generate_tailored_cv_md(args.job)