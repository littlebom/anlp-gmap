import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@anlp.dev' },
    update: {},
    create: {
      email: 'admin@anlp.dev',
      name: 'Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log(`  Admin user: ${admin.email}`);

  // 2. Create sample job groups
  const swDevGroup = await prisma.jobGroup.upsert({
    where: { id: 'jg-software-dev' },
    update: {},
    create: {
      id: 'jg-software-dev',
      name: 'Software Development',
      nameTh: 'การพัฒนาซอฟต์แวร์',
      description: 'Careers related to software development and engineering',
      icon: 'code',
      color: '#3B82F6',
    },
  });

  const dataGroup = await prisma.jobGroup.upsert({
    where: { id: 'jg-data-science' },
    update: {},
    create: {
      id: 'jg-data-science',
      name: 'Data Science & Analytics',
      nameTh: 'วิทยาศาสตร์ข้อมูลและการวิเคราะห์',
      description: 'Careers in data analysis, machine learning, and data engineering',
      icon: 'chart-bar',
      color: '#10B981',
    },
  });

  // 3. Create sample jobs
  const pythonDev = await prisma.job.upsert({
    where: { id: 'job-python-dev' },
    update: {},
    create: {
      id: 'job-python-dev',
      title: 'Python Developer',
      titleTh: 'นักพัฒนา Python',
      description: 'Develops applications using Python',
      jobGroupId: swDevGroup.id,
      sfiaLevel: 3,
      source: 'MANUAL',
    },
  });

  const frontendDev = await prisma.job.upsert({
    where: { id: 'job-frontend-dev' },
    update: {},
    create: {
      id: 'job-frontend-dev',
      title: 'Frontend Developer',
      titleTh: 'นักพัฒนาฝั่ง Frontend',
      description: 'Builds user interfaces with modern web technologies',
      jobGroupId: swDevGroup.id,
      sfiaLevel: 3,
      source: 'MANUAL',
    },
  });

  const dataEngineer = await prisma.job.upsert({
    where: { id: 'job-data-engineer' },
    update: {},
    create: {
      id: 'job-data-engineer',
      title: 'Data Engineer',
      titleTh: 'วิศวกรข้อมูล',
      description: 'Builds and maintains data infrastructure',
      jobGroupId: dataGroup.id,
      sfiaLevel: 4,
      source: 'MANUAL',
    },
  });

  // 4. Create sample courses (some shared)
  const sqlCourse = await prisma.course.upsert({
    where: { id: 'course-sql' },
    update: {},
    create: {
      id: 'course-sql',
      title: 'Database & SQL',
      titleTh: 'ฐานข้อมูลและ SQL',
      description: 'Learn relational databases and SQL querying',
      category: 'TECHNICAL',
      sfiaLevel: 2,
      estimatedHours: 15,
      isShared: true,
      sharedCount: 3,
      status: 'PUBLISHED',
    },
  });

  const gitCourse = await prisma.course.upsert({
    where: { id: 'course-git' },
    update: {},
    create: {
      id: 'course-git',
      title: 'Git & Version Control',
      titleTh: 'Git และการควบคุมเวอร์ชัน',
      description: 'Learn version control with Git',
      category: 'TOOL',
      sfiaLevel: 2,
      estimatedHours: 8,
      isShared: true,
      sharedCount: 3,
      status: 'PUBLISHED',
    },
  });

  const pythonCourse = await prisma.course.upsert({
    where: { id: 'course-python' },
    update: {},
    create: {
      id: 'course-python',
      title: 'Python Fundamentals',
      titleTh: 'พื้นฐาน Python',
      description: 'Learn Python programming from scratch',
      category: 'TECHNICAL',
      sfiaLevel: 2,
      estimatedHours: 20,
      status: 'PUBLISHED',
    },
  });

  const oopCourse = await prisma.course.upsert({
    where: { id: 'course-oop' },
    update: {},
    create: {
      id: 'course-oop',
      title: 'Object-Oriented Programming',
      titleTh: 'การเขียนโปรแกรมเชิงวัตถุ',
      description: 'Master OOP concepts and design patterns',
      category: 'TECHNICAL',
      sfiaLevel: 3,
      estimatedHours: 15,
      status: 'PUBLISHED',
    },
  });

  const reactCourse = await prisma.course.upsert({
    where: { id: 'course-react' },
    update: {},
    create: {
      id: 'course-react',
      title: 'React Development',
      titleTh: 'การพัฒนาด้วย React',
      description: 'Build modern UIs with React',
      category: 'TECHNICAL',
      sfiaLevel: 3,
      estimatedHours: 25,
      status: 'PUBLISHED',
    },
  });

  // 5. Link courses to jobs (many-to-many)
  const jobCourseLinks = [
    { jobId: pythonDev.id, courseId: pythonCourse.id, relationType: 'CORE' as const },
    { jobId: pythonDev.id, courseId: oopCourse.id, relationType: 'CORE' as const },
    { jobId: pythonDev.id, courseId: sqlCourse.id, relationType: 'CORE' as const },
    { jobId: pythonDev.id, courseId: gitCourse.id, relationType: 'CORE' as const },
    { jobId: frontendDev.id, courseId: reactCourse.id, relationType: 'CORE' as const },
    { jobId: frontendDev.id, courseId: gitCourse.id, relationType: 'CORE' as const },
    { jobId: frontendDev.id, courseId: sqlCourse.id, relationType: 'ELECTIVE' as const },
    { jobId: dataEngineer.id, courseId: pythonCourse.id, relationType: 'CORE' as const },
    { jobId: dataEngineer.id, courseId: sqlCourse.id, relationType: 'CORE' as const },
    { jobId: dataEngineer.id, courseId: gitCourse.id, relationType: 'CORE' as const },
  ];

  for (const link of jobCourseLinks) {
    await prisma.jobCourse.upsert({
      where: { jobId_courseId: { jobId: link.jobId, courseId: link.courseId } },
      update: {},
      create: link,
    });
  }
  console.log(`  Linked ${jobCourseLinks.length} job-course relationships`);

  // 6. Create sample lessons for Python course
  const pythonLessons = [
    { title: 'Variables & Data Types', titleTh: 'ตัวแปรและชนิดข้อมูล', duration: 45 },
    { title: 'Control Flow', titleTh: 'การควบคุมการทำงาน', duration: 60 },
    { title: 'Functions', titleTh: 'ฟังก์ชัน', duration: 50 },
    { title: 'Data Structures', titleTh: 'โครงสร้างข้อมูล', duration: 90 },
    { title: 'File I/O', titleTh: 'การอ่านเขียนไฟล์', duration: 40 },
  ];

  for (let i = 0; i < pythonLessons.length; i++) {
    await prisma.lesson.upsert({
      where: { id: `lesson-python-${i + 1}` },
      update: {},
      create: {
        id: `lesson-python-${i + 1}`,
        ...pythonLessons[i],
        courseId: pythonCourse.id,
        contentType: 'TEXT',
        sortOrder: i,
      },
    });
  }
  console.log(`  Created ${pythonLessons.length} lessons for Python Fundamentals`);

  // 7. Create course dependencies (DAG)
  await prisma.courseDependency.upsert({
    where: {
      prerequisiteCourseId_dependentCourseId: {
        prerequisiteCourseId: pythonCourse.id,
        dependentCourseId: oopCourse.id,
      },
    },
    update: {},
    create: {
      prerequisiteCourseId: pythonCourse.id,
      dependentCourseId: oopCourse.id,
    },
  });
  console.log('  Created course dependency: Python → OOP');

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
