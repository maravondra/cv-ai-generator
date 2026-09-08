import path from "node:path";

/**
 * Root of the Python project (one level up from web/ by default). All Python
 * scripts are invoked with this as `cwd`, matching how they're run manually today
 * (they resolve ./knowledge_base, ./job_descriptions, and .env relative to cwd).
 */
export const projectRoot = path.resolve(
  process.env.CV_PROJECT_ROOT?.trim() || path.join(process.cwd(), "..")
);

export const knowledgeBaseDir = path.join(projectRoot, "knowledge_base");
export const jobDescriptionsDir = path.join(projectRoot, "job_descriptions");
export const generatedOutputsDir = path.join(projectRoot, "generated_outputs");

export const pythonBin = process.env.PYTHON_BIN?.trim() || "python3";

export const scripts = {
  generateCv: path.join(projectRoot, "generate_cv_md.py"),
  generateCoverLetter: path.join(projectRoot, "generate_cover_letter.py"),
  translate: path.join(projectRoot, "translate_cv_md.py"),
  renderCvPdf: path.join(projectRoot, "render_cv_pdf.py"),
  renderLetterPdf: path.join(projectRoot, "render_letter_pdf.py"),
};
