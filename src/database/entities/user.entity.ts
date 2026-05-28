import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index('UQ_user_phone_tenant_partial', ['phoneNumber', 'tenantId'], { unique: true })
export class User extends Base {
  // ── Tenant (multi-tenancy) ───────────────────────────────────────────────
  @Column({ name: 'institute_id', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  tenant: Tenant;

  // ── Identity ─────────────────────────────────────────────────────────────
  @Column({ name: 'phone', nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'name', nullable: true })
  fullName: string;

  @Column({ name: 'photo', nullable: true })
  profilePictureUrl: string;

  // ── Auth ──────────────────────────────────────────────────────────────────
  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ name: 'phone_verified', type: 'boolean', default: true })
  phoneVerified: boolean = true;

  @Column({ name: 'email_verified', type: 'boolean', default: true })
  emailVerified: boolean = true;

  @Column({ name: 'is_first_login', type: 'boolean', default: false })
  isFirstLogin: boolean = false;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date = new Date();

  // ── Role & Status ─────────────────────────────────────────────────────────
  @Column({ type: 'varchar', default: UserRole.STUDENT })
  role: UserRole;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: true,
    transformer: {
      to: (value: UserStatus) => value === UserStatus.ACTIVE,
      from: (value: boolean) => value ? UserStatus.ACTIVE : UserStatus.INACTIVE,
    }
  })
  status: UserStatus;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken: string = '';

  @Column({ name: 'notification_prefs', type: 'jsonb', nullable: true })
  notificationPrefs = { push: true, whatsapp: true, email: false, sms: false };

  @Column({ name: 'fcm_token', type: 'varchar', nullable: true })
  fcmToken: string = '';

  // ── Hooks ─────────────────────────────────────────────────────────────────
  @BeforeInsert()
  async fillDefaultsAndHashPassword() {
    if (!this.fullName) {
      const roleStr = String(this.role || '');
      this.fullName = roleStr ? (roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase()) : 'User';
    }
    if (!this.email) {
      this.email = `${this.phoneNumber?.replace(/[^0-9]/g, '') || Date.now()}@eddva.local`;
    }
    if (!this.password) {
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      this.password = await bcrypt.hash(tempPassword, 12);
    } else if (!this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(plain: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(plain, this.password);
  }

  async hashRefreshToken(token: string) {
    this.refreshToken = await bcrypt.hash(token, 10);
  }

  async validateRefreshToken(token: string): Promise<boolean> {
    if (!this.refreshToken) return false;
    return bcrypt.compare(token, this.refreshToken);
  }
}