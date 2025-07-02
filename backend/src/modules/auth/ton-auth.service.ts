import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import * as nacl from 'tweetnacl';
import * as base64 from 'tweetnacl-util';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class TonAuthService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  /**
   * التحقق من توقيع محفظة TON
   */
  async verifyTonSignature(data: {
    walletAddress: string;
    publicKey: string;
    signature: string;
    payload: any;
  }): Promise<{ success: boolean; user?: any; token?: string; message?: string }> {
    try {
      // التحقق من صحة البيانات
      if (!data.walletAddress || !data.publicKey || !data.signature || !data.payload) {
        return { success: false, message: 'بيانات غير كاملة' };
      }

      // التحقق من صحة العنوان
      const isValidAddress = this.validateTonAddress(data.walletAddress);
      if (!isValidAddress) {
        return { success: false, message: 'عنوان محفظة غير صالح' };
      }

      // التحقق من صحة المفتاح العام
      const isValidPublicKey = this.validatePublicKey(data.publicKey);
      if (!isValidPublicKey) {
        return { success: false, message: 'مفتاح عام غير صالح' };
      }

      // التحقق من صحة التوقيع
      const isValidSignature = await this.verifySignature(
        data.signature,
        data.publicKey,
        data.payload,
      );

      if (!isValidSignature) {
        return { success: false, message: 'توقيع غير صالح' };
      }

      // تم إزالة UsersService و WalletsService من هذا الملف، لذا يجب التعامل مع منطق المستخدم والمحفظة هنا مباشرةً أو إعادة هيكلة الوحدات.
      // For now, returning success: false as the user/wallet logic is missing.
      return { success: false, message: 'وظيفة المستخدم والمحفظة غير متوفرة في TonAuthService' };
    } catch (error) {
      console.error('خطأ في التحقق من توقيع TON:', error);
      return { success: false, message: 'حدث خطأ أثناء التحقق من التوقيع' };
    }
  }

  /**
   * التحقق من صحة عنوان محفظة TON
   */
  private validateTonAddress(address: string): boolean {
    // التحقق من أن العنوان يبدأ بـ EQ أو UQ
    if (!address.startsWith('EQ') && !address.startsWith('UQ')) {
      return false;
    }

    // التحقق من طول العنوان
    if (address.length !== 48) {
      return false;
    }

    // التحقق من أن العنوان يحتوي على أحرف وأرقام صالحة فقط
    const validChars = /^[A-Za-z0-9_-]+$/;
    if (!validChars.test(address)) {
      return false;
    }

    return true;
  }

  /**
   * التحقق من صحة المفتاح العام
   */
  private validatePublicKey(publicKey: string): boolean {
    // التحقق من طول المفتاح العام
    if (publicKey.length !== 64) {
      return false;
    }

    // التحقق من أن المفتاح العام يحتوي على أحرف وأرقام صالحة فقط
    const validChars = /^[A-Fa-f0-9]+$/;
    if (!validChars.test(publicKey)) {
      return false;
    }

    return true;
  }

  /**
   * التحقق من صحة التوقيع
   */
  private async verifySignature(
    signature: string,
    publicKey: string,
    payload: any,
  ): Promise<boolean> {
    try {
      // تحويل المفتاح العام والتوقيع إلى مصفوفات بايت
      const publicKeyBytes = Buffer.from(publicKey, 'hex');
      const signatureBytes = Buffer.from(signature, 'base64');

      // إنشاء رسالة للتوقيع
      const message = this.createMessageForSigning(payload);
      const messageBytes = Buffer.from(message);

      // التحقق من التوقيع باستخدام مكتبة tweetnacl
      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes,
      );
    } catch (error) {
      console.error('خطأ في التحقق من التوقيع:', error);
      return false;
    }
  }

  /**
   * إنشاء رسالة للتوقيع
   */
  private createMessageForSigning(payload: any): string {
    // إنشاء رسالة بتنسيق محدد للتوقيع
    const prefix = 'ton-connect';
    const domain = payload.domain || 'smartcoin-app.com';
    const timestamp = payload.timestamp || Date.now().toString();
    const sessionId = payload.sessionId || '';

    return `${prefix}:${domain}:${timestamp}:${sessionId}`;
  }

  /**
   * إنشاء توكن المصادقة
   */
  private generateAuthToken(user: any): string {
    // إنشاء توكن بسيط للمصادقة
    const payload = {
      id: user.id,
      walletAddress: user.walletAddress,
      timestamp: Date.now(),
    };

    // توقيع التوكن باستخدام مفتاح سري
    const secret = process.env.JWT_SECRET || 'smartcoin-secret-key';
    const token = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return `${token}.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }

  /**
   * الحصول على معلومات المحفظة من API
   */
  async getWalletInfo(address: string): Promise<any> {
    try {
      // استخدام API لاسترجاع معلومات المحفظة
      const response = await firstValueFrom(
        this.httpService.get(`https://toncenter.com/api/v2/getAddressInformation?address=${address}`),
      );

      return (response as any).data;
    } catch (error) {
      console.error('خطأ في الحصول على معلومات المحفظة:', error);
      return null;
    }
  }

  /**
   * معالجة اتصال محفظة TON
   */
  async handleTonConnect(data: {
    walletAddress: string;
    publicKey: string;
    timestamp: number;
  }): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      // التحقق من صحة البيانات
      if (!data.walletAddress || !data.publicKey) {
        return { success: false, message: 'بيانات غير كاملة' };
      }

      // تم إزالة UsersService و WalletsService من هذا الملف، لذا يجب التعامل مع منطق المستخدم والمحفظة هنا مباشرةً أو إعادة هيكلة الوحدات.
      // For now, returning success: false as the user/wallet logic is missing.
      return { success: false, message: 'وظيفة المستخدم والمحفظة غير متوفرة في TonAuthService' };
    } catch (error) {
      console.error('خطأ في معالجة اتصال TON:', error);
      return { success: false, message: 'حدث خطأ أثناء معالجة الاتصال' };
    }
  }
}

