# CV AI Generator

Generate a CV tailored to a specific job posting, powered by Google Gemini. The tool combines a personal knowledge base with a target job description to produce a polished Markdown CV, then renders it to a print-ready PDF.

## How it works

1. **Knowledge base** (`knowledge_base/*.md`) — Markdown documents describing the candidate's profile, experience, skills, and leadership philosophy. These are concatenated and fed to the model as context.
2. **Job description** (`job_descriptions/*.md`) — the posting you're tailoring the CV for.
3. **Generation** (`generate_cv_md.py`) — sends the knowledge base and job description to Gemini with a structured prompt, and writes the result as a Markdown CV (`CV_<candidate>_<job>.md`).
4. **Rendering** (`render_cv_pdf.py`) — converts the generated Markdown into a styled A4 PDF using ReportLab.

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

### Custom fonts (optional)

`render_cv_pdf.py` looks for Roboto fonts (with diacritics support) under `font/static/` (`Roboto-Regular.ttf`, `Roboto-Bold.ttf`, `Roboto-Italic.ttf`, `Roboto-BoldItalic.ttf`). If they're not present, it falls back to a system font or Helvetica.

## Project structure

```
.
├── generate_cv_md.py                        # Generates a tailored CV in Markdown via Gemini
├── render_cv_pdf.py                         # Renders a Markdown CV into a styled PDF
├── knowledge_base/                          # Candidate's background, structured as Markdown
│   ├── 01_profile_overview.md               # Summary, contact info, competencies, education, languages
│   ├── 02_architecture_and_cloud.md         # Architecture & cloud engineering experience
│   ├── 03_ai_agentic_engineering.md         # AI agentic engineering track record
│   ├── 04_leadership_and_governance.md      # People leadership & technical governance
│   ├── 05_faq_for_recruiters.md             # Recruiter-facing Q&A
│   ├── 06_tribe_vision.md                   # Vision/positioning narrative
│   └── 07_pracovni_historie.md              # Full chronological work history (CZ)
├── job_descriptions/                        # Job postings to tailor CVs against
├── requirements.txt
└── .env                                     # API keys (not committed)
```

## Notes

- The knowledge base and prompt in `generate_cv_md.py` are currently set up for a specific candidate and written in Czech — adapt the prompt and `knowledge_base/` content to reuse this for someone else or another language.
- Generated CVs (`CV_*.md`, `*.pdf`) and `.env` are expected to stay untracked; verify `.gitignore` before committing if you add new personal output files.
