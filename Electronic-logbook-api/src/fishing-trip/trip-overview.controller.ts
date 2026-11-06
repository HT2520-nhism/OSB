/**
 * Aggregation Controller — Returns the full fishing-trip overview
 * in a single client-ready response. Designed for the trip-detail screen
 * so the Mobile/Web client does not have to issue 10+ parallel API calls.
 *
 * Authorization is enforced by the underlying TripOverviewService, which
 * calls AuthorizationService.assertCanAccessTrip.
 */

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { TripOverviewService } from './trip-overview.service';

@ApiBearerAuth('user')
@ApiTags('Fishing_trip_overview')
@UseGuards(LogbookJwtAuthGuard)
@Controller('fishing-trips')
export class TripOverviewController {
  constructor(private readonly service: TripOverviewService) {}

  /**
   * GET /api/fishing-trips/:id/overview
   *
   * Returns the full aggregated overview of a fishing trip in a single response:
   * trip, vessel, captain, crew, gear, operations (with catches), catch summary,
   * landings (with catches), port calls, incidents, fuel records, forms (M01/M02/M03),
   * and the workflow state.
   */
  @Get(':id/overview')
  @ApiOperation({
    summary: 'Get full fishing-trip overview (aggregated)',
    description:
      'Returns all data required to render the trip-detail screen in a ' +
      'single request. Includes trip, vessel, captain, crew, gear, operations ' +
      '(with catches), catch summary, landings (with catches), port calls, ' +
      'incidents, fuel records, form references (M01/M02/M03), and workflow state.',
  })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async getOverview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getOverview(id, user);
  }
}
