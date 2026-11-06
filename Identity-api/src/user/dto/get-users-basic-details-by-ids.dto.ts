import { IsUUID } from 'class-validator';

import { UserEntity } from '../user.entity';

export class GetUsersBasicDetailsByIdsQueries {
  @IsUUID('4', { each: true })
  userIds?: UserEntity['id'] | UserEntity['id'][];
}
