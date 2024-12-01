interface TokenMetadata {
    tokenRef: string;
    fullUri: string;
    audioUri: string;
    timestamp: number;
}

// For development, we'll use localStorage. In production, replace with a real database.
export class TokenDatabase {
    private static STORAGE_KEY = 'token_metadata';

    static saveTokenMetadata(metadata: Omit<TokenMetadata, 'timestamp'>): void {
        const existing = this.getAllTokens();
        const newMetadata = {
            ...metadata,
            timestamp: Date.now()
        };
        
        existing.push(newMetadata);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    }

    static getTokenByRef(tokenRef: string): TokenMetadata | null {
        const tokens = this.getAllTokens();
        return tokens.find(t => t.tokenRef === tokenRef) || null;
    }

    static getAllTokens(): TokenMetadata[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    static getFullUri(tokenRef: string): string | null {
        const token = this.getTokenByRef(tokenRef);
        return token ? token.fullUri : null;
    }
} 