import { Owner } from '@core/decorators/owner.decorator';
import { Public } from '@core/decorators/public.decorator';
import {
  ResponseInternalServerError,
  ResponseUnauthorized,
} from '@core/dto/api-response.dto';
import type { OwnerDto } from '@core/types/owner';
import {
  Body,
  Controller,
  Ip,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { User } from '@shared/modules/user/entities/user.entity';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AuthService } from '../../auth.service';
import { LocalAuthDto } from './local-auth.dto';
import { LocalAuthGuard } from './local-auth.guard';

@ApiTags('auth')
@ApiUnauthorizedResponse(ResponseUnauthorized)
@ApiInternalServerErrorResponse(ResponseInternalServerError)
@ApiExtraModels(User)
@Controller('auth/local')
export class LocalAuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login with username and password
   */
  @Post('')
  @Public()
  @ApiOperation({ summary: 'Local authentication' })
  @ApiOkResponse({
    description: 'Login success',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: {
            user: { $ref: getSchemaPath(User) },
            token: { type: 'string' },
            token_expiry: { type: 'string', format: 'date-time' },
            refresh_token: { type: 'string' },
          },
        },
        message: { type: 'string', example: 'Login successful.' },
      },
    },
  })
  @UseGuards(LocalAuthGuard)
  async localLogin(
    @Owner() owner: OwnerDto,
    @Body() body: LocalAuthDto,
    @Ip() ip: string,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.authService.createSession(owner, {
      ...body.info,
      ip,
    });
    if (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : error,
      );
    }
    return { data, message: i18n.t('auth.success') };
  }
}
