'use client';

import { useState, useTransition, useEffect } from 'react';
import {
    MessageSquare, Bell, History, Send, RefreshCw,
    CheckCircle, XCircle, Loader2, Filter,
    AlertTriangle, Phone, Building2
} from 'lucide-react';
import {
    getStudentsWithPendingFees,
    sendFeeReminders,
    sendBulkFeeReminders,
    sendBroadcastNotice,
    getSmsLogs,
} from '@/app/actions/sms';

type Tab = 'reminders' | 'notice' | 'history';

const Rs = '\u20B9';

export default function CommunicationsClient({
    branches,
    classes,
    initialLogs,
    initialLogsTotal,
    defaultBranchId,
}: {
    branches: { id: string; name: string; code: string }[];
    classes: { id: string; name: string; section: string | null }[];
    initialLogs: any[];
    initialLogsTotal: number;
    defaultBranchId: string;
}) {
    const [tab, setTab] = useState<Tab>('reminders');
    const [isPending, startTransition] = useTransition();

    // ── Fee Reminders Tab ──────────────────────────────────────
    const [reminderBranch, setReminderBranch] = useState(defaultBranchId);
    const [reminderClass, setReminderClass] = useState('');
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [reminderResult, setReminderResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
    const [isSendingAll, setIsSendingAll] = useState(false);
    const [isSendingSelected, setIsSendingSelected] = useState(false);
    const [perRowSending, setPerRowSending] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // ── Notice Tab ─────────────────────────────────────────────
    const [noticeBranch, setNoticeBranch] = useState(defaultBranchId);
    const [noticeClass, setNoticeClass] = useState('');
    const [noticeText, setNoticeText] = useState('');
    const [isSendingNotice, setIsSendingNotice] = useState(false);
    const [noticeResult, setNoticeResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

    // ── History Tab ────────────────────────────────────────────
    const [logs, setLogs] = useState(initialLogs);
    const [logsTotal, setLogsTotal] = useState(initialLogsTotal);
    const [logPage, setLogPage] = useState(1);
    const [logTypeFilter, setLogTypeFilter] = useState('ALL');
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Load students when filters change
    useEffect(() => {
        setIsLoadingStudents(true);
        setSelectedStudentIds(new Set());
        getStudentsWithPendingFees({
            branchId: reminderBranch || undefined,
            classId: reminderClass || undefined,
            overdueOnly,
            search: search || undefined,
        }).then(setStudents).finally(() => setIsLoadingStudents(false));
    }, [reminderBranch, reminderClass, overdueOnly, search]);

    const toggleSelectStudent = (id: string) => {
        setSelectedStudentIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        }
    };

    const handleSendToSelected = async () => {
        if (selectedStudentIds.size === 0) return;
        setIsSendingSelected(true);
        try {
            const results = await sendFeeReminders([...selectedStudentIds]);
            const sent = results.filter(r => r.success).length;
            const failed = results.length - sent;
            setReminderResult({ sent, failed, total: results.length });
            showToast(`Sent ${sent} reminders${failed > 0 ? `, ${failed} failed` : ''}`, sent > 0 ? 'success' : 'error');
        } catch {
            showToast('Failed to send reminders', 'error');
        } finally {
            setIsSendingSelected(false);
        }
    };

    const handleSendAll = async () => {
        setIsSendingAll(true);
        setReminderResult(null);
        try {
            const result = await sendBulkFeeReminders({
                branchId: reminderBranch || undefined,
                classId: reminderClass || undefined,
                overdueOnly,
            });
            setReminderResult(result);
            showToast(`Sent ${result.sent} reminders${result.failed > 0 ? `, ${result.failed} failed` : ''}`, result.sent > 0 ? 'success' : 'error');
        } catch {
            showToast('Failed to send bulk reminders', 'error');
        } finally {
            setIsSendingAll(false);
        }
    };

    const handleSendSingleReminder = async (studentId: string) => {
        setPerRowSending(prev => new Set([...prev, studentId]));
        try {
            const results = await sendFeeReminders([studentId]);
            const ok = results[0]?.success;
            showToast(ok ? 'Reminder sent!' : `Failed: ${results[0]?.reason ?? 'Unknown error'}`, ok ? 'success' : 'error');
        } catch {
            showToast('Failed to send reminder', 'error');
        } finally {
            setPerRowSending(prev => { const n = new Set(prev); n.delete(studentId); return n; });
        }
    };

    const handleSendNotice = async () => {
        if (!noticeText.trim()) return;
        setIsSendingNotice(true);
        setNoticeResult(null);
        try {
            const result = await sendBroadcastNotice(noticeText, {
                branchId: noticeBranch || undefined,
                classId: noticeClass || undefined,
            });
            setNoticeResult(result);
            showToast(`Notice sent to ${result.sent} parents${result.failed > 0 ? `, ${result.failed} failed` : ''}`, result.sent > 0 ? 'success' : 'error');
            if (result.sent > 0) setNoticeText('');
        } catch {
            showToast('Failed to send notice', 'error');
        } finally {
            setIsSendingNotice(false);
        }
    };

    const loadLogs = async (page: number, typeFilter: string) => {
        setIsLoadingLogs(true);
        try {
            const data = await getSmsLogs(page, 50, typeFilter);
            setLogs(data.logs);
            setLogsTotal(data.total);
            setLogPage(page);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const statusColor = (status: string) => {
        if (status === 'SENT') return '#16a34a';
        if (status === 'FAILED') return '#dc2626';
        return '#f59e0b';
    };

    const typeLabel: Record<string, string> = {
        REGISTRATION: 'Registration',
        FEE_COLLECTED: 'Fee Collected',
        FEE_REMINDER: 'Fee Reminder',
        NOTICE: 'Notice',
        OTP: 'OTP',
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                    background: toast.type === 'success' ? '#16a34a' : '#dc2626',
                    color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                    fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                        Communications
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Send SMS notifications and reminders to parents
                    </p>
                </div>
                {defaultBranchId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.625rem', padding: '0.4rem 0.875rem', fontSize: '0.82rem', fontWeight: 700, color: '#1d4ed8' }}>
                        <Building2 size={14} />
                        {branches.find(b => b.id === defaultBranchId)?.name ?? 'Current Branch'}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.75rem', width: 'fit-content' }}>
                {([
                    { key: 'reminders', icon: Bell, label: 'Fee Reminders' },
                    { key: 'notice', icon: MessageSquare, label: 'Broadcast Notice' },
                    { key: 'history', icon: History, label: 'SMS History' },
                ] as const).map(({ key, icon: Icon, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: tab === key ? 'white' : 'transparent',
                            color: tab === key ? '#1d4ed8' : '#64748b',
                            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── FEE REMINDERS TAB ── */}
            {tab === 'reminders' && (
                <div>
                    {/* Filters */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem', padding: '1.25rem', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Filter size={13} /> Filters
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            <select value={reminderClass} onChange={e => setReminderClass(e.target.value)} style={selectStyle}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="Search name / adm no..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ ...selectStyle, minWidth: 160 }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#475569', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                                <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
                                Overdue only
                            </label>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {isLoadingStudents ? 'Loading...' : `${students.length} student${students.length !== 1 ? 's' : ''} with pending fees`}
                            {selectedStudentIds.size > 0 && ` · ${selectedStudentIds.size} selected`}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {selectedStudentIds.size > 0 && (
                                <button onClick={handleSendToSelected} disabled={isSendingSelected} style={btnSecondary}>
                                    {isSendingSelected ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                    Send to Selected ({selectedStudentIds.size})
                                </button>
                            )}
                            <button onClick={handleSendAll} disabled={isSendingAll || students.length === 0} style={btnPrimary}>
                                {isSendingAll ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                Send All ({students.length})
                            </button>
                        </div>
                    </div>

                    {/* Result banner */}
                    {reminderResult && (
                        <div style={{ background: reminderResult.failed === 0 ? '#f0fdf4' : '#fef3c7', border: `1px solid ${reminderResult.failed === 0 ? '#86efac' : '#fcd34d'}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {reminderResult.failed === 0 ? <CheckCircle size={16} color="#16a34a" /> : <AlertTriangle size={16} color="#d97706" />}
                            Sent: {reminderResult.sent} &nbsp;|&nbsp; Failed: {reminderResult.failed} &nbsp;|&nbsp; Total: {reminderResult.total}
                        </div>
                    )}

                    {/* Students table */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem', overflow: 'hidden' }}>
                        {isLoadingStudents ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
                        ) : students.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No students with pending fees found.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={th}>
                                                <input type="checkbox" checked={selectedStudentIds.size === students.length && students.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16 }} />
                                            </th>
                                            <th style={{ ...th, textAlign: 'left' }}>Student</th>
                                            <th style={{ ...th, textAlign: 'left' }}>Class</th>
                                            <th style={{ ...th, textAlign: 'left' }}>Parent / Phone</th>
                                            <th style={{ ...th, textAlign: 'right' }}>Due Amount</th>
                                            <th style={th}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                                                <td style={{ ...td, textAlign: 'center' }}>
                                                    <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleSelectStudent(s.id)} style={{ width: 16, height: 16 }} />
                                                </td>
                                                <td style={td}>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{s.admissionNo}</div>
                                                </td>
                                                <td style={td}>{s.className}</td>
                                                <td style={td}>
                                                    <div style={{ fontWeight: 600, color: '#334155' }}>{s.parentName}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                        <Phone size={10} />{s.phone}
                                                    </div>
                                                </td>
                                                <td style={{ ...td, textAlign: 'right' }}>
                                                    <span style={{ fontWeight: 800, color: s.hasOverdue ? '#dc2626' : '#0f172a' }}>
                                                        {Rs}{s.totalDue.toLocaleString('en-IN')}
                                                    </span>
                                                    {s.hasOverdue && <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 700 }}>OVERDUE</div>}
                                                </td>
                                                <td style={{ ...td, textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleSendSingleReminder(s.id)}
                                                        disabled={perRowSending.has(s.id)}
                                                        title="Send reminder"
                                                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.35rem 0.75rem', cursor: 'pointer', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto' }}
                                                    >
                                                        {perRowSending.has(s.id) ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                                        Send
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── BROADCAST NOTICE TAB ── */}
            {tab === 'notice' && (
                <div>
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>
                            Audience
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <select value={noticeClass} onChange={e => setNoticeClass(e.target.value)} style={selectStyle}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Message
                        </div>
                        <textarea
                            value={noticeText}
                            onChange={e => setNoticeText(e.target.value.slice(0, 300))}
                            placeholder="Type your notice here... e.g. School will remain closed on 15th August for Independence Day"
                            rows={4}
                            style={{ width: '100%', padding: '0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.9rem', color: '#0f172a', background: '#f8fafc', outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.375rem', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{noticeText.length}/300 chars</span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Message will be: &ldquo;Dear Parent, {noticeText || '[your message]'} - Sprout School&rdquo;
                            </span>
                        </div>

                        {noticeResult && (
                            <div style={{ background: noticeResult.failed === 0 ? '#f0fdf4' : '#fef3c7', border: `1px solid ${noticeResult.failed === 0 ? '#86efac' : '#fcd34d'}`, borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {noticeResult.failed === 0 ? <CheckCircle size={16} color="#16a34a" /> : <AlertTriangle size={16} color="#d97706" />}
                                Sent: {noticeResult.sent} &nbsp;|&nbsp; Failed: {noticeResult.failed} &nbsp;|&nbsp; Total: {noticeResult.total}
                            </div>
                        )}

                        <button
                            onClick={handleSendNotice}
                            disabled={isSendingNotice || !noticeText.trim()}
                            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '0.875rem' }}
                        >
                            {isSendingNotice ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                            Send Notice to All Parents
                        </button>
                    </div>
                </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === 'history' && (
                <div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={logTypeFilter} onChange={e => { setLogTypeFilter(e.target.value); loadLogs(1, e.target.value); }} style={{ ...selectStyle, minWidth: 160 }}>
                            <option value="ALL">All Types</option>
                            <option value="REGISTRATION">Registration</option>
                            <option value="FEE_COLLECTED">Fee Collected</option>
                            <option value="FEE_REMINDER">Fee Reminder</option>
                            <option value="NOTICE">Notice</option>
                            <option value="OTP">OTP</option>
                        </select>
                        <button onClick={() => loadLogs(logPage, logTypeFilter)} disabled={isLoadingLogs} style={{ ...btnSecondary, padding: '0.5rem 0.875rem' }}>
                            {isLoadingLogs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Refresh
                        </button>
                        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#64748b' }}>
                            {logsTotal} total messages
                        </span>
                    </div>

                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.875rem', overflow: 'hidden' }}>
                        {isLoadingLogs ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: '#94a3b8' }} /></div>
                        ) : logs.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No SMS logs found.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ ...th, textAlign: 'left' }}>Date & Time</th>
                                            <th style={{ ...th, textAlign: 'left' }}>Type</th>
                                            <th style={{ ...th, textAlign: 'left' }}>Recipient</th>
                                            <th style={{ ...th, textAlign: 'left' }}>Message</th>
                                            <th style={th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log: any) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ ...td, whiteSpace: 'nowrap', color: '#64748b' }}>
                                                    {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={td}>
                                                    <span style={{ background: '#f1f5f9', borderRadius: '0.375rem', padding: '0.2rem 0.5rem', fontWeight: 700, fontSize: '0.72rem', color: '#475569' }}>
                                                        {typeLabel[log.type] ?? log.type}
                                                    </span>
                                                </td>
                                                <td style={{ ...td, fontFamily: 'monospace' }}>{log.recipient}</td>
                                                <td style={{ ...td, maxWidth: 280 }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }} title={log.message}>
                                                        {log.message}
                                                    </div>
                                                    {log.errorMessage && <div style={{ color: '#dc2626', fontSize: '0.68rem', marginTop: '0.15rem' }}>{log.errorMessage}</div>}
                                                </td>
                                                <td style={{ ...td, textAlign: 'center' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.72rem', color: statusColor(log.status), background: log.status === 'SENT' ? '#f0fdf4' : log.status === 'FAILED' ? '#fef2f2' : '#fffbeb', padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {logsTotal > 50 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                            <button onClick={() => loadLogs(logPage - 1, logTypeFilter)} disabled={logPage === 1 || isLoadingLogs} style={btnSecondary}>Prev</button>
                            <span style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#64748b' }}>Page {logPage} of {Math.ceil(logsTotal / 50)}</span>
                            <button onClick={() => loadLogs(logPage + 1, logTypeFilter)} disabled={logPage >= Math.ceil(logsTotal / 50) || isLoadingLogs} style={btnSecondary}>Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Shared styles ──────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
    padding: '0.6rem 0.875rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '0.625rem',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.82rem',
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '0.625rem',
    padding: '0.55rem 1rem',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
};

const btnSecondary: React.CSSProperties = {
    background: 'white',
    color: '#475569',
    border: '1.5px solid #e2e8f0',
    borderRadius: '0.625rem',
    padding: '0.55rem 1rem',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
};

const th: React.CSSProperties = {
    padding: '0.75rem 1rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
    padding: '0.75rem 1rem',
    color: '#334155',
    verticalAlign: 'middle',
};
