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

import { AccountService } from './account.service';
import { CreateAccountDto, UpdateAccountDto, AccountResponseDto } from './dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async findAll(): Promise<any[]> {
    return this.accountService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  async create(@Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
    return this.accountService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Account details',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Account updated',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.update(id, dto);
  }

  @Get(':id/notification-info')
  @ApiOperation({ summary: 'Get account info for notifications' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Account notification info',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string' },
        phone: { type: 'string' },
        fishermanName: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountForNotification(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountService.getAccountForNotification(id);
  }
}
