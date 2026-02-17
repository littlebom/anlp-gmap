-- CreateEnum
CREATE TYPE "EscoRelationType" AS ENUM ('ESSENTIAL', 'OPTIONAL');

-- CreateTable
CREATE TABLE "esco_isco_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "pref_label" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,

    CONSTRAINT "esco_isco_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_occupations" (
    "id" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "pref_label" TEXT NOT NULL,
    "description" TEXT,
    "isco_group_id" TEXT,

    CONSTRAINT "esco_occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_skills" (
    "id" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "skill_type" TEXT NOT NULL,
    "pref_label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "esco_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esco_occupation_skills" (
    "occupation_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "relation_type" "EscoRelationType" NOT NULL,

    CONSTRAINT "esco_occupation_skills_pkey" PRIMARY KEY ("occupation_id","skill_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "esco_isco_groups_code_key" ON "esco_isco_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "esco_isco_groups_uri_key" ON "esco_isco_groups"("uri");

-- CreateIndex
CREATE UNIQUE INDEX "esco_occupations_uri_key" ON "esco_occupations"("uri");

-- CreateIndex
CREATE UNIQUE INDEX "esco_skills_uri_key" ON "esco_skills"("uri");

-- AddForeignKey
ALTER TABLE "esco_isco_groups" ADD CONSTRAINT "esco_isco_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "esco_isco_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_occupations" ADD CONSTRAINT "esco_occupations_isco_group_id_fkey" FOREIGN KEY ("isco_group_id") REFERENCES "esco_isco_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_occupation_skills" ADD CONSTRAINT "esco_occupation_skills_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "esco_occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esco_occupation_skills" ADD CONSTRAINT "esco_occupation_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "esco_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
