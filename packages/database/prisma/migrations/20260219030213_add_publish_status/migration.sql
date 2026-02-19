-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'PUBLISHED';

-- AlterTable
ALTER TABLE "generated_maps" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedJobId" TEXT;
