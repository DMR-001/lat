'use client';

import { useEffect } from 'react';

export default function PopupClosePage() {
    useEffect(() => {
        // Just close the popup — parent collect page is polling status independently
        window.close();
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b', fontSize: '0.875rem' }}>
            Processing... this window will close automatically.
        </div>
    );
}
