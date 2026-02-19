import type { GalaxyJobInput } from './galaxyTypes';

export interface CategoryDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;
  keywords: string[];
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'farming',
    name: 'Farming & Agriculture',
    color: '#4ade80',
    icon: '🌱',
    keywords: ['farmer', 'farming', 'agriculture', 'crop', 'harvest', 'ranch', 'vineyard', 'livestock'],
  },
  {
    id: 'engineering',
    name: 'Engineering & Technology',
    color: '#38bdf8',
    icon: '⚙️',
    keywords: ['engineer', 'developer', 'programmer', 'architect', 'devops', 'technician'],
  },
  {
    id: 'education',
    name: 'Education & Training',
    color: '#e879f9',
    icon: '🎓',
    keywords: ['educator', 'teacher', 'instructor', 'trainer', 'tutor', 'professor', 'lecturer'],
  },
  {
    id: 'sound',
    name: 'Audio & Sound',
    color: '#fb923c',
    icon: '🎧',
    keywords: ['sound', 'audio', 'music', 'acoustic', 'recording', 'mixer'],
  },
  {
    id: 'data',
    name: 'Data & AI',
    color: '#a78bfa',
    icon: '🧠',
    keywords: ['data', 'analyst', 'scientist', 'ai', 'machine learning', 'ml'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medicine',
    color: '#f87171',
    icon: '❤️',
    keywords: ['doctor', 'nurse', 'medical', 'health', 'pharmacist', 'therapist'],
  },
  {
    id: 'design',
    name: 'Design & Creative',
    color: '#fbbf24',
    icon: '🎨',
    keywords: ['designer', 'design', 'creative', 'artist', 'ux', 'ui', 'graphic'],
  },
  {
    id: 'business',
    name: 'Business & Management',
    color: '#22d3ee',
    icon: '💼',
    keywords: ['manager', 'director', 'executive', 'business', 'consultant', 'accountant'],
  },
];

const FALLBACK_CATEGORY: CategoryDefinition = {
  id: 'other',
  name: 'Other',
  color: '#94a3b8',
  icon: '📋',
  keywords: [],
};

export function categorizeJobs(
  jobs: GalaxyJobInput[],
): Map<string, { def: CategoryDefinition; jobs: GalaxyJobInput[] }> {
  const result = new Map<string, { def: CategoryDefinition; jobs: GalaxyJobInput[] }>();

  for (const job of jobs) {
    const title = job.jobTitle.toLowerCase();
    let matched: CategoryDefinition | null = null;

    for (const def of CATEGORY_DEFINITIONS) {
      if (def.keywords.some((kw) => title.includes(kw))) {
        matched = def;
        break;
      }
    }

    const categoryDef = matched ?? FALLBACK_CATEGORY;

    if (!result.has(categoryDef.id)) {
      result.set(categoryDef.id, { def: categoryDef, jobs: [] });
    }
    result.get(categoryDef.id)!.jobs.push(job);
  }

  return result;
}
