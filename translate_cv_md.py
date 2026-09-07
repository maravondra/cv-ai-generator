import argparse
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


def load_md(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"❌ Soubor nebyl nalezen: '{filepath}'")
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def translate_md(filepath, output=None):
    source_text = load_md(filepath)

    prompt = f"""
    Jsi profesionální překladatel. Přelož následující dokument ve formátu Markdown
    z češtiny do angličtiny.

    ### PRAVIDLA:
    1. Zachovej **přesně** strukturu a formátování Markdownu (nadpisy, tučné písmo,
       odrážky, odkazy, tabulky, oddělovače atd.) – měň pouze text.
    2. Nepřekládej vlastní jména, názvy firem, technologií, produktů a odkazy (URL).
    3. Zachovej profesionální, sebevědomý tón vhodný pro CV / profesní dokument.
    4. Vrať **pouze** přeložený Markdown, bez jakéhokoliv úvodního nebo závěrečného
       komentáře.

    ### DOKUMENT K PŘEKLADU:
    {source_text}
    """

    print(f"🌍 Překládám '{filepath}' z češtiny do angličtiny (Gemini 3.6 Flash)...")
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
        ),
    )

    translated_text = response.text.strip()

    if output:
        output_path = output
    else:
        base, ext = os.path.splitext(filepath)
        output_path = f"{base}_EN{ext}"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(translated_text + "\n")

    print(f"✅ Anglický překlad byl uložen do: {output_path}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Přeloží Markdown soubor z češtiny do angličtiny pomocí AI."
    )
    parser.add_argument("md_file", type=str, help="Cesta k .md souboru v češtině")
    parser.add_argument(
        "--output", "-o", type=str, default=None,
        help="Volitelná cesta k výstupnímu souboru (výchozí: <název>_EN.md)",
    )
    args = parser.parse_args()
    translate_md(args.md_file, args.output)
