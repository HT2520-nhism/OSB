import { PickType } from '@nestjs/mapped-types';

import { UserEntity } from '../user.entity';

export class GetUserByIdParams extends PickType(UserEntity, ['id'] as const) {}
