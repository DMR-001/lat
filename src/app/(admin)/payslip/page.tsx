import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import PayslipClient from './PayslipClient';

export default async function PayslipPage() {
    const session = await getSession();

    if (!session || session.user.role !== 'TEACHER') {
        redirect('/login');
    }

    const teacherId = session.user.teacherId as string;

    const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            subject: true,
            branch: { select: { name: true } },
            salaries: {
                where: { isActive: true },
                take: 1,
                select: {
                    basicSalary: true,
                    allowances: true,
                    deductions: true,
                    netSalary: true,
                    effectiveFrom: true,
                    payments: {
                        orderBy: [{ year: 'desc' }, { month: 'desc' }],
                        select: {
                            id: true,
                            month: true,
                            year: true,
                            amount: true,
                            leaveDays: true,
                            leaveDeduction: true,
                            finalAmount: true,
                            status: true,
                            paymentDate: true,
                            paymentMethod: true,
                            referenceNo: true,
                            remarks: true,
                            createdAt: true,
                        }
                    }
                }
            }
        }
    });

    if (!teacher) redirect('/login');

    const schoolSettings = await prisma.schoolSettings.findFirst({
        select: { schoolName: true, address: true, phone: true, email: true, logoUrl: true }
    });

    const salary = teacher.salaries[0] ?? null;
    const payments = salary?.payments ?? [];

    return (
        <PayslipClient
            teacher={{
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                employeeId: teacher.employeeId,
                subject: teacher.subject,
                branchName: teacher.branch?.name ?? null,
            }}
            salary={salary ? {
                basicSalary: salary.basicSalary,
                allowances: salary.allowances,
                deductions: salary.deductions,
                netSalary: salary.netSalary,
                effectiveFrom: salary.effectiveFrom.toISOString(),
            } : null}
            payments={payments.map(p => ({
                id: p.id,
                month: p.month,
                year: p.year,
                amount: p.amount,
                leaveDays: p.leaveDays,
                leaveDeduction: p.leaveDeduction,
                finalAmount: p.finalAmount,
                status: p.status,
                paymentDate: p.paymentDate?.toISOString() ?? null,
                paymentMethod: p.paymentMethod,
                referenceNo: p.referenceNo,
                remarks: p.remarks,
                createdAt: p.createdAt.toISOString(),
            }))}
            schoolName={schoolSettings?.schoolName ?? 'Sprout School'}
            schoolAddress={schoolSettings?.address ?? null}
            schoolPhone={schoolSettings?.phone ?? null}
            logoUrl={schoolSettings?.logoUrl ?? null}
        />
    );
}
