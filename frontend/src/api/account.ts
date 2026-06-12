import { getApiBaseUrl, ApiError } from '@/lib/api';

export const accountApi = {
    /** Downloads the GDPR data export as a JSON file. */
    exportData: async (): Promise<void> => {
        const response = await fetch(`${getApiBaseUrl()}/me/export`, {
            credentials: 'include',
        });
        if (!response.ok) {
            throw new ApiError(response.status, 'Export failed');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tailortales-export.json';
        link.click();
        URL.revokeObjectURL(url);
    },

    /** Irreversible account deletion — cancels billing, removes all data. */
    deleteAccount: async (): Promise<void> => {
        const response = await fetch(`${getApiBaseUrl()}/me`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!response.ok) {
            throw new ApiError(response.status, 'Account deletion failed');
        }
    },
};
