import { PrismaClient, NodeLevel } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed ข้อมูลเริ่มต้น สำหรับทดสอบระบบ
 * รัน: npx prisma db seed
 */
async function main() {
    console.log('🌱 Seeding database...');

    // ===== 1. Admin User =====
    const admin = await prisma.user.upsert({
        where: { email: 'admin@anlp.com' },
        update: {},
        create: {
            email: 'admin@anlp.com',
            name: 'Admin',
            passwordHash: '$2a$10$placeholder', // ต้อง hash จริงตอนใช้งาน
            role: 'ADMIN',
        },
    });
    console.log(`  ✅ Admin user: ${admin.email}`);

    // ===== 2. L1 Categories =====
    const categories = [
        { title: 'Software Development', titleTh: 'การพัฒนาซอฟต์แวร์', icon: '💻', color: '#38bdf8' },
        { title: 'Data & AI', titleTh: 'ข้อมูลและ AI', icon: '🧠', color: '#818cf8' },
        { title: 'Cybersecurity', titleTh: 'ความปลอดภัยไซเบอร์', icon: '🔒', color: '#f472b6' },
        { title: 'Cloud & Infrastructure', titleTh: 'คลาวด์และโครงสร้างพื้นฐาน', icon: '☁️', color: '#2dd4bf' },
    ];

    const catNodes = [];
    for (const cat of categories) {
        const node = await prisma.skillNode.upsert({
            where: { id: cat.title.toLowerCase().replace(/[^a-z]/g, '-') },
            update: {},
            create: {
                id: cat.title.toLowerCase().replace(/[^a-z]/g, '-'),
                title: cat.title,
                titleTh: cat.titleTh,
                nodeLevel: NodeLevel.L1_CATEGORY,
                icon: cat.icon,
                color: cat.color,
            },
        });
        catNodes.push(node);
        console.log(`  ✅ L1: ${node.title}`);
    }

    // ===== 3. L2 Job Titles (under Software Development) =====
    const softdevId = catNodes[0].id;
    const jobs = [
        { title: 'Python Developer', titleTh: 'นักพัฒนา Python' },
        { title: 'Frontend Developer', titleTh: 'นักพัฒนา Frontend' },
        { title: 'Backend Developer', titleTh: 'นักพัฒนา Backend' },
        { title: 'DevOps Engineer', titleTh: 'วิศวกร DevOps' },
    ];

    for (const job of jobs) {
        const node = await prisma.skillNode.upsert({
            where: { id: job.title.toLowerCase().replace(/[^a-z]/g, '-') },
            update: {},
            create: {
                id: job.title.toLowerCase().replace(/[^a-z]/g, '-'),
                title: job.title,
                titleTh: job.titleTh,
                nodeLevel: NodeLevel.L2_JOB_TITLE,
                parentId: softdevId,
            },
        });
        console.log(`  ✅ L2: ${node.title}`);
    }

    // ===== 4. L3 Skills (under Python Developer) =====
    const pythonDevId = 'python-developer';
    const skills = [
        { title: 'OOP', titleTh: 'Object-Oriented Programming', sfiaLevel: 3 },
        { title: 'Flask', titleTh: 'Flask Framework', sfiaLevel: 3 },
        { title: 'Testing', titleTh: 'การทดสอบซอฟต์แวร์', sfiaLevel: 3 },
        { title: 'Database', titleTh: 'ฐานข้อมูล', sfiaLevel: 2 },
        { title: 'API Design', titleTh: 'การออกแบบ API', sfiaLevel: 4 },
    ];

    for (const skill of skills) {
        const node = await prisma.skillNode.upsert({
            where: { id: `py-${skill.title.toLowerCase().replace(/[^a-z]/g, '-')}` },
            update: {},
            create: {
                id: `py-${skill.title.toLowerCase().replace(/[^a-z]/g, '-')}`,
                title: skill.title,
                titleTh: skill.titleTh,
                nodeLevel: NodeLevel.L3_SKILL,
                parentId: pythonDevId,
                sfiaLevel: skill.sfiaLevel,
            },
        });
        console.log(`  ✅ L3: ${node.title}`);
    }

    console.log('\n🎉 Seed complete!');
}

main()
    .catch(e => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
