import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { AccountEntity } from './account.entity';
import { AccountIdentifierEntity } from '../account-identifier/account-identifier.entity';
import { AccountStatus } from '../constants/enums/account-status.enum';
import { AccountType } from '../constants/enums/account-type.enum';
import { IdentifierType } from '../constants/enums/identifier-type.enum';
import { SystemRole } from '../constants/enums/system-role.enum';
import { CreateAccountDto, UpdateAccountDto, AccountResponseDto } from './dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(AccountIdentifierEntity)
    private readonly identifierRepository: Repository<AccountIdentifierEntity>,
  ) {}

  async findAll(): Promise<any[]> {
    const accounts = await this.accountRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['identifiers', 'fishermanProfile'],
      order: { createdAt: 'DESC' },
    });
    return accounts.map((acc) => ({
      id: acc.id,
      status: acc.status,
      accountType: acc.accountType,
      systemRole: acc.systemRole,
      createdAt: acc.createdAt,
      lastLoginAt: acc.lastLoginAt,
      identifiers: acc.identifiers?.map((i) => ({
        type: i.type,
        value: i.value,
        isPrimary: i.isPrimary,
      })),
      profile: acc.fishermanProfile
        ? {
            fullName: acc.fishermanProfile.fullName,
          }
        : null,
    }));
  }

  async create(dto: CreateAccountDto): Promise<AccountResponseDto> {
    const account = this.accountRepository.create({
      status: AccountStatus.PENDING,
      accountType: dto.accountType ?? AccountType.FISHERMAN,
      systemRole: SystemRole.USER,
      failedLoginAttempts: 0,
    });
    const saved = await this.accountRepository.save(account);
    return AccountResponseDto.fromEntity(saved);
  }

  async findById(id: string): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }
    return AccountResponseDto.fromEntity(account);
  }

  async findByIdOptional(id: string): Promise<AccountEntity | null> {
    return this.accountRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdWithRelations(id: string): Promise<AccountEntity | null> {
    return this.accountRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['identifiers', 'fishermanProfile'],
    });
  }

  async update(id: string, dto: UpdateAccountDto): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }

    if (dto.accountType !== undefined) {
      account.accountType = dto.accountType;
    }

    if (dto.status !== undefined) {
      account.status = dto.status;
    }

    if (dto.systemRole !== undefined) {
      account.systemRole = dto.systemRole;
    }

    const saved = await this.accountRepository.save(account);
    return AccountResponseDto.fromEntity(saved);
  }

  async deactivateAccount(id: string): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }
    await this.accountRepository.softRemove(account);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.accountRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * Find account by primary email identifier.
   * Used primarily by migrations/seed scripts — NOT for runtime auth decisions.
   */
  async findByEmail(email: string): Promise<AccountEntity | null> {
    const identifier = await this.identifierRepository.findOne({
      where: {
        type: IdentifierType.EMAIL,
        normalizedValue: email.toLowerCase(),
        isPrimary: true,
      },
      relations: ['account'],
    });

    if (!identifier?.account) return null;

    return this.accountRepository.findOne({
      where: { id: identifier.account.id, deletedAt: IsNull() },
    });
  }

  async getAccountForNotification(accountId: string): Promise<{
    id: string;
    email: string;
    phone: string;
    fishermanName: string;
  }> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, deletedAt: IsNull() },
      relations: ['fishermanProfile', 'identifiers'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    const email =
      account.identifiers?.find(
        (id) => id.type === IdentifierType.EMAIL && id.isVerified,
      )?.value ?? '';

    const phone =
      account.identifiers?.find(
        (id) => id.type === IdentifierType.PHONE && id.isVerified,
      )?.value ?? '';

    const fishermanName = account.fishermanProfile?.fullName ?? 'Ngư dân';

    return {
      id: account.id,
      email,
      phone,
      fishermanName,
    };
  }
}
