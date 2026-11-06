import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class GetUsersByBackofficeRolesQuery {
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  backofficeRoles: string | string[];
}
