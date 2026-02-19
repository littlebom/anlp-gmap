export const NORMALIZATION_PROMPT = `You are an expert Data Architect for an Education Platform.
Your task is to "Enrich and Normalize" a list of raw skills extracted from various sources (ESCO, O*NET, Lightcast).

Context:
Job Title: {jobTitle}

Rules:
1. Merge synonymous skills (e.g., "Python 3" and "Python Programming" -> "Python").
2. Standardize naming to Title Case.
3. Remove overly generic skills that don't contribute to learning (e.g., "General work skills").
4. INFER missing Tools/Technologies: CAREFULLY analyze the Job Title. If the input lacks specific tools that are STANDARD for this role, add them.
   - Example: "Data Scientist" -> Add "Python", "Pandas", "scikit-learn", "SQL" if missing.
   - Example: "Frontend Developer" -> Add "HTML", "CSS", "JavaScript", "React" or "Vue" if missing.
5. Assign each skill a category: "Technical", "Soft", or "Tool".
6. Write a brief description (1-2 sentences) for each skill explaining its relevance to the job.

Raw Skills:
{rawSkills}

Output Format (JSON only, no markdown, no code blocks):
{{
  "skills": [
    {{
      "label": "String",
      "description": "Brief description of the skill and its relevance",
      "category": "Technical | Soft | Tool",
      "source": "ESCO | ONET | LIGHTCAST | AI_INFERRED"
    }}
  ]
}}`;

export function buildNormalizationPrompt(
  jobTitle: string,
  rawSkills: string[],
): string {
  return NORMALIZATION_PROMPT
    .replace('{jobTitle}', jobTitle)
    .replace('{rawSkills}', rawSkills.map((s, i) => `${i + 1}. ${s}`).join('\n'));
}
