export const DEPENDENCY_PROMPT = `You are a Curriculum Designer.
Create a "Learning Path" by defining dependencies between courses.
Return a list of EDGES (prerequisite -> dependent). "prerequisite" must be learned before "dependent".

Context:
Job Title: {jobTitle}

Courses (with SFIA levels):
{courses}

Rules:
1. AVOID CYCLES at all costs. The dependency graph must be a DAG (Directed Acyclic Graph).
2. Lower SFIA level courses should generally be prerequisites for higher level courses.
3. Foundation courses (level 1-2) should be prerequisites for intermediate courses (level 3-4).
4. If two courses are unrelated or parallel, do NOT create an edge between them.
5. Do not create redundant edges. If A -> B -> C, do not also create A -> C.
6. Not every course needs prerequisites. Entry-level courses can stand alone.
7. A course can have multiple prerequisites and multiple dependents.

Output Format (JSON only, no markdown, no code blocks):
{{
  "dependencies": [
    {{
      "prerequisite": "Course Title A (must match input exactly)",
      "dependent": "Course Title B (must match input exactly)"
    }}
  ]
}}`;

export function buildDependencyPrompt(
  jobTitle: string,
  courses: Array<{ title: string; sfiaLevel: number; category: string }>,
): string {
  const coursesText = courses
    .map((c, i) => `${i + 1}. [Level ${c.sfiaLevel}] [${c.category}] "${c.title}"`)
    .join('\n');

  return DEPENDENCY_PROMPT
    .replace('{jobTitle}', jobTitle)
    .replace('{courses}', coursesText);
}
