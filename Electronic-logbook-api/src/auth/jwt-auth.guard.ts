/**
 * JWT Auth Guard cho Electronic Logbook API
 *
 * Dùng strategy 'logbook-jwt' — không conflict với 'jwt' của Identity.
 *
 * Cách dùng:
 *   @UseGuards(LogbookJwtAuthGuard)
 *   async someProtectedRoute() { ... }
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LogbookJwtAuthGuard extends AuthGuard('logbook-jwt') {}
