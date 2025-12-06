const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyArjun() {
    const student = await prisma.student.findFirst({
        where: { firstName: 'Arjun', lastName: 'Gupta' },
        include: {
            fees: {
                include: { payments: true }
            }
        }
    });

    if (!student) {
        console.log('Student not found');
        return;
    }

    console.log(`Checking fees for ${student.firstName} ${student.lastName}`);
    for (const fee of student.fees) {
        const totalPayments = fee.payments.reduce((sum, p) => sum + p.amount, 0);
        console.log(`Fee Type: ${fee.type}`);
        console.log(`  - Record Paid Amount: ${fee.paidAmount}`);
        console.log(`  - Actual Total Payments: ${totalPayments}`);
        console.log(`  - Status: ${fee.status}`);

        if (Math.abs(fee.paidAmount - totalPayments) > 0.1) {
            console.log(`  [MISMATCH DETECTED]`);
        }
    }
}

verifyArjun()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
