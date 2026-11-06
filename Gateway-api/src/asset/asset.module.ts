import { Module } from '@nestjs/common';

import { AssetsController } from './assets/assets.controller';
import { AssetsService } from './assets/assets.service';
import { AssetCategoriesController } from './asset-categories/asset-categories.controller';
import { AssetCategoriesService } from './asset-categories/asset-categories.service';
import { AssetModelsController } from './asset-models/asset-models.controller';
import { AssetModelsService } from './asset-models/asset-models.service';
import { AssetRelationshipsController } from './asset-relationships/asset-relationships.controller';
import { AssetRelationshipsService } from './asset-relationships/asset-relationships.service';
import { AssetAssignmentsController } from './asset-assignments/asset-assignments.controller';
import { AssetAssignmentsService } from './asset-assignments/asset-assignments.service';
import { AssetMovementsController } from './asset-movements/asset-movements.controller';
import { AssetMovementsService } from './asset-movements/asset-movements.service';

@Module({
  imports: [],
  controllers: [
    AssetsController,
    AssetCategoriesController,
    AssetModelsController,
    AssetRelationshipsController,
    AssetAssignmentsController,
    AssetMovementsController,
  ],
  providers: [
    AssetsService,
    AssetCategoriesService,
    AssetModelsService,
    AssetRelationshipsService,
    AssetAssignmentsService,
    AssetMovementsService,
  ],
})
export class AssetModule {}
