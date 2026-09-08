# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal pipeline that generates a CV and cover letter tailored to a specific job posting using Google Gemini, then renders them to print-ready A4 PDFs. It is set up for one specific candidate (Marek Vondra) with Czech-language prompts and knowledge base — reusing it for someone else means editing the prompts in `generate_cv_md.py` / `generate_cover_letter.py` and replacing `knowledge_base/`.

## Setup

```bash
pip3 install -r requirements.txt
```

Requires a `.env` file in the project root with `GEMINI_API_KEY=...`. `HTTP_PROXY`/`HTTPS_PROXY` are picked up from the environment if set.

## Commands (pipeline stages)

There is no build/lint/test tooling — this is a set of standalone scripts run in sequence:

```bash
# 1. Add a job posting under job_descriptions/<Name>.md, then generate a tailored CV
python3 generate_cv_md.py <JobDescriptionBaseName>          # -> CV_Marek_Vondra_<JobDescriptionBaseName>.md

# 2. Render CV Markdown to PDF
python3 render_cv_pdf.py CV_Marek_Vondra_<Name>.md [-o output.pdf]

# 3. Generate a matching cover letter (job description auto-detected from job_descriptions/ unless --job given)
python3 generate_cover_letter.py CV_Marek_Vondra_<Name>.md [--job path.md] [-o output.md]

# 4. Render cover letter Markdown to PDF
python3 render_letter_pdf.py CoverLetter_Marek_Vondra_<Name>.md [-o output.pdf]

# 5. Optional: translate a Czech CV/letter to English
python3 translate_cv_md.py CV_Marek_Vondra_<Name>.md [-o output.md]   # -> <name>_EN.md
```

## Architecture

- **`knowledge_base/*.md`** — candidate background documents (numbered, concatenated in sorted order and fed as model context). Editing these changes what the generator draws on for every future CV.
- **`job_descriptions/*.md`** — one file per job posting; the base filename (without `.md`) is the "job slug" used to name all downstream generated files.
- **`generate_cv_md.py`** — loads the whole knowledge base + one job description, sends a structured Czech prompt to Gemini (`gemini-3.6-flash`), writes `CV_Marek_Vondra_<slug>.md` with an appended AI-disclosure footer.
- **`generate_cover_letter.py`** — takes a generated CV Markdown file, detects its language via `detect_language()` (ratio of Czech diacritic characters), auto-locates the matching job description by reversing the CV filename convention (`guess_job_description_path`), and asks Gemini to write the letter in the same language as the CV.
- **`translate_cv_md.py`** — one-shot Gemini translation of a Markdown file CZ→EN, preserving Markdown structure; used for either CV or cover letter output.
- **`render_cv_pdf.py`** — the shared PDF rendering core: parses the generated Markdown into `Section` objects, builds ReportLab flowables/styles, paginates content across two sidebar/main columns, and draws the AI-disclosure footer + page numbers via `NumberedCanvas`. Also owns `FONT_NAME`, `PAGE_SIZE`, `MARGIN_*`, `TEXT`, `detect_language()`, and `inline_markdown_to_html()` — all imported by `render_letter_pdf.py` rather than duplicated.
- **`render_letter_pdf.py`** — simpler single-column renderer for cover letters; reuses the CV renderer's font/canvas/language-detection machinery so both PDFs share the same visual language and footer.
- **Fonts**: `register_project_fonts()` in `render_cv_pdf.py` registers the bundled Roboto fonts (`font/static/`, Apache 2.0) which support Czech diacritics, falling back to a system font or Helvetica (no caron support) if the bundled files are missing — keep them in place.
- **AI-disclosure footer**: every generated PDF links to `docs/` (a GitHub Pages explainer, `docs/index.html`) via a language-aware footer (`AI_DISCLAIMER_TEXTS` in `render_cv_pdf.py`, `AI_DISCLAIMER_MD` in the two generator scripts).
- **Filename convention drives auto-discovery**: `CV_Marek_Vondra_<slug>[_EN].md` ↔ `job_descriptions/<slug>.md` ↔ `CoverLetter_Marek_Vondra_<slug>[_EN].md`. Scripts that need to find a companion file (cover letter → job description) parse this convention rather than taking an explicit path.

## Notes

- `.gitignore` only excludes `.env`. Generated per-application output (`CV_*.md`, `CV_*.pdf`, `CoverLetter_*.md`, `CoverLetter_*.pdf`) is **not** ignored by default — check `git status` before committing to avoid checking in personal application artifacts not meant to be published.
- Prompts and console/error messages throughout the generator scripts are in Czech; keep this consistent when editing them for this candidate.
