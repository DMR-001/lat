import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'management';
    const password = 'sproutmgmt123';

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { username },
        update: { password: hashed, role: 'MANAGEMENT' },
        create: { username, password: hashed, role: 'MANAGEMENT' },
    });

    console.log(`✓ User "${user.username}" (${user.role}) seeded — id: ${user.id}`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
