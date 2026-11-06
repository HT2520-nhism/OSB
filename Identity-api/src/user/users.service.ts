import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Logger } from '../services/logger.service';
import { UserEntity, DEFAULT_SELECTED_FIELDS } from './user.entity';
import { transformSelectFields } from '../helpers/transform-select-fields';
import { GetUsersQueries, USERS_LIST_MAX_PAGE_SIZE } from './dto/get-users.dto';
import { applyUserListFilters } from '../helpers/users/get-users.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { SortingOption } from '../constants/enums/sorting-option.enum';
import { hashPassword } from '../helpers/password-crypto';
import {
  assertPasswordStrength,
  assertValidLoginUsername,
  normalizeLoginUsername,
} from '../helpers/user-login-username';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  private async assertLoginUsernameAvailable(
    normalized: string,
    excludeUserId?: string,
  ): Promise<void> {
    if (!normalized) {
      return;
    }
    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.login_username = :u', { u: normalized });
    if (excludeUserId) {
      qb.andWhere('user.id != :id', { id: excludeUserId });
    }
    const found = await qb.getOne();
    if (found) {
      throw new ConflictException('Tên đăng nhập đã được sử dụng');
    }
  }

  async getListOfUsers(queries: GetUsersQueries) {
    const { searchText, filter, order } = queries;
    const page = Math.max(0, queries.page ?? 0);
    const rawSize = queries.size ?? 20;
    const size = Math.min(USERS_LIST_MAX_PAGE_SIZE, Math.max(1, rawSize));
    const skip = page * size;

    this.logger.log({
      page,
      size,
      searchText,
      order,
      filter,
      message: '[getListOfUsers] Receive request to list users',
    });

    const listParams = {
      searchText,
      companyIds: filter?.companyIds,
      departmentIds: filter?.departmentIds,
    };

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.backofficeRoles', 'backofficeRoles');

    applyUserListFilters(qb, listParams);

    const countQb = this.userRepo.createQueryBuilder('user');
    applyUserListFilters(countQb, listParams);
    const totalUsers = await countQb.getCount();

    const orderDir = order?.name === SortingOption.DESC ? 'DESC' : 'ASC';
    qb.orderBy('user.name', orderDir).skip(skip).take(size);

    const users = await qb.getMany();
    this.logger.log('Fetched list of users');
    return { totalUsers, users, page, size };
  }
  async createUser(payload: CreateUserDto): Promise<{ user: UserEntity }> {
    const existing = await this.userRepo.findOne({
      where: { email: payload.email.trim() },
    });
    if (existing) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const loginUserNorm =
      payload.loginUsername != null &&
      String(payload.loginUsername).trim() !== ''
        ? normalizeLoginUsername(payload.loginUsername)
        : '';
    if (loginUserNorm) {
      assertValidLoginUsername(loginUserNorm);
      await this.assertLoginUsernameAvailable(loginUserNorm);
    }

    let passwordHash: string | undefined;
    if (payload.password != null && String(payload.password).length > 0) {
      assertPasswordStrength(String(payload.password));
      passwordHash = await hashPassword(String(payload.password));
    }

    const user = this.userRepo.create({
      name: payload.name.trim(),
      email: payload.email.trim(),
      loginUsername: loginUserNorm || undefined,
      passwordHash,
      gender: payload.gender as any,
      dateOfBirth: payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined,
      phoneNumber: payload.phoneNumber?.trim() || undefined,
      company: payload.companyId
        ? ({ id: payload.companyId } as any)
        : undefined,
      department: payload.departmentId
        ? ({ id: payload.departmentId } as any)
        : undefined,
      backofficeRoles: (payload.backofficeRoleIds ?? []).map(
        (id) => ({ id } as any),
      ),
    });

    await this.userRepo.save(user);

    const created = await this.userRepo.findOneOrFail({
      where: { id: user.id },
      relations: ['department', 'company', 'backofficeRoles'],
      select: transformSelectFields(DEFAULT_SELECTED_FIELDS),
    });
    this.logger.log({ id: created.id, message: '[createUser] User created' });
    return { user: created };
  }

  async deleteUserById(id: string): Promise<{ deleted: true }> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['backofficeRoles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.backofficeRoles = [];
    await this.userRepo.save(user);
    await this.userRepo.remove(user);
    this.logger.log({ id, message: '[deleteUserById] User deleted' });
    return { deleted: true };
  }

  async getUserById(id: string): Promise<{ user: UserEntity }> {
    const user = await this.userRepo.findOneOrFail({
      where: { id },
      relations: ['department', 'company', 'backofficeRoles'],
      select: transformSelectFields(DEFAULT_SELECTED_FIELDS),
    });
    this.logger.log('Fetched user by id');
    return { user };
  }

  async updateUserById(
    id: string,
    payload: {
      email?: string;
      gender?: UserEntity['gender'];
      dateOfBirth?: any;
      phoneNumber?: string;
      companyId?: number;
      departmentId?: number;
      backofficeRoleIds?: number[];
      loginUsername?: string | null;
      password?: string | null;
    },
  ): Promise<{ user: UserEntity }> {
    const user = await this.userRepo.findOneOrFail({
      where: { id },
      relations: ['department', 'backofficeRoles'],
    });

    if (payload.email !== undefined) {
      const nextEmail = payload.email.trim();
      if (nextEmail !== user.email) {
        const taken = await this.userRepo.findOne({
          where: { email: nextEmail },
        });
        if (taken && taken.id !== id) {
          throw new ConflictException('Email đã tồn tại trong hệ thống');
        }
      }
      user.email = nextEmail;
    }

    if (payload.loginUsername !== undefined) {
      const raw = payload.loginUsername;
      if (raw === null || String(raw).trim() === '') {
        user.loginUsername = null;
      } else {
        const norm = normalizeLoginUsername(String(raw));
        assertValidLoginUsername(norm);
        await this.assertLoginUsernameAvailable(norm, id);
        user.loginUsername = norm;
      }
    }

    if (payload.password !== undefined) {
      if (payload.password === null || payload.password === '') {
        user.passwordHash = null;
      } else {
        assertPasswordStrength(String(payload.password));
        user.passwordHash = await hashPassword(String(payload.password));
      }
    }
    if (payload.gender !== undefined) {
      user.gender = payload.gender as any;
    }
    if (payload.phoneNumber !== undefined) {
      user.phoneNumber = payload.phoneNumber;
    }
    if (payload.companyId !== undefined) {
      user.company = { id: payload.companyId } as any;
    }
    if (payload.dateOfBirth !== undefined) {
      // Accept ISO/date string from client
      user.dateOfBirth = payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : (null as any);
    }

    if (payload.departmentId !== undefined) {
      user.department = { id: payload.departmentId } as any;
    }
    if (payload.backofficeRoleIds !== undefined) {
      user.backofficeRoles = payload.backofficeRoleIds.map((roleId) => ({
        id: roleId,
      })) as any;
    }

    await this.userRepo.save(user);

    const updated = await this.userRepo.findOneOrFail({
      where: { id },
      relations: ['department', 'company', 'backofficeRoles'],
      select: transformSelectFields(DEFAULT_SELECTED_FIELDS),
    });
    this.logger.log('Updated user by id');
    return { user: updated };
  }
}
