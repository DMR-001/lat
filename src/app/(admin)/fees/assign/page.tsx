import AssignFeeForm from './AssignFeeForm';

export default function AssignFeePage() {
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Assign Fee</h1>
            <AssignFeeForm />
        </div>
    );
}
