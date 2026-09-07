# CV AI Generator

Generate a CV and cover letter tailored to a specific job posting, powered by Google Gemini. The tool combines a personal knowledge base with a target job description to produce polished Markdown documents, then renders them to print-ready PDFs.

## How it works

1. **Knowledge base** (`knowledge_base/*.md`) — Markdown documents describing the candidate's profile, experience, skills, and leadership philosophy. These are concatenated and fed to the model as context.
2. **Job description** (`job_descriptions/*.md`) — the posting you're tailoring the CV for.
3. **CV generation** (`generate_cv_md.py`) — sends the knowledge base and job description to Gemini with a structured prompt, and writes the result as a Markdown CV (`CV_<candidate>_<job>.md`).
4. **Cover letter generation** (`generate_cover_letter.py`) — sends the generated CV and matching job description to Gemini and writes a Markdown cover letter (`CoverLetter_<candidate>_<job>.md`).
5. **Translation** (`translate_cv_md.py`) — translates a Czech Markdown CV or cover letter into English via Gemini, preserving Markdown structure (`<name>_EN.md`).
6. **Rendering** (`render_cv_pdf.py`, `render_letter_pdf.py`) — converts the generated Markdown into styled A4 PDFs using ReportLab, with a language-aware AI-disclosure footer.

## Requirements

- Python 3.9+
- A [Gemini API key](https://ai.google.dev/)

## Setup

```bash
pip3 install -r requirements.txt
```

Create a `.env` file in the project root with your API key:

```
GEMINI_API_KEY=your-api-key-here
```

Optional: if you're behind a proxy, `HTTP_PROXY` / `HTTPS_PROXY` are also picked up from the environment.

## Usage

1. Add a job posting as a Markdown file under `job_descriptions/`, e.g. `job_descriptions/AcmeCorp_Backend_Lead.md`.
2. Generate the tailored CV in Markdown:

   ```bash
   python3 generate_cv_md.py AcmeCorp_Backend_Lead
   ```

   This creates `CV_Marek_Vondra_AcmeCorp_Backend_Lead.md` in the project root.

3. Render it to PDF:

   ```bash
   python3 render_cv_pdf.py CV_Marek_Vondra_AcmeCorp_Backend_Lead.md
   ```

   Use `--output` / `-o` to override the output filename.

4. Generate a matching cover letter (job description is auto-detected from `job_descriptions/` unless `--job` is given):

   ```bash
   python3 generate_cover_letter.py CV_Marek_Vondra_AcmeCorp_Backend_Lead.md
   ```

   This creates `CoverLetter_Marek_Vondra_AcmeCorp_Backend_Lead.md`.

5. Render the cover letter to PDF:

   ```bash
   python3 render_letter_pdf.py CoverLetter_Marek_Vondra_AcmeCorp_Backend_Lead.md
   ```

6. Optional: translate a Czech CV or cover letter to English:

   ```bash
   python3 translate_cv_md.py CV_Marek_Vondra_AcmeCorp_Backend_Lead.md
   ```

   This creates `CV_Marek_Vondra_AcmeCorp_Backend_Lead_EN.md`, which can then be rendered to PDF the same way as above.

### Fonts

`render_cv_pdf.py` uses the Roboto fonts bundled under `font/static/` (`Roboto-Regular.ttf`, `Roboto-Bold.ttf`, `Roboto-Italic.ttf`, `Roboto-BoldItalic.ttf`, Apache 2.0 licensed), which have full Czech diacritics support. If those files are ever removed, it falls back to a system font (Arial/DejaVu Sans) or, as a last resort, the built-in Helvetica — which lacks Czech caron characters (č, ř, ě, š, ž...), so keep the bundled fonts in place for correct rendering.

## Project structure

```
.
├── generate_cv_md.py                        # Generates a tailored CV in Markdown via Gemini
├── generate_cover_letter.py                 # Generates a matching cover letter in Markdown via Gemini
├── translate_cv_md.py                       # Translates a Czech Markdown CV/letter to English via Gemini
├── render_cv_pdf.py                         # Renders a Markdown CV into a styled PDF
├── render_letter_pdf.py                     # Renders a Markdown cover letter into a styled PDF
├── knowledge_base/                          # Candidate's background, structured as Markdown
│   ├── 01_profile_overview.md               # Summary, contact info, competencies, education, languages
│   ├── 02_architecture_and_cloud.md         # Architecture & cloud engineering experience
│   ├── 03_ai_agentic_engineering.md         # AI agentic engineering track record
│   ├── 04_leadership_and_governance.md      # People leadership & technical governance
│   ├── 05_faq_for_recruiters.md             # Recruiter-facing Q&A
│   ├── 06_tribe_vision.md                   # Vision/positioning narrative
│   └── 07_pracovni_historie.md              # Full chronological work history (CZ)
├── job_descriptions/                        # Job postings to tailor CVs against
├── font/                                    # Bundled Roboto fonts (Czech diacritics support)
├── docs/                                    # GitHub Pages explainer for the AI-disclosure link
├── requirements.txt
└── .env                                     # API keys (not committed)
```

## Notes

- The knowledge base and prompts in `generate_cv_md.py` / `generate_cover_letter.py` are currently set up for a specific candidate and written in Czech — adapt the prompts and `knowledge_base/` content to reuse this for someone else or another language.
- Every generated PDF (CV and cover letter) includes an AI-disclosure footer linking back to `docs/` (published via GitHub Pages), explaining how the document was produced.
- `.gitignore` only excludes `.env`. Generated per-application output (`CV_*.md`, `CV_*.pdf`, `CoverLetter_*.md`, `CoverLetter_*.pdf`) is not ignored by default — review `git status` before committing to avoid checking in personal application artifacts you don't intend to publish.
