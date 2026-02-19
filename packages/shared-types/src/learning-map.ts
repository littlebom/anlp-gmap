// ===== Job Group =====
export interface IJobGroup {
  id: string;
  name: string;
  nameTh?: string;
  description?: string;
  icon?: string;
  color?: string;
  jobs?: IJob[];
}

// ===== Job =====
export interface IJob {
  id: string;
  title: string;
  titleTh?: string;
  description?: string;
  jobGroupId: string;
  sfiaLevel?: number;
  icon?: string;
  color?: string;
  source?: DataSource;
  courses?: IJobCourse[];
}

// ===== Course =====
export interface ICourse {
  id: string;
  title: string;
  titleTh?: string;
  description?: string;
  category: CourseCategory;
  sfiaLevel?: number;
  estimatedHours?: number;
  isShared: boolean;
  sharedCount: number;
  status: CourseStatus;
  sortOrder: number;
  lessons?: ILesson[];
  jobs?: IJobCourse[];
}

// ===== JobCourse (Junction) =====
export interface IJobCourse {
  jobId: string;
  courseId: string;
  relationType: CourseRelationType;
  job?: IJob;
  course?: ICourse;
}

// ===== Lesson =====
export interface ILesson {
  id: string;
  title: string;
  titleTh?: string;
  description?: string;
  courseId: string;
  content?: string;
  contentType: ContentType;
  duration?: number;
  sortOrder: number;
}

// ===== Course Dependency =====
export interface ICourseDependency {
  prerequisiteCourseId: string;
  dependentCourseId: string;
}

// ===== Map Result (AI Generation Output) =====
export interface IMapResult {
  jobGroup: {
    name: string;
    description?: string;
  };
  jobs: IMapJob[];
  sharedCourses: IMapSharedCourse[];
  metadata: {
    generatedAt: string;
    provider: string;
    jobTitle: string;
  };
}

export interface IMapJob {
  title: string;
  description?: string;
  courses: IMapCourse[];
}

export interface IMapCourse {
  title: string;
  description?: string;
  category: CourseCategory;
  sfiaLevel?: number;
  estimatedHours?: number;
  shareable?: boolean;
  lessons: IMapLesson[];
}

export interface IMapSharedCourse {
  courseTitle: string;
  sharedBetween: string[]; // job titles
}

export interface IMapLesson {
  title: string;
  description?: string;
  contentType?: ContentType;
  duration?: number;
}

// ===== Enums =====
export type CourseCategory = 'TECHNICAL' | 'SOFT' | 'TOOL';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseRelationType = 'CORE' | 'ELECTIVE';
export type ContentType = 'TEXT' | 'VIDEO' | 'INTERACTIVE';
export type DataSource = 'ESCO' | 'ONET' | 'LIGHTCAST' | 'AI' | 'MANUAL';
