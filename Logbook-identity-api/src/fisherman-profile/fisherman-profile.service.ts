import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FishermanProfileEntity } from './fisherman-profile.entity';
import { AccountEntity } from '../account/account.entity';
import { ProfileStatus } from '../constants/enums/profile-status.enum';
import {
  CreateFishermanProfileDto,
  UpdateFishermanProfileDto,
  FishermanProfileResponseDto,
} from './dto';

@Injectable()
export class FishermanProfileService {
  constructor(
    @InjectRepository(FishermanProfileEntity)
    private readonly profileRepository: Repository<FishermanProfileEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async createProfile(
    accountId: string,
    dto: CreateFishermanProfileDto,
  ): Promise<FishermanProfileResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, deletedAt: undefined as any },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    const existing = await this.profileRepository.findOne({
      where: { accountId },
    });

    if (existing) {
      throw new ConflictException(
        `A profile already exists for account "${accountId}"`,
      );
    }

    const profile = this.profileRepository.create({
      accountId,
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      nationality: dto.nationality,
      placeOfBirth: dto.placeOfBirth,
      identityDocumentType: dto.identityDocumentType,
      identityDocumentNumber: dto.identityDocumentNumber,
      identityDocumentIssuedDate: dto.identityDocumentIssuedDate
        ? new Date(dto.identityDocumentIssuedDate)
        : undefined,
      identityDocumentIssuedPlace: dto.identityDocumentIssuedPlace,
      identityDocumentExpiryDate: dto.identityDocumentExpiryDate
        ? new Date(dto.identityDocumentExpiryDate)
        : undefined,
      addressLine: dto.addressLine,
      provinceCode: dto.provinceCode,
      districtCode: dto.districtCode,
      wardCode: dto.wardCode,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      profileStatus: ProfileStatus.INCOMPLETE,
    });

    const saved = await this.profileRepository.save(profile);
    return FishermanProfileResponseDto.fromEntity(saved);
  }

  async findByAccountId(
    accountId: string,
  ): Promise<FishermanProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { accountId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Profile for account "${accountId}" not found`,
      );
    }

    return FishermanProfileResponseDto.fromEntity(profile);
  }

  async findByAccountIdOptional(
    accountId: string,
  ): Promise<FishermanProfileEntity | null> {
    return this.profileRepository.findOne({
      where: { accountId },
    });
  }

  async updateProfile(
    accountId: string,
    dto: UpdateFishermanProfileDto,
  ): Promise<FishermanProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { accountId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Profile for account "${accountId}" not found`,
      );
    }

    if (dto.fullName !== undefined) {
      profile.fullName = dto.fullName;
    }
    if (dto.dateOfBirth !== undefined) {
      profile.dateOfBirth = new Date(dto.dateOfBirth);
    }
    if (dto.gender !== undefined) {
      profile.gender = dto.gender;
    }
    if (dto.nationality !== undefined) {
      profile.nationality = dto.nationality;
    }
    if (dto.placeOfBirth !== undefined) {
      profile.placeOfBirth = dto.placeOfBirth;
    }
    if (dto.identityDocumentType !== undefined) {
      profile.identityDocumentType = dto.identityDocumentType;
    }
    if (dto.identityDocumentNumber !== undefined) {
      profile.identityDocumentNumber = dto.identityDocumentNumber;
    }
    if (dto.identityDocumentIssuedDate !== undefined) {
      profile.identityDocumentIssuedDate = new Date(
        dto.identityDocumentIssuedDate,
      );
    }
    if (dto.identityDocumentIssuedPlace !== undefined) {
      profile.identityDocumentIssuedPlace = dto.identityDocumentIssuedPlace;
    }
    if (dto.identityDocumentExpiryDate !== undefined) {
      profile.identityDocumentExpiryDate = new Date(
        dto.identityDocumentExpiryDate,
      );
    }
    if (dto.addressLine !== undefined) {
      profile.addressLine = dto.addressLine;
    }
    if (dto.provinceCode !== undefined) {
      profile.provinceCode = dto.provinceCode;
    }
    if (dto.districtCode !== undefined) {
      profile.districtCode = dto.districtCode;
    }
    if (dto.wardCode !== undefined) {
      profile.wardCode = dto.wardCode;
    }
    if (dto.emergencyContactName !== undefined) {
      profile.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      profile.emergencyContactPhone = dto.emergencyContactPhone;
    }

    const saved = await this.profileRepository.save(profile);
    return FishermanProfileResponseDto.fromEntity(saved);
  }

  async findById(id: string): Promise<FishermanProfileEntity | null> {
    return this.profileRepository.findOne({ where: { id } });
  }
}
