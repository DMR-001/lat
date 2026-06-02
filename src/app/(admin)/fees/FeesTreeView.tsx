'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Tag, CreditCard, Search, Users, X, GraduationCap, Pencil } from 'lucide-react';

const FEE_TYPE_LABELS: Record<string, string> = {
    REGISTRATION: 'Registration Fee',
    TUITION:      'Tuition Fee',
    SPORTS:       'Sports & Activity Fee',
    BOOKS:        'Book Fee',
    UNIFORM:      'Uniform & Bag Fee',
    TRANSPORT:    'Transport Fee',
};

type Fee = {
    id: string;
    type: string;
    amount: number;
    originalAmount: number;
    discountAmount: number;
    discountReason: string | null;
    paidAmount: number;
    dueDate: string;
    status: string;
};

type StudentGroup = {
    student: {
        id: string;
        firstName: string;
        lastName: string;
        admissionNo: string;
        class: { name: string } | null;
    };
    fees: Fee[];
};

type StatusFilter = 'ALL' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

const STATUS_CONFIG: Record<StatusFilter, { label: string; color: string; bg: string; border: string }> = {
    ALL:     { label: 'All',     color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
    PENDING: { label: 'Pending', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    PARTIAL: { label: 'Partial', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    PAID:    { label: 'Paid',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    OVERDUE: { label: 'Overdue', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
};

export default function FeesTreeView({ studentGroups }: { studentGroups: StudentGroup[] }) {
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
    const [collapsedClasses, setCollapsedClasses]  = useState<Set<string>>(new Set());
    const [search, setSearch]           = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const now = new Date();

    const toggleStudent = (id: string) =>
        setExpandedStudents(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const toggleClass = (cls: string) =>
        setCollapsedClasses(prev => { const n = new Set(prev); n.has(cls) ? n.delete(cls) : n.add(cls); return n; });

    // Enrich with computed totals
    const enriched = useMemo(() => studentGroups.map(({ student, fees: raw }) => {
        const fees = raw.filter(f => f.amount > 0 || f.paidAmount > 0);
        const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
        const totalPaid   = fees.reduce((s, f) => s + f.paidAmount, 0);
        const totalDue    = totalAmount - totalPaid;
        const allPaid     = fees.length > 0 && fees.every(f => f.status === 'PAID');
        const somePaid    = !allPaid && fees.some(f => f.paidAmount > 0);
        const overallStatus: 'PAID' | 'PARTIAL' | 'PENDING' = allPaid ? 'PAID' : somePaid ? 'PARTIAL' : 'PENDING';
        const hasOverdue  = fees.some(f => f.status !== 'PAID' && new Date(f.dueDate) < now);
        const className   = student.class?.name ?? 'Unassigned';
        return { student, fees, totalAmount, totalPaid, totalDue, overallStatus, hasOverdue, className };
    }), [studentGroups]);

    // Unique classes sorted naturally
    const classes = useMemo(() => {
        const set = new Set(enriched.map(g => g.className));
        return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }, [enriched]);

    // Overall counts (ignores current filter — for pill badges)
    const counts = useMemo(() => {
        const valid = enriched.filter(g => g.fees.length > 0);
        return {
            total:   valid.length,
            pending: valid.filter(g => g.overallStatus === 'PENDING').length,
            partial: valid.filter(g => g.overallStatus === 'PARTIAL').length,
            paid:    valid.filter(g => g.overallStatus === 'PAID').length,
            overdue: valid.filter(g => g.hasOverdue).length,
        };
    }, [enriched]);

    // Filtered list
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return enriched.filter(g => {
            if (g.fees.length === 0) return false;
            if (q) {
                const name = `${g.student.firstName} ${g.student.lastName}`.toLowerCase();
                if (!name.includes(q) && !g.student.admissionNo.toLowerCase().includes(q)) return false;
            }
            if (classFilter && g.className !== classFilter) return false;
            if (statusFilter === 'OVERDUE')    { if (!g.hasOverdue) return false; }
            else if (statusFilter !== 'ALL')   { if (g.overallStatus !== statusFilter) return false; }
            return true;
        });
    }, [enriched, search, classFilter, statusFilter]);

    // Group by class
    const groupedByClass = useMemo(() => {
        const map = new Map<string, typeof filtered>();
        filtered.forEach(g => {
            if (!map.has(g.className)) map.set(g.className, []);
            map.get(g.className)!.push(g);
        });
        return Array.from(map.entries()).sort(([a], [b]) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [filtered]);

    if (studentGroups.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No fee records found. Assign fees to students to get started.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── Filter Bar ── */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>

                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search name or admission no..."
                        style={{ width: '100%', paddingLeft: '2.2rem', paddingRight: search ? '2rem' : '0.75rem', paddingTop: '0.55rem', paddingBottom: '0.55rem', border: '1.5px solid #e2e8f0', borderRadius: '0.625rem', fontSize: '0.82rem', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#0f172a' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: '0.1rem' }}>
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Class dropdown */}
                <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    style={{ padding: '0.55rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '0.625rem', background: '#f8fafc', fontSize: '0.82rem', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {(['ALL', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] as const).map(s => {
                        const cfg = STATUS_CONFIG[s];
                        const active = statusFilter === s;
                        const n = s === 'ALL' ? counts.total : counts[s.toLowerCase() as keyof typeof counts];
                        return (
                            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.35rem 0.7rem', borderRadius: '999px', border: `1.5px solid ${active ? cfg.border : '#e2e8f0'}`, background: active ? cfg.bg : 'white', color: active ? cfg.color : '#64748b', fontSize: '0.72rem', fontWeight: active ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.12s' }}>
                                {cfg.label}
                                <span style={{ background: active ? cfg.color : '#e2e8f0', color: active ? 'white' : '#64748b', borderRadius: '999px', padding: '0 0.35rem', fontSize: '0.62rem', fontWeight: 700, minWidth: '1.2rem', textAlign: 'center' }}>
                                    {n}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={12} /> {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* ── Content ── */}
            {groupedByClass.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem', fontSize: '0.875rem' }}>
                    No students match the current filters.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {groupedByClass.map(([className, students]) => {
                        const isCollapsed   = collapsedClasses.has(className);
                        const classDue      = students.reduce((s, g) => s + g.totalDue, 0);
                        const classFee      = students.reduce((s, g) => s + g.totalAmount, 0);
                        const paidCount     = students.filter(g => g.overallStatus === 'PAID').length;
                        const pendingCount  = students.filter(g => g.overallStatus !== 'PAID').length;

                        return (
                            <div key={className} style={{ border: '1px solid #e2e8f0', borderRadius: '0.875rem', overflow: 'hidden', background: 'white' }}>

                                {/* Class header */}
                                <div
                                    onClick={() => toggleClass(className)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer', background: isCollapsed ? 'white' : '#f8fafc', borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0', userSelect: 'none' }}
                                >
                                    <span style={{ color: '#2563eb', flexShrink: 0 }}>
                                        {isCollapsed ? <ChevronRight size={17} /> : <ChevronDown size={17} />}
                                    </span>
                                    <GraduationCap size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{className}</span>

                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '0.15rem 0.55rem', fontWeight: 600 }}>
                                            {students.length} students
                                        </span>
                                        {paidCount > 0 && (
                                            <span style={{ fontSize: '0.7rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '0.15rem 0.55rem', fontWeight: 600 }}>
                                                {paidCount} paid
                                            </span>
                                        )}
                                        {pendingCount > 0 && (
                                            <span style={{ fontSize: '0.7rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '999px', padding: '0.15rem 0.55rem', fontWeight: 600 }}>
                                                {pendingCount} pending
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.75rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Fee</div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>₹{classFee.toLocaleString('en-IN')}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Due</div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: classDue > 0 ? '#dc2626' : '#16a34a' }}>₹{classDue.toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Students */}
                                {!isCollapsed && (
                                    <div>
                                        {/* Column header */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', padding: '0.4rem 1.25rem', fontSize: '0.67rem', fontWeight: 700, color: '#94a3b8', gap: '1rem', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                            <div>Student</div><div>Total</div><div>Paid</div><div>Due</div><div>Status</div><div>Items</div><div></div>
                                        </div>

                                        {students.map(({ student, fees, totalAmount, totalPaid, totalDue, overallStatus, hasOverdue }) => {
                                            const sCfg   = STATUS_CONFIG[overallStatus];
                                            const isOpen = expandedStudents.has(student.id);

                                            return (
                                                <div key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    {/* Student row */}
                                                    <div
                                                        onClick={() => toggleStudent(student.id)}
                                                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', alignItems: 'center', padding: '0.8rem 1.25rem', cursor: 'pointer', background: isOpen ? '#eff6ff' : 'white', gap: '1rem', userSelect: 'none', transition: 'background 0.12s' }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ color: isOpen ? '#2563eb' : '#cbd5e1', flexShrink: 0 }}>
                                                                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                                            </span>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                    {student.firstName} {student.lastName}
                                                                    {hasOverdue && (
                                                                        <span style={{ fontSize: '0.58rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '999px', padding: '0.05rem 0.35rem', fontWeight: 700 }}>
                                                                            OVERDUE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{student.admissionNo}</div>
                                                            </div>
                                                        </div>

                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#16a34a' }}>₹{totalPaid.toLocaleString('en-IN')}</div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: totalDue > 0 ? '#dc2626' : '#94a3b8' }}>₹{totalDue.toLocaleString('en-IN')}</div>

                                                        <div>
                                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, background: sCfg.bg, color: sCfg.color, border: `1px solid ${sCfg.border}` }}>
                                                                {overallStatus}
                                                            </span>
                                                        </div>

                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fees.length} item{fees.length !== 1 ? 's' : ''}</div>

                                                        <div onClick={e => e.stopPropagation()}>
                                                            <Link href={`/fees/collect/${student.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                                                <CreditCard size={12} /> Collect
                                                            </Link>
                                                        </div>
                                                    </div>

                                                    {/* Fee breakdown */}
                                                    {isOpen && (
                                                        <div style={{ borderTop: '1px solid #e2e8f0', background: '#fafeff' }}>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                                <thead>
                                                                    <tr style={{ background: '#f8fafc' }}>
                                                                        {['Fee Type', 'Original', 'Discount', 'Final', 'Paid', 'Due', 'Due Date', 'Status', 'Actions'].map(h => (
                                                                            <th key={h} style={{ padding: '0.5rem 1rem', fontWeight: 600, color: '#64748b', textAlign: h === 'Fee Type' ? 'left' : h === 'Actions' || h === 'Status' || h === 'Due Date' ? 'center' : 'right', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.05em', ...(h === 'Fee Type' ? { paddingLeft: '1.5rem' } : {}) }}>
                                                                                {h}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {fees.map(fee => {
                                                                        const due       = fee.amount - fee.paidAmount;
                                                                        const isOverdue = fee.status !== 'PAID' && new Date(fee.dueDate) < now;
                                                                        const fCfg      = STATUS_CONFIG[fee.status as StatusFilter] ?? STATUS_CONFIG.PENDING;
                                                                        return (
                                                                            <tr key={fee.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                                                <td style={{ padding: '0.55rem 1rem 0.55rem 1.5rem', fontWeight: 600, color: '#334155' }}>
                                                                                    {FEE_TYPE_LABELS[fee.type] || fee.type}
                                                                                </td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#94a3b8' }}>
                                                                                    ₹{(fee.originalAmount > 0 ? fee.originalAmount : fee.amount).toLocaleString('en-IN')}
                                                                                </td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'right' }}>
                                                                                    {fee.discountAmount > 0
                                                                                        ? <span style={{ color: '#dc2626', fontWeight: 600 }} title={fee.discountReason || ''}>−₹{fee.discountAmount.toLocaleString('en-IN')}</span>
                                                                                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                                                </td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{fee.amount.toLocaleString('en-IN')}</td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>₹{fee.paidAmount.toLocaleString('en-IN')}</td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'right', color: due > 0 ? '#dc2626' : '#94a3b8', fontWeight: due > 0 ? 700 : 400 }}>₹{due.toLocaleString('en-IN')}</td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'center', color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 700 : 400 }}>
                                                                                    {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                                    {isOverdue && <div style={{ fontSize: '0.58rem', color: '#dc2626', fontWeight: 700 }}>OVERDUE</div>}
                                                                                </td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'center' }}>
                                                                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 700, background: fCfg.bg, color: fCfg.color, border: `1px solid ${fCfg.border}` }}>
                                                                                        {fee.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '0.55rem 1rem', textAlign: 'center' }}>
                                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                                        <Link href={`/fees/${fee.id}/edit`} style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                                            <Pencil size={11} /> Edit
                                                                                        </Link>
                                                                                        <Link href={`/fees/${fee.id}/discount`} style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                                            <Tag size={11} /> Discount
                                                                                        </Link>
                                                                                        {fee.status !== 'PAID' && (
                                                                                            <Link href={`/fees/${fee.id}/pay`} style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }}>Pay</Link>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
