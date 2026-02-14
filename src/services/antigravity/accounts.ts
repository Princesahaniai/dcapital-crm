// MOCK SERVICE - In production, this hits https://api.antigravity.co/v1/accounts

const DELAY = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SocialAccount {
    id: string;
    platform: 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter';
    username: string;
    avatar: string;
    status: 'connected' | 'disconnected' | 'expired';
    last_synced: string;
    followers: number;
}

const MOCK_ACCOUNTS: SocialAccount[] = [
    {
        id: 'acc_ig_1',
        platform: 'instagram',
        username: 'dcapital_realestate',
        avatar: 'https://ui-avatars.com/api/?name=D+C&background=E1306C&color=fff',
        status: 'connected',
        last_synced: new Date().toISOString(),
        followers: 12500
    },
    {
        id: 'acc_tk_1',
        platform: 'tiktok',
        username: 'dcapital_dubai',
        avatar: 'https://ui-avatars.com/api/?name=D+C&background=000&color=fff',
        status: 'connected',
        last_synced: new Date().toISOString(),
        followers: 45200
    },
    {
        id: 'acc_li_1',
        platform: 'linkedin',
        username: 'D-Capital Real Estate',
        avatar: 'https://ui-avatars.com/api/?name=D+C&background=0077b5&color=fff',
        status: 'disconnected', // User needs to connect this
        last_synced: '2023-10-01T10:00:00Z',
        followers: 890
    }
];

export const getConnectedAccounts = async (): Promise<SocialAccount[]> => {
    await DELAY(800);
    return MOCK_ACCOUNTS;
};

export const connectAccount = async (platform: string): Promise<SocialAccount> => {
    await DELAY(2000); // Simulate OAuth popup
    return {
        id: `acc_${platform}_new`,
        platform: platform as any,
        username: `dcapital_${platform}`,
        avatar: `https://ui-avatars.com/api/?name=D+C&background=random&color=fff`,
        status: 'connected',
        last_synced: new Date().toISOString(),
        followers: 0
    };
};
