const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10);

    // Create default branch
    const branch = await prisma.branch.upsert({
        where: { code: 'MAIN' },
        update: {},
        create: {
            name: 'Main Branch',
            code: 'MAIN',
            address: 'Sprout School Main Campus',
            isActive: true,
        },
    });

    console.log({ branch });

    // Create default academic year (2025-26)
    const academicYear = await prisma.academicYear.upsert({
        where: { 
            name_branchId: {
                name: '2025-26',
                branchId: branch.id
            }
        },
        update: {},
        create: {
            name: '2025-26',
            startDate: new Date('2025-04-01'),
            endDate: new Date('2026-03-31'),
            isActive: true,
            branchId: branch.id,
        },
    });

    console.log({ academicYear });

    // Create admin user
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'MANAGEMENT',
            defaultBranchId: branch.id,
        },
    });

    console.log({ user });

    // Create school settings
    const settings = await prisma.schoolSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            schoolName: 'Sprout School',
        },
    });

    console.log({ settings });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
