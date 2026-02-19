export type UserRole = 'LEARNER' | 'ADMIN' | 'CURATOR';
export type ProgressStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt?: string;
  createdAt: string;
}

export interface ISafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  level: number;
  totalXp: number;
  currentStreak: number;
}

export interface IUserCourseProgress {
  id: string;
  userId: string;
  courseId: string;
  status: ProgressStatus;
  score?: number;
  stars?: number;
  xpEarned: number;
  attempts: number;
  startedAt?: string;
  completedAt?: string;
}

export interface IUserLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  timeSpent: number;
  completedAt?: string;
}
