export const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false';
export const localDate = () => new Date().toLocaleDateString('sv-SE');
