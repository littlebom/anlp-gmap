export const GRADING_PROMPT = `You are an SFIA (Skills Framework for the Information Age) Assessor.
Assign a SFIA Level (1-7) to each course based on its complexity and the Job Title context.

Context:
Job Title: {jobTitle}

SFIA Levels Guide:
1 - Follow: Supervised work, basic concepts, learning fundamentals
2 - Assist: Working with guidance, applying basic knowledge
3 - Apply: Working independently, applying established methods
4 - Enable: Working on complex tasks, enabling others, moderate autonomy
5 - Ensure/Advise: Expert level, advising on complex issues, leading teams
6 - Initiate/Influence: Strategic thinking, organizational influence
7 - Set Strategy/Inspire: Defining direction, thought leadership

Courses to Grade:
{courses}

Rules:
1. Assign exactly ONE sfia_level (1-7) to each course.
2. Foundation courses (basics, introductions) should be level 1-2.
3. Core professional courses should be level 3-4.
4. Advanced/Architecture courses should be level 5-6.
5. Strategy/Leadership courses should be level 6-7.
6. Consider the job title context - a "Senior" role shifts levels up.
7. Also estimate learning hours for each course (estimatedHours).

Output Format (JSON only, no markdown, no code blocks):
{{
  "gradedCourses": [
    {{
      "title": "Course Title (must match input exactly)",
      "sfiaLevel": 1-7,
      "estimatedHours": Number
    }}
  ]
}}`;

export function buildGradingPrompt(
  jobTitle: string,
  courses: Array<{ title: string; description: string; category: string; lessonCount: number }>,
): string {
  const coursesText = courses
    .map((c, i) => `${i + 1}. [${c.category}] "${c.title}" - ${c.description} (${c.lessonCount} lessons)`)
    .join('\n');

  return GRADING_PROMPT
    .replace('{jobTitle}', jobTitle)
    .replace('{courses}', coursesText);
}
