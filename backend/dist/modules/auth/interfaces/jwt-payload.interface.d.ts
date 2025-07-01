export interface JwtPayload {
    sub: string;
    telegramId?: number;
    username?: string;
    iat?: number;
    exp?: number;
}
