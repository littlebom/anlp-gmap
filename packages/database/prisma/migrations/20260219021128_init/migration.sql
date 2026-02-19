-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'ADMIN', 'CURATOR');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('TECHNICAL', 'SOFT', 'TOOL');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseRelationType" AS ENUM ('CORE', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'VIDEO', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('ESCO', 'ONET', 'LIGHTCAST', 'AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EscoRelationType" AS ENUM ('ESSENTIAL', 'OPTIONAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTh" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleTh" TEXT,
    "description" TEXT,
    "jobGroupId" TEXT NOT NULL,
    "sfiaLevel" INTEGER,
    "icon" TEXT,
    "color" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleTh" TEXT,
    "description" TEXT,
    "category" "CourseCategory" NOT NULL DEFAULT 'TECHNICAL',
    "sfiaLevel" INTEGER,
    "estimatedHours" DOUBLE PRECISION,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_courses" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "relationType" "CourseRelationType" NOT NULL DEFAULT 'CORE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleTh" TEXT,
    "description" TEXT,
    "courseId" TEXT NOT NULL,
    "content" TEXT,
    "contentType" "ContentType" NOT NULL DEFAULT 'TEXT',
    "duration" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_dependencies" (
    "id" TEXT NOT NULL,
    "prerequisiteCourseId" TEXT NOT NULL,
    "dependentCourseId" TEXT NOT NULL,

    CONSTRAINT "course_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_course_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'LOCKED',
    "score" DOUBLE PRECISION,
    "stars" INTEGER,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'LOCKED',
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_maps" (
    "id" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" TEXT,
    "mapData" JSONB,
    "nodeCount" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "generated_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_isco_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "prefLabel" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,

    CONSTRAINT "esco_isco_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_occupations" (
    "id" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "prefLabel" TEXT NOT NULL,
    "description" TEXT,
    "iscoGroupId" TEXT,

    CONSTRAINT "esco_occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_skills" (
    "id" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "skillType" TEXT NOT NULL,
    "prefLabel" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "esco_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_occupation_skills" (
    "id" TEXT NOT NULL,
    "occupationId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "relationType" "EscoRelationType" NOT NULL DEFAULT 'ESSENTIAL',

    CONSTRAINT "esco_occupation_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "jobs_jobGroupId_idx" ON "jobs"("jobGroupId");

-- CreateIndex
CREATE INDEX "job_courses_jobId_idx" ON "job_courses"("jobId");

-- CreateIndex
CREATE INDEX "job_courses_courseId_idx" ON "job_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "job_courses_jobId_courseId_key" ON "job_courses"("jobId", "courseId");

-- CreateIndex
CREATE INDEX "lessons_courseId_idx" ON "lessons"("courseId");

-- CreateIndex
CREATE INDEX "course_dependencies_prerequisiteCourseId_idx" ON "course_dependencies"("prerequisiteCourseId");

-- CreateIndex
CREATE INDEX "course_dependencies_dependentCourseId_idx" ON "course_dependencies"("dependentCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_dependencies_prerequisiteCourseId_dependentCourseId_key" ON "course_dependencies"("prerequisiteCourseId", "dependentCourseId");

-- CreateIndex
CREATE INDEX "user_course_progress_userId_idx" ON "user_course_progress"("userId");

-- CreateIndex
CREATE INDEX "user_course_progress_courseId_idx" ON "user_course_progress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "user_course_progress_userId_courseId_key" ON "user_course_progress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "user_lesson_progress_userId_idx" ON "user_lesson_progress"("userId");

-- CreateIndex
CREATE INDEX "user_lesson_progress_lessonId_idx" ON "user_lesson_progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_userId_lessonId_key" ON "user_lesson_progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "esco_isco_groups_code_key" ON "esco_isco_groups"("code");

-- CreateIndex
CREATE INDEX "esco_isco_groups_parentId_idx" ON "esco_isco_groups"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "esco_occupations_uri_key" ON "esco_occupations"("uri");

-- CreateIndex
CREATE INDEX "esco_occupations_iscoGroupId_idx" ON "esco_occupations"("iscoGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "esco_skills_uri_key" ON "esco_skills"("uri");

-- CreateIndex
CREATE INDEX "esco_occupation_skills_occupationId_idx" ON "esco_occupation_skills"("occupationId");

-- CreateIndex
CREATE INDEX "esco_occupation_skills_skillId_idx" ON "esco_occupation_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "esco_occupation_skills_occupationId_skillId_key" ON "esco_occupation_skills"("occupationId", "skillId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_jobGroupId_fkey" FOREIGN KEY ("jobGroupId") REFERENCES "job_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_courses" ADD CONSTRAINT "job_courses_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_courses" ADD CONSTRAINT "job_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_dependencies" ADD CONSTRAINT "course_dependencies_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_dependencies" ADD CONSTRAINT "course_dependencies_dependentCourseId_fkey" FOREIGN KEY ("dependentCourseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_isco_groups" ADD CONSTRAINT "esco_isco_groups_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "esco_isco_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_occupations" ADD CONSTRAINT "esco_occupations_iscoGroupId_fkey" FOREIGN KEY ("iscoGroupId") REFERENCES "esco_isco_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_occupation_skills" ADD CONSTRAINT "esco_occupation_skills_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "esco_occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_occupation_skills" ADD CONSTRAINT "esco_occupation_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "esco_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
