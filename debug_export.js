const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Classes ---');
    const classes = await prisma.class.findMany();
    classes.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}, Grade: "${c.grade}"`));

    console.log('\n--- Students with Pending Fees ---');
    const students = await prisma.student.findMany({
        where: {
            fees: { some: { status: { not: 'PAID' } } }
        },
        include: {
            class: true,
            fees: { where: { status: { not: 'PAID' } } }
        }
    });

    students.forEach(s => {
        console.log(`Student: ${s.firstName} ${s.lastName}, Class Grade: "${s.class.grade}", Pending Fees: ${s.fees.length}`);
    });
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
