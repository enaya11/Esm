import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { Wallet } from './schemas/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<Wallet>,
  ) {}

  /**
   * إنشاء محفظة جديدة للمستخدم
   */
  async createWallet(userId: string, tonAddress: string): Promise<Wallet> {
    try {
      // إنشاء عنوان محفظة داخلي جديد
      const internalAddress = this.generateInternalAddress();
      
      // إنشاء مفاتيح المحفظة
      const { publicKey, privateKey } = this.generateWalletKeys();
      
      // إنشاء محفظة جديدة
      const newWallet = new this.walletModel({
        userId,
        tonAddress,
        internalAddress,
        publicKey,
        privateKey: this.encryptPrivateKey(privateKey), // تشفير المفتاح الخاص
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // حفظ المحفظة في قاعدة البيانات
      return await newWallet.save();
    } catch (error) {
      console.error('خطأ في إنشاء محفظة جديدة:', error);
      throw new Error('فشل في إنشاء محفظة جديدة');
    }
  }

  /**
   * الحصول على محفظة المستخدم
   */
  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    try {
      return await this.walletModel.findOne({ userId }).exec();
    } catch (error) {
      console.error('خطأ في الحصول على محفظة المستخدم:', error);
      throw new Error('فشل في الحصول على محفظة المستخدم');
    }
  }

  /**
   * الحصول على محفظة بواسطة عنوان TON
   */
  async getWalletByTonAddress(tonAddress: string): Promise<Wallet | null> {
    try {
      return await this.walletModel.findOne({ tonAddress }).exec();
    } catch (error) {
      console.error('خطأ في الحصول على محفظة بواسطة عنوان TON:', error);
      throw new Error('فشل في الحصول على محفظة بواسطة عنوان TON');
    }
  }

  /**
   * تحديث محفظة المستخدم
   */
  async updateWallet(userId: string, updateWalletDto: UpdateWalletDto): Promise<Wallet> {
    try {
      const wallet = await this.walletModel.findOne({ userId }).exec();
      
      if (!wallet) {
        throw new Error('المحفظة غير موجودة');
      }
      
      // تحديث بيانات المحفظة
      Object.assign(wallet, {
        ...updateWalletDto,
        updatedAt: new Date(),
      });
      
      return await wallet.save();
    } catch (error) {
      console.error('خطأ في تحديث محفظة المستخدم:', error);
      throw new Error('فشل في تحديث محفظة المستخدم');
    }
  }

  /**
   * تحديث رصيد المحفظة
   */
  async updateBalance(userId: string, amount: number): Promise<Wallet> {
    try {
      const wallet = await this.walletModel.findOne({ userId }).exec();
      
      if (!wallet) {
        throw new Error('المحفظة غير موجودة');
      }
      
      // تحديث الرصيد
      wallet.balance += amount;
      wallet.updatedAt = new Date();
      
      return await wallet.save();
    } catch (error) {
      console.error('خطأ في تحديث رصيد المحفظة:', error);
      throw new Error('فشل في تحديث رصيد المحفظة');
    }
  }

  /**
   * إنشاء عنوان محفظة داخلي جديد
   */
  private generateInternalAddress(): string {
    // إنشاء عنوان محفظة داخلي بتنسيق معين
    const prefix = 'SC'; // SmartCoin
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now().toString(36);
    
    return `${prefix}_${randomBytes}_${timestamp}`;
  }

  /**
   * إنشاء مفاتيح المحفظة
   */
  private generateWalletKeys(): { publicKey: string; privateKey: string } {
    // إنشاء زوج مفاتيح جديد
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    
    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * تشفير المفتاح الخاص
   */
  private encryptPrivateKey(privateKey: string): string {
    // تشفير المفتاح الخاص باستخدام مفتاح سري
    const secret = process.env.ENCRYPTION_KEY || 'smartcoin-encryption-key';
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.createHash('sha256').update(secret).digest(),
      Buffer.alloc(16, 0) // Initialization vector (IV) - should be securely generated and stored
    );
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  /**
   * فك تشفير المفتاح الخاص
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    // فك تشفير المفتاح الخاص باستخدام المفتاح السري
    const secret = process.env.ENCRYPTION_KEY || 'smartcoin-encryption-key';
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.createHash('sha256').update(secret).digest(),
      Buffer.alloc(16, 0) // Initialization vector (IV) - should be securely generated and stored
    );
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

