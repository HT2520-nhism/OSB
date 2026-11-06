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
  AddAccountIdentifierDto,
  UpdateAccountIdentifierDto,
  AccountIdentifierResponseDto,
} from '../account-identifier/dto';
import { AccountIdentifierService } from './account-identifier.service';

@ApiTags('Account Identifiers')
@Controller('account-identifiers')
export class AccountIdentifierController {
  constructor(private readonly identifierService: AccountIdentifierService) {}

  @Post(':accountId/identifiers')
  @ApiOperation({ summary: 'Add identifier to account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 201,
    description: 'Identifier added',
    type: AccountIdentifierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Identifier already exists' })
  async addIdentifier(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: AddAccountIdentifierDto,
  ): Promise<AccountIdentifierResponseDto> {
    return this.identifierService.addIdentifier(accountId, dto);
  }

  @Get(':accountId/identifiers')
  @ApiOperation({ summary: 'Get all identifiers for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of identifiers',
    type: [AccountIdentifierResponseDto],
  })
  async getIdentifiers(
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<AccountIdentifierResponseDto[]> {
    return this.identifierService.findByAccountId(accountId);
  }

  @Patch(':accountId/identifiers/:identifierId')
  @ApiOperation({ summary: 'Update identifier' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'identifierId', description: 'Identifier UUID' })
  @ApiResponse({
    status: 200,
    description: 'Identifier updated',
    type: AccountIdentifierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Identifier not found' })
  async updateIdentifier(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Param('identifierId', ParseUUIDPipe) identifierId: string,
    @Body() dto: UpdateAccountIdentifierDto,
  ): Promise<AccountIdentifierResponseDto> {
    return this.identifierService.updateIdentifier(identifierId, dto);
  }
}
