import { PromptTemplate } from "@langchain/core/prompts";

export const NormalizationPrompt = PromptTemplate.fromTemplate(`
You are an expert Data Architect for an Education Platform.
Your task is to "Enrich and Normalize" a list of raw skills extracted from various sources (mainly ESCO).

Context:
Job Title: {jobTitle}

Rules:
1. Merge synonymous skills (e.g., "Python 3" and "Python Programming" -> "Python").
2. Standardize naming to Title Case.
3. INFER missing Tools/Technologies: CAREFULLY analyze the Job Title. If the input lacks specific tools that are STANDARD for this role, add them.
   - Example: "Data Scientist" -> Add "Python", "Pandas", "scikit-learn", "SQL" if missing.
   - Example: "Frontend Developer" -> Add "HTML", "CSS", "JavaScript", "React" or "Vue" if missing.
4. Output a clean JSON list of unique skill objects with "label", "description", and "category" (Technical, Soft, Tool).

Raw Skills:
{rawSkills}

Output Format (JSON only, no markdown):
[
  {{ "label": "String", "description": "String", "category": "String" }}
]
`);

export const GradingPrompt = PromptTemplate.fromTemplate(`
You are an SFIA (Skills Framework for the Information Age) Assessor.
Assign a Level (1-7) to each skill based on its complexity and the Job Title context.

Job Title: {jobTitle}

Levels Guide:
1-2: Novice/Beginner (Concepts, Basic Usage)
3-4: Competent/Practitioner (Working independently, complex tasks)
5-6: Expert/Lead (Architecting, Advising, Strategy)
7: Master/Chief (Strategic direction)

Skills:
{nodes}

Output Format (JSON only, return ALL items with "sfia_level" added):
[
  {{ "label": "String", "description": "String", "category": "String", "sfia_level": Number }}
]
`);

export const DependencyPrompt = PromptTemplate.fromTemplate(`
You are a Curriculum Designer.
Create a "Learning Path" by defining dependencies between these skills.
Return a list of EDGES (Parent -> Child). "Parent" is the prerequisite.

Rules:
1. Avoid cycles.
2. Foundation skills should be parents of advanced skills.
3. If two skills are unrelated or parallel, do not create an edge.

Skills:
{nodes}

Output Format (JSON only):
[
  {{ "source": "Skill Label A", "target": "Skill Label B" }}
]
`);
