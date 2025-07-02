export interface JwtPayload {
  sub: string; // معرف المستخدم
  telegramId?: string;
  username?: string;
  iat?: number; // تاريخ الإصدار
  exp?: number; // تاريخ الانتهاء
}

