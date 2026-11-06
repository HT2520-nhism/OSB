/**
 * PHASE 8 — Fishing Operation Profile Controller.
 *
 * Provides search API for fishermen/crew.
 * fishermanCode is server-generated — clients search using the code.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { FishingOperationProfileService } from './fishing-operation-profile.service';
import {
  CreateFishingOperationProfileDto,
  SearchFishingOperationProfileDto,
  FishingOperationProfileResponseDto,
} from './dto';

@ApiBearerAuth('user')
@ApiTags('Fishing_operation_profile')
@UseGuards(LogbookJwtAuthGuard)
@Controller('fishing-operation-profiles')
export class FishingOperationProfileController {
  constructor(private readonly service: FishingOperationProfileService) {}

  /**
   * Search fishermen by fisherman_code or user_id.
   * GET /fishing-operation-profiles?fishermanCode=FSH-000123
   */
  @Get()
  search(
    @Query() query: SearchFishingOperationProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.search(query, user);
  }

  /**
   * Get profile by fisherman_code.
   * GET /fishing-operation-profiles/by-code/FSH-000123
   */
  @Get('by-code/:fishermanCode')
  findByCode(
    @Param('fishermanCode') fishermanCode: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findByFishermanCode(fishermanCode, user);
  }

  /**
   * Get profile by ID.
   * GET /fishing-operation-profiles/:id
   */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id);
  }

  /**
   * Create a new fishing operation profile.
   * fishermanCode is auto-generated server-side.
   *
   * POST /fishing-operation-profiles
   * Body: { "userId": "uuid" }
   */
  @Post()
  create(
    @Body() dto: CreateFishingOperationProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user);
  }
}
