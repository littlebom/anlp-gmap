// ── Input types (from API) ──

export interface GalaxyJobInput {
  id: string;
  jobTitle: string;
  status: string;
  mapData?: {
    jobTitle: string;
    courses: GalaxyCourseInput[];
    dependencies: Array<{ prerequisite: string; dependent: string }>;
    sharedCourses: string[];
    courseCount: number;
    lessonCount: number;
    normalizedSkillCount?: number;
    rawSkillCount?: number;
  };
}

export interface GalaxyCourseInput {
  title: string;
  titleTh?: string;
  description?: string;
  category: string;
  sfiaLevel: number;
  estimatedHours: number;
  shareable?: boolean;
  lessons: Array<{
    title: string;
    titleTh?: string;
    description: string;
    skills?: string[];
  }>;
}

// ── Galaxy internal types ──

export interface GalaxyCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  jobs: GalaxyJob[];
}

export interface GalaxyJob {
  id: string;
  name: string;
  categoryId: string;
  x: number;
  y: number;
  courseCount: number;
  lessonCount: number;
  skillCount: number;
  courses: GalaxyJobCourse[];
}

export interface GalaxySkill {
  name: string;
  x: number;
  y: number;
}

export interface GalaxyJobCourse {
  title: string;
  category: string;
  sfiaLevel: number;
  estimatedHours: number;
  lessonCount: number;
  isShared: boolean;
  x: number;
  y: number;
  skills: GalaxySkill[];
}

export interface GalaxySharedLink {
  courseTitle: string;
  /** Each occurrence of the same course across different jobs */
  nodes: Array<{
    jobId: string;
    categoryId: string;
    courseKey: string; // "jobId-courseIdx"
    x: number;
    y: number;
  }>;
}

export interface GalaxySearchResult {
  type: 'job' | 'course' | 'skill';
  label: string;
  catId: string;
  jobId: string;
  courseKey?: string;       // "jobId-courseIdx"
  x: number;
  y: number;
  color: string;
}

export interface GalaxyData {
  categories: GalaxyCategory[];
  sharedLinks: GalaxySharedLink[];
  stats: {
    totalJobs: number;
    totalCategories: number;
    totalCourses: number;
    totalLessons: number;
    totalSkills: number;
  };
}

