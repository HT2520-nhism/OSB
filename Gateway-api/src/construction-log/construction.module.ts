import { Module } from '@nestjs/common';

import { ProjectsController } from './projects/projects.controller';
import { DailyLogController } from './daily-log/daily-log.controller';
import { DailyLogService } from './daily-log/daily-log.service';
import { LogImageController } from './log-image/log-image.controller';
import { LogImageService } from './log-image/log-image.service';
import { LogAttachmentController } from './log-attachment/log-attachment.controller';
import { LogAttachmentService } from './log-attachment/log-attachment.service';
import { ProjectAssignmentsController } from './project-assignments/project-assignments.controller';
import { ProjectAssignmentsService } from './project-assignments/project-assignments.service';
import { ProjectsService } from './projects/projects.service';
import { ProjectTasksController } from './project-tasks/project-tasks.controller';
import { ProjectTasksService } from './project-tasks/project-tasks.service';
import { UserNotificationsController } from './user-notifications/user-notifications.controller';
import { UserNotificationsService } from './user-notifications/user-notifications.service';
import { DeviceTokensController } from './device-tokens/device-tokens.controller';
import { DeviceTokensService } from './device-tokens/device-tokens.service';

@Module({
  imports: [],
  controllers: [
    ProjectsController,
    DailyLogController,
    LogImageController,
    LogAttachmentController,
    ProjectAssignmentsController,
    ProjectTasksController,
    UserNotificationsController,
    DeviceTokensController,
  ],
  providers: [
    DailyLogService,
    LogImageService,
    LogAttachmentService,
    ProjectAssignmentsService,
    ProjectsService,
    ProjectTasksService,
    UserNotificationsService,
    DeviceTokensService,
  ],
})
export class ConstructionLogModule {}
