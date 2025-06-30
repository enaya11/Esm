export interface JwtPayload {
  sub: string; // معرف المستخدم
  telegramId?: number;
  username?: string;
  iat?: number; // تاريخ الإصدار
  exp?: number; // تاريخ الانتهاء
}

