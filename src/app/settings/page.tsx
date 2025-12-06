import { getClasses } from '@/app/actions/class';
import ClassManager from './ClassManager';

export default async function SettingsPage() {
    const classes = await getClasses();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Settings</h1>
            <ClassManager classes={classes} />
        </div>
    );
}
