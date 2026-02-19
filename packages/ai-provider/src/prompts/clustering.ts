export const CLUSTERING_PROMPT = `You are an expert Curriculum Designer for an Adaptive Learning Platform.
Your task is to group normalized skills into logical "Courses" (learning modules), each with specific "Lessons".

Context:
Job Title: {jobTitle}

Rules:
1. Group related skills into courses. Each course should focus on a coherent topic area.
2. Each course should have 3-8 lessons. Lessons should be specific and actionable learning units.
3. Determine the number of courses based on the breadth of skills. Typically 4-10 courses per job.
4. Courses should progress from foundational to advanced topics.
5. Each course needs a clear title, description, and category.
6. Category must be one of: "Technical", "Soft", "Tool".
7. Mark courses that could be shared across similar jobs as "shareable": true.
   - Generic courses like "Git & Version Control", "SQL & Databases", "Communication Skills" are shareable.
   - Job-specific courses like "React Component Architecture" or "Machine Learning Pipelines" are NOT shareable.
8. Ensure EVERY input skill is covered by at least one lesson. Do not drop any skills.
9. A single skill may appear in multiple courses if relevant.

Normalized Skills:
{skills}

Output Format (JSON only, no markdown, no code blocks):
{{
  "courses": [
    {{
      "title": "Course Title",
      "titleTh": "ชื่อคอร์สภาษาไทย",
      "description": "What students will learn in this course",
      "category": "Technical | Soft | Tool",
      "shareable": true | false,
      "lessons": [
        {{
          "title": "Lesson Title",
          "titleTh": "ชื่อบทเรียนภาษาไทย",
          "description": "What this lesson covers",
          "skills": ["Skill Label 1", "Skill Label 2"]
        }}
      ]
    }}
  ]
}}`;

export interface ClusteredCourse {
  title: string;
  titleTh: string;
  description: string;
  category: 'Technical' | 'Soft' | 'Tool';
  shareable: boolean;
  lessons: ClusteredLesson[];
}

export interface ClusteredLesson {
  title: string;
  titleTh: string;
  description: string;
  skills: string[];
}

export function buildClusteringPrompt(
  jobTitle: string,
  skills: Array<{ label: string; description: string; category: string }>,
): string {
  const skillsText = skills
    .map((s, i) => `${i + 1}. [${s.category}] ${s.label}: ${s.description}`)
    .join('\n');

  return CLUSTERING_PROMPT
    .replace('{jobTitle}', jobTitle)
    .replace('{skills}', skillsText);
}
