const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudents() {
    const students = await prisma.student.findMany({
        where: {
            OR: [
                { firstName: { contains: 'Arjun', mode: 'insensitive' } },
                { lastName: { contains: 'Gupta', mode: 'insensitive' } }
            ]
        },
        include: {
            fees: {
                include: { payments: true }
            },
            class: true
        }
    });

    console.log(`Found ${students.length} students matching 'Arjun' or 'Gupta':`);

    for (const s of students) {
        console.log(`\n-----------------------------------`);
        console.log(`Student: ${s.firstName} ${s.lastName} (ID: ${s.id})`);
        console.log(`Admission No: ${s.admissionNo}`);
        console.log(`Class: ${s.class?.name} ${s.class?.section || ''}`);
        console.log(`Father: ${s.parentName}`);

        let totalDue = 0;
        console.log("Fees:");
        for (const f of s.fees) {
            const paid = f.payments.reduce((sum, p) => sum + p.amount, 0);
            const due = f.amount - paid;
            if (due > 0) totalDue += due;
            console.log(`  - ${f.type}: Amount ${f.amount}, Paid ${paid}, Due ${due}`);
        }
        console.log(`TOTAL DUE: ${totalDue}`);
    }
}

checkStudents()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
