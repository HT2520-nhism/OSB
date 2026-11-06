import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from '../user/user.entity';
import {
  BackofficePermissionPayload,
  JwtPayload,
} from '../constants/types/jwt-payload.type';
import { Logger } from '../services/logger.service';
import { config } from '../config';
import { verifyPassword } from '../helpers/password-crypto';
import { normalizeLoginUsername } from '../helpers/user-login-username';

const USER_JWT_RELATIONS = [
  'company',
  'department',
  'backofficeRoles',
  'backofficeRoles.department',
  'backofficeRoles.department.company',
] as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly jwks = createRemoteJWKSet(
    new URL(
      `https://login.microsoftonline.com/${config.MICROSOFT_AUTH.TENANT_ID}/discovery/v2.0/keys`,
    ),
  );

  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  private buildPermissions(
    user: UserEntity | null,
  ): BackofficePermissionPayload[] {
    return (
      user?.backofficeRoles?.map((r) => ({
        companyId: r.department?.company?.id ?? null,
        companyName: r.department?.company?.name ?? null,
        departmentId: r.department?.id ?? null,
        departmentName: r.department?.name ?? null,
        role: r.role,
      })) ?? []
    );
  }

  private buildJwtPayload(user: UserEntity): JwtPayload {
    const permissions = this.buildPermissions(user);
    return {
      userId: user.id,
      name: user.name,
      gender: user.gender,
      email: user.email,
      dob: user.dateOfBirth,
      roles: user.backofficeRoles?.map((r) => r.role) ?? [],
      companyName: user.company?.name,
      departmentName: user.department?.name,
      permissions,
    };
  }

  private async loadUserForJwt(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: [...USER_JWT_RELATIONS],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Verify Microsoft Entra ID login via ID Token
   * Return internal JWT if valid
   */
  async login(token: string) {
    let payload;

    try {
      const result = await jwtVerify(token, this.jwks, {
        audience: config.MICROSOFT_AUTH.CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${config.MICROSOFT_AUTH.TENANT_ID}/v2.0`,
      });

      payload = result.payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    const email = payload.email as string;
    const name = payload.name as string;

    const allowedDomains = Array.isArray(config.MICROSOFT_AUTH.ALLOWED_DOMAINS)
      ? config.MICROSOFT_AUTH.ALLOWED_DOMAINS
      : config.MICROSOFT_AUTH.ALLOWED_DOMAINS.split(',').map((d) => d.trim());

    const isAllowed = allowedDomains.some((domain) =>
      email.toLowerCase().endsWith(`@${domain.toLowerCase()}`),
    );

    if (!isAllowed) {
      throw new UnauthorizedException('Email domain not allowed');
    }

    this.logger.log({
      email,
      name,
      message: '[loginMicrosoft] User login',
    });

    let user = await this.userRepo.findOne({
      where: { email },
      relations: [...USER_JWT_RELATIONS],
    });

    if (!user) {
      this.logger.log({
        email,
        name,
        message: '[login] User does not exist, create one',
      });

      const newUser = new UserEntity(name, email);
      await this.userRepo.save(newUser);
      user = await this.userRepo.findOne({
        where: { email },
        relations: [...USER_JWT_RELATIONS],
      });
    }

    if (!user) {
      throw new UnauthorizedException('Could not load user');
    }

    this.logger.log({
      userId: user.id,
      message: '[login] Create jwt token for user',
    });

    const jwtPayload = this.buildJwtPayload(user);
    return {
      token: this.jwtService.sign(jwtPayload),
    };
  }

  /**
   * Đăng nhập bằng email hoặc tên đăng nhập + mật khẩu (ứng dụng di động / tích hợp).
   */
  async loginWithPassword(identifier: string, password: string) {
    const idTrim = (identifier ?? '').trim();
    if (!idTrim || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const normalizedUser = normalizeLoginUsername(idTrim);
    const looksLikeEmail = idTrim.includes('@');

    // Dùng tên thuộc tính entity (passwordHash, loginUsername) — snake_case trong addSelect/where
    // dễ khiến TypeORM không map cột → passwordHash luôn undefined → 401.
    const qb = this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash');

    if (looksLikeEmail) {
      qb.where('LOWER(user.email) = LOWER(:email)', { email: idTrim });
    } else {
      qb.where('user.loginUsername = :u', { u: normalizedUser });
    }

    const row = await qb.getOne();

    if (!row?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.loadUserForJwt(row.id);
    const jwtPayload = this.buildJwtPayload(user);

    this.logger.log({
      userId: user.id,
      message: '[loginWithPassword] JWT issued',
    });

    return {
      token: this.jwtService.sign(jwtPayload),
    };
  }
}
