/** Tunable thresholds and heuristic inputs. Single source so they are testable. */
export interface Thresholds {
  /** Published within this many days => "new". */
  newPackageMaxAgeDays: number;
  /** Recent downloads at or below this => "low adoption". */
  lowAdoptionMaxDownloads: number;
  /** Normalized similarity (0..1) at or above this to a popular name => "close typo". */
  typosquatMinSimilarity: number;
}

export const defaultThresholds: Thresholds = {
  newPackageMaxAgeDays: 30,
  lowAdoptionMaxDownloads: 50,
  typosquatMinSimilarity: 0.85,
};

/** Substrings/affixes LLMs commonly hallucinate. Case-insensitive match. */
export const llmNamingPatterns: readonly string[] = [
  "-helper",
  "-helpers",
  "-utils",
  "-util",
  "-sdk",
  "-wrapper",
  "-toolkit",
  "easy-",
  "gpt-",
  "-gpt",
  "ai-",
  "-ai",
  "openai-",
  "-openai",
  "auto-",
];

/** Popular package names per ecosystem, used for typosquat similarity. */
export const popularPackages: Record<"npm" | "pypi", readonly string[]> = {
  npm: [
    "react", "react-dom", "lodash", "axios", "express", "chalk", "commander",
    "vue", "next", "typescript", "webpack", "vite", "eslint", "dotenv",
    "zod", "moment", "uuid", "jest", "vitest",
  ],
  pypi: [
    "requests", "numpy", "pandas", "flask", "django", "pytest", "scipy",
    "boto3", "fastapi", "pydantic", "matplotlib", "pillow", "sqlalchemy",
    "click", "setuptools", "urllib3", "certifi", "tensorflow", "torch",
  ],
};
