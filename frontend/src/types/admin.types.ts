/** Top-line dashboard counts. `mrrCents` is Monthly Recurring Revenue in euro cents. */
export interface IAdminStats {
    users: number;
    stories: number;
    activePaidSubscriptions: number;
    mrrCents: number;
}
