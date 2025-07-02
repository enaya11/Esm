export interface JwtPayload {
    sub: string;
    telegramId?: string;
    username?: string;
    iat?: number;
    exp?: number;
}
