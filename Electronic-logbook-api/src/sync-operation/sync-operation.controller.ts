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

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';

import { SyncOperationService } from './sync-operation.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Sync_operation')
@UseGuards(LogbookJwtAuthGuard)
@Controller('sync-operations')
export class SyncOperationController {
  constructor(private readonly service: SyncOperationService) {}

  @Get()
  findAll(@Query() query: Dto.QuerySyncOperationDto) {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Dto.CreateSyncOperationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateSyncOperationDto,
  ) {
    return this.service.update(id, dto as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
