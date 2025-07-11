import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('wallets')
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    userId: string;

    @Column({ unique: true })
    tonAddress: string;

    @Column({ unique: true })
    internalAddress: string;

    @Column()
    publicKey: string;

    @Column()
    privateKey: string;

    @Column({ type: 'real', default: 0 })
    balance: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => User, user => user.wallet)
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user: User;
}