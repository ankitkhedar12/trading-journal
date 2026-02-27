export const getBaseUrl = () => {
    // If the VITE_PUBLIC_API_URL environment variable is present, use it
    if (import.meta.env.VITE_PUBLIC_API_URL) {
        return import.meta.env.VITE_PUBLIC_API_URL;
    }

    // Otherwise fallback to local development URL
    return 'http://localhost:3000';
};
