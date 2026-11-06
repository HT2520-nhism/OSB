import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseFilters,
  Query,
  UseGuards,
  UsePipes,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  getUsersBasicDetailsQueries,
  getUsersByBackofficeRoleQuery,
  getUsersQueries,
  updateUserByIdBody,
  uuidSchema,
} from '../user/dto/users.request-schema';

import { AllExceptionsFilter } from '../errors/exception-filter';
import validationPipe from '../validation-pipe';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// Phân quyền theo role backoffice (bật lại khi chỉ admin/giám đốc được quản lý user):
// import { Roles } from '../auth/roles.decorator';
// import { RolesGuard } from '../auth/roles.guard';
// import { BackofficeRole } from '../constants/enums/backoffice-role.enum';

import { GetUsersQueries } from './dto/get-users.dto';
import { UpdateUserByIdBody } from './dto/update-user-by-id.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayload } from '../constants/types/jwt-payload.type';
import {
  assertCanSetLoginCredentialsOnCreate,
  assertCanSetLoginCredentialsOnUpdate,
} from '../helpers/seacom-login-credentials';

type RequestWithJwtUser = { user: JwtPayload };

@ApiBearerAuth('user')
@UsePipes(validationPipe())
@UseFilters(AllExceptionsFilter)
@ApiTags(SwaggerTags.USERS)
@Controller('users')
@UseGuards(JwtAuthGuard)
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(
//   BackofficeRole.ADMIN,
//   BackofficeRole.DIRECTOR,
//   BackofficeRole.DEPUTY_DIRECTOR,
// )
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @ApiQuery(getUsersQueries)
  getUsers(@Query() queries: GetUsersQueries) {
    return this.usersService.getListOfUsers(queries);
  }

  @Post('/')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        gender: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        phoneNumber: { type: 'string' },
        companyId: { type: 'number' },
        departmentId: { type: 'number' },
        backofficeRoleIds: { type: 'array', items: { type: 'number' } },
        loginUsername: {
          type: 'string',
          description:
            'Tùy chọn: tên đăng nhập (email hoặc username + mật khẩu)',
        },
        password: {
          type: 'string',
          description: 'Tùy chọn: mật khẩu đăng nhập app (8–128 ký tự)',
        },
      },
    },
  })
  createUser(@Req() req: RequestWithJwtUser, @Body() body: CreateUserDto) {
    const wantsLoginCreds =
      (typeof body.loginUsername === 'string' &&
        body.loginUsername.trim() !== '') ||
      (typeof body.password === 'string' && body.password.trim() !== '');
    if (wantsLoginCreds) {
      assertCanSetLoginCredentialsOnCreate(req.user);
    }
    return this.usersService.createUser(body);
  }

  @Get('/:id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch('/:id')
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiBody(updateUserByIdBody)
  updateUserById(
    @Req() req: RequestWithJwtUser,
    @Param('id') id: string,
    @Body()
    body: UpdateUserByIdBody,
  ) {
    const touchesLoginCreds =
      body.loginUsername !== undefined || body.password !== undefined;
    if (touchesLoginCreds) {
      assertCanSetLoginCredentialsOnUpdate(req.user, id);
    }
    return this.usersService.updateUserById(id, body);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteUserById(id);
  }
}
