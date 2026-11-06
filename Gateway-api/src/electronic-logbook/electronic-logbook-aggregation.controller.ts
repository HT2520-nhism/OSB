/**
 * PHASE 8 — Electronic Logbook Aggregation Controller.
 *
 * Provides client-ready endpoints that aggregate data from multiple downstream services.
 *
 * Authentication pattern (per project convention):
 * - All requests MUST include `Authorization: Bearer <token>` header
 * - Gateway does NOT validate the token here (will be added in a later phase via JwtAuthGuard)
 * - The Authorization header is forwarded as-is to downstream services
 * - Downstream services validate the token via their own JwtAuthGuard
 *
 * Architecture:
 * - Simple pass-through endpoints forward the user's Bearer header verbatim.
 * - The fishing-trip overview endpoint composes data from two downstreams
 *   (Electronic Logbook + Document Service) in a single round-trip
 *   (parallel calls via Promise.allSettled). The Document Service is called
 *   with a Gateway-minted service-to-service JWT — see helpers/service-token.ts.
 */

import {
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import * as superagent from 'superagent';

import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { config } from '../config';
import {
  convertSuperAgentErrorToResponse,
  DOCUMENT_AUDIENCE,
  extractUserIdFromAuthHeader,
  mintServiceToken,
} from '../helpers';

/**
 * Shape of each document returned by the Document Service's
 * GET /api/documents endpoint. Mirrors the serializer in
 * document-api/src/document/document.controller.ts so we get
 * accurate Swagger typing without a cross-service import.
 */
interface Document {
  id: string;
  documentCode: string;
  ownerService: string;
  ownerType: string;
  ownerId: string;
  documentType: string | null;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
}

@ApiTags(SwaggerTags.ELB_AGGREGATION)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook')
export class ElectronicLogbookAggregationController {
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard overview (aggregated)',
    description:
      'Returns real dashboard data: recent vessels, active trips count, and sync status. ' +
      'Requires Authorization header.',
  })
  async getDashboard(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: any,
  ) {
    const elb = config.ELECTRONIC_LOGBOOK_API_URL;

    const fetchJson = async <T>(url: string): Promise<T | null> => {
      try {
        const req = superagent.get(url);
        if (authorization) req.set('Authorization', authorization);
        const { body, status } = await req;
        if (status < 200 || status >= 300) return null;
        return body as T;
      } catch {
        return null;
      }
    };

    try {
      // Parallel fetch: vessels (recent 5) + active trips + sync status
      const [vesselsRaw, tripsRaw, syncRaw] = await Promise.all([
        fetchJson<any[]>(`${elb}/api/vessels?page=1&limit=5`),
        fetchJson<any[]>(`${elb}/api/fishing-trips?page=1&limit=50`),
        fetchJson<any>(`${elb}/api/sync/status`),
      ]);

      const allVessels = Array.isArray(vesselsRaw) ? vesselsRaw : [];
      const allTrips = Array.isArray(tripsRaw) ? tripsRaw : [];

      // Active trips = non-completed, non-cancelled
      const activeTrips = allTrips.filter(
        (t: any) => t.status && !['COMPLETED', 'CANCELLED'].includes(t.status),
      );

      return res.status(200).json({
        vessels: allVessels.slice(0, 5),
        vesselCount: allVessels.length,
        activeTrips: activeTrips.slice(0, 5),
        activeTripCount: activeTrips.length,
        pendingSync: {
          count: (syncRaw as any)?.pendingChanges ?? 0,
        },
      });
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('vessels')
  @ApiOperation({
    summary: 'List vessels (pass-through)',
    description:
      'Forwards to Electronic Logbook vessel list with pagination metadata.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getVesselList(
    @Headers('authorization') authorization: string | undefined,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Res() res?: any,
  ) {
    try {
      const path = `vessels?page=${page ? parseInt(page, 10) || 1 : 1}&limit=${
        limit ? parseInt(limit, 10) || 20 : 20
      }`;
      const req = superagent.get(
        `${config.ELECTRONIC_LOGBOOK_API_URL}/api/${path}`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('vessels/:id')
  @ApiOperation({
    summary: 'Get vessel detail (pass-through)',
    description:
      'Forwards to Electronic Logbook vessel detail. Returns the raw vessel entity.',
  })
  @ApiParam({ name: 'id', description: 'Vessel UUID' })
  async getVesselDetail(
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ) {
    try {
      const req = superagent.get(
        `${config.ELECTRONIC_LOGBOOK_API_URL}/api/vessels/${id}`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('fishing-trips')
  @ApiOperation({
    summary: 'List fishing trips (pass-through)',
    description:
      'Forwards to Electronic Logbook fishing-trip list with pagination metadata.',
  })
  @ApiQuery({ name: 'vesselId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getTripList(
    @Headers('authorization') authorization: string | undefined,
    @Query('vesselId') vesselId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Res() res?: any,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) || 1 : 1;
      const limitNum = limit ? parseInt(limit, 10) || 20 : 20;
      const vesselFilter = vesselId ? `&vesselId=${vesselId}` : '';
      const path = `fishing-trips?page=${pageNum}&limit=${limitNum}${vesselFilter}`;
      const req = superagent.get(
        `${config.ELECTRONIC_LOGBOOK_API_URL}/api/${path}`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  /**
   * AGGREGATION ENDPOINT (CRITICAL for Trip Detail screen).
   *
   * Composes a client-ready response in two parallel round-trips:
   *
   *   1. Electronic Logbook backend → owns the trip/vessel/crew/gear/operations/
   *      catches/landings/port-calls/incidents/fuel/forms/workflow. Single
   *      endpoint with direct TypeORM access for atomic snapshot.
   *
   *   2. Document Service → owns attachment metadata for the trip
   *      (ownerType='fishing_trip', ownerId=tripId). Called with a
   *      service-to-service JWT (svc='gateway', aud='document-api') that
   *      the document-api trusts via shared JWT_SERVICE_SECRET.
   *
   * The two calls run in parallel via Promise.all to keep latency at ~1
   * round-trip. Documents are merged into the response as `documents`;
   * if the document call fails (auth/timeout/404) we log a warning and
   * return `documents: []` so the rest of the overview is still usable.
   */
  @Get('fishing-trips/:id/overview')
  @ApiOperation({
    summary: 'Get fishing trip overview (aggregated)',
    description:
      'Composes the full trip overview (trip/vessel/crew/gear/operations with ' +
      'catches/landings/port-calls/incidents/fuel/forms/workflow + attachments ' +
      'from the Document Service) in two parallel downstream calls.',
  })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async getFishingTripOverview(
    @Headers('authorization') authorization: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ) {
    const elbUrl = `${config.ELECTRONIC_LOGBOOK_API_URL}/api/fishing-trips/${id}/overview`;
    const docUrl = `${config.DOCUMENT_API_URL}/api/documents?ownerType=fishing_trip&ownerId=${id}`;

    // Mint a service-to-service JWT for the Document Service.
    // The user-id (if any) is forwarded as `sub` so audit trails on
    // document-api can still attribute actions to the originating user.
    const docAuth = `Bearer ${mintServiceToken(
      DOCUMENT_AUDIENCE,
      extractUserIdFromAuthHeader(authorization),
    )}`;

    // Issue both downstream calls in parallel. The Electronic Logbook call
    // is the critical path: if it fails we propagate. The Document Service
    // call is best-effort — attachments are useful but not essential to the
    // trip-detail screen, so we tolerate them with Promise.allSettled and
    // log a warning if it fails.
    const logger = new Logger('ElbOverviewService');

    const elbPromise = superagent
      .get(elbUrl)
      .set('Authorization', authorization ?? '');

    const docPromise = superagent
      .get(docUrl)
      .set('Authorization', docAuth)
      .ok((r) => r.status >= 200 && r.status < 300);

    const [elbResult, docResult] = await Promise.allSettled([
      elbPromise,
      docPromise,
    ]);

    if (elbResult.status === 'rejected') {
      return convertSuperAgentErrorToResponse(res, elbResult.reason);
    }

    if (docResult.status === 'rejected') {
      const reason: any = docResult.reason;
      logger.warn(
        `documents fetch failed (continuing without documents): tripId=${id} ` +
          `status=${reason?.status} message=${reason?.message}`,
      );
    } else if (docResult.value.status >= 400) {
      logger.warn(
        `documents fetch non-2xx (continuing without documents): tripId=${id} ` +
          `status=${docResult.value.status}`,
      );
    }

    const elbResp = elbResult.value;
    const overview: any = elbResp.body ?? {};
    const documents: Document[] =
      docResult.status === 'fulfilled' &&
      docResult.value.status < 400 &&
      Array.isArray((docResult.value.body as any)?.data)
        ? ((docResult.value.body as any).data as Document[])
        : [];

    return res.status(elbResp.status).json({ ...overview, documents });
  }
}
