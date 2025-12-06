const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reconcileFees() {
    console.log('Starting Fee Reconciliation...');

    // Get all fees
    const fees = await prisma.fee.findMany({
        include: { payments: true }
    });

    console.log(`Found ${fees.length} total fees to check.`);
    let updatedCount = 0;

    for (const fee of fees) {
        // Calculate actual total based on payments
        const actualPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);

        // Determine status
        // Tolerance for float math
        const isFullyPaid = actualPaid >= fee.amount - 0.01;
        const correctStatus = isFullyPaid ? 'PAID' : 'PENDING';

        // Check if update is needed
        if (Math.abs(fee.paidAmount - actualPaid) > 0.1 || fee.status !== correctStatus) {
            console.log(`Fixing Fee ID ${fee.id} (${fee.type}):`);
            console.log(`  - Old: Paid ${fee.paidAmount}, Status ${fee.status}`);
            console.log(`  - New: Paid ${actualPaid}, Status ${correctStatus}`);

            await prisma.fee.update({
                where: { id: fee.id },
                data: {
                    paidAmount: actualPaid,
                    status: correctStatus
                }
            });
            updatedCount++;
        }
    }

    console.log(`\nReconciliation Complete. Updated ${updatedCount} fee records.`);
}

reconcileFees()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
