import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { AccountIdentifierEntity } from './account-identifier.entity';
import { AccountEntity } from '../account/account.entity';
import { IdentifierType } from '../constants/enums/identifier-type.enum';
import { IdentifierNormalizer } from './identifier-normalizer.service';
import {
  AddAccountIdentifierDto,
  UpdateAccountIdentifierDto,
  AccountIdentifierResponseDto,
} from './dto';

@Injectable()
export class AccountIdentifierService {
  constructor(
    @InjectRepository(AccountIdentifierEntity)
    private readonly identifierRepository: Repository<AccountIdentifierEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly identifierNormalizer: IdentifierNormalizer,
    private readonly dataSource: DataSource,
  ) {}

  async addIdentifier(
    accountId: string,
    dto: AddAccountIdentifierDto,
  ): Promise<AccountIdentifierResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, deletedAt: undefined as any },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    const normalizedValue = this.identifierNormalizer.normalize(
      dto.type,
      dto.value,
    );

    const existing = await this.identifierRepository.findOne({
      where: { type: dto.type, normalizedValue },
    });

    if (existing) {
      throw new ConflictException(
        `An identifier of type ${dto.type} with value "${normalizedValue}" already exists`,
      );
    }

    const existingForAccount = await this.identifierRepository.count({
      where: { accountId },
    });

    const isPrimary = dto.isPrimary ?? existingForAccount === 0;

    if (isPrimary) {
      return this.createWithPrimarySwitch(
        accountId,
        dto.type,
        dto.value,
        normalizedValue,
      );
    }

    const identifier = this.identifierRepository.create({
      accountId,
      type: dto.type,
      value: dto.value,
      normalizedValue,
      isPrimary,
      isVerified: false,
    });

    const saved = await this.identifierRepository.save(identifier);
    return AccountIdentifierResponseDto.fromEntity(saved);
  }

  private async createWithPrimarySwitch(
    accountId: string,
    type: IdentifierType,
    value: string,
    normalizedValue: string,
  ): Promise<AccountIdentifierResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        AccountIdentifierEntity,
        { accountId },
        { isPrimary: false },
      );

      const identifier = queryRunner.manager.create(AccountIdentifierEntity, {
        accountId,
        type,
        value,
        normalizedValue,
        isPrimary: true,
        isVerified: false,
      });

      const saved = await queryRunner.manager.save(identifier);
      await queryRunner.commitTransaction();
      return AccountIdentifierResponseDto.fromEntity(saved);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByAccountId(
    accountId: string,
  ): Promise<AccountIdentifierResponseDto[]> {
    const identifiers = await this.identifierRepository.find({
      where: { accountId },
      order: { createdAt: 'ASC' },
    });
    return identifiers.map((id) => AccountIdentifierResponseDto.fromEntity(id));
  }

  async findById(id: string): Promise<AccountIdentifierResponseDto> {
    const identifier = await this.identifierRepository.findOne({
      where: { id },
    });
    if (!identifier) {
      throw new NotFoundException(`Identifier with ID "${id}" not found`);
    }
    return AccountIdentifierResponseDto.fromEntity(identifier);
  }

  async updateIdentifier(
    id: string,
    dto: UpdateAccountIdentifierDto,
  ): Promise<AccountIdentifierResponseDto> {
    const identifier = await this.identifierRepository.findOne({
      where: { id },
    });
    if (!identifier) {
      throw new NotFoundException(`Identifier with ID "${id}" not found`);
    }

    if (dto.isPrimary !== undefined && dto.isPrimary !== identifier.isPrimary) {
      if (dto.isPrimary) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          await queryRunner.manager.update(
            AccountIdentifierEntity,
            { accountId: identifier.accountId },
            { isPrimary: false },
          );

          identifier.isPrimary = true;
          const saved = await queryRunner.manager.save(identifier);
          await queryRunner.commitTransaction();
          return AccountIdentifierResponseDto.fromEntity(saved);
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      } else {
        identifier.isPrimary = false;
        const saved = await this.identifierRepository.save(identifier);
        return AccountIdentifierResponseDto.fromEntity(saved);
      }
    }

    const saved = await this.identifierRepository.save(identifier);
    return AccountIdentifierResponseDto.fromEntity(saved);
  }

  async deleteIdentifier(id: string, accountId: string): Promise<void> {
    const identifier = await this.identifierRepository.findOne({
      where: { id, accountId },
    });
    if (!identifier) {
      throw new NotFoundException(
        `Identifier with ID "${id}" not found for this account`,
      );
    }
    await this.identifierRepository.remove(identifier);
  }

  async findByTypeAndValue(
    type: IdentifierType,
    value: string,
  ): Promise<AccountIdentifierEntity | null> {
    const normalizedValue = this.identifierNormalizer.normalize(type, value);
    return this.identifierRepository.findOne({
      where: { type, normalizedValue },
    });
  }
}
