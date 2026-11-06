import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { VesselService } from './vessel.service';
import * as Dto from './dto';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemRoleGuard, RequireSystemRole } from '../auth/system-role.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { SystemRole } from '../constants/enums/system-role.enum';

@ApiBearerAuth('user')
@ApiTags('Vessel')
@UseGuards(LogbookJwtAuthGuard)
@Controller('vessels')
export class VesselController {
  constructor(private readonly service: VesselService) {}

  @Get()
  /**
   * List all vessels accessible to the user.
   * SUPER_ADMIN sees all; others see only their accessible vessels.
   */
  findAll(@CurrentUser() user: AuthUser, @Query() query: Dto.QueryVesselDto) {
    return this.service.findAll(user);
  }

  @Get(':id')
  /**
   * Get a single vessel by ID.
   * Accessible if user is a vessel member or SUPER_ADMIN.
   */
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  /**
   * Create a new vessel.
   * Any authenticated user can create a vessel.
   */
  create(@Body() dto: Dto.CreateVesselDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  /**
   * Update a vessel.
   * Requires vessel membership or ADMIN role.
   */
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateVesselDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  /**
   * Delete a vessel.
   * Requires ADMIN or SUPER_ADMIN role (not just vessel membership).
   */
  @UseGuards(SystemRoleGuard)
  @RequireSystemRole(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user);
  }
}
