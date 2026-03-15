// Helper function to trigger header refresh after creating branches or academic years
export function refreshHeader() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('header-refresh'));
    }
}
