import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import {
  CreateFishermanProfileDto,
  UpdateFishermanProfileDto,
  FishermanProfileResponseDto,
} from './dto';
import { FishermanProfileService } from './fisherman-profile.service';

@ApiTags('Fisherman Profiles')
@Controller('fisherman-profiles')
export class FishermanProfileController {
  constructor(
    private readonly fishermanProfileService: FishermanProfileService,
  ) {}

  @Post(':accountId/profile')
  @ApiOperation({ summary: 'Create profile for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 201,
    description: 'Profile created',
    type: FishermanProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: CreateFishermanProfileDto,
  ): Promise<FishermanProfileResponseDto> {
    return this.fishermanProfileService.createProfile(accountId, dto);
  }

  @Get(':accountId/profile')
  @ApiOperation({ summary: 'Get profile for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Profile details',
    type: FishermanProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<FishermanProfileResponseDto> {
    return this.fishermanProfileService.findByAccountId(accountId);
  }

  @Patch(':accountId/profile')
  @ApiOperation({ summary: 'Update profile for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: FishermanProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: UpdateFishermanProfileDto,
  ): Promise<FishermanProfileResponseDto> {
    return this.fishermanProfileService.updateProfile(accountId, dto);
  }
}
