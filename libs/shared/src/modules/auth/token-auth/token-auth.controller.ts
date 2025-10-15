import { Owner } from '@core/decorators/owner.decorator';
import { Public } from '@core/decorators/public.decorator';
import {
  ResponseInternalServerError,
  ResponseUnauthorized,
} from '@core/definitions/api-response.dto';
import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session } from '@shared/modules/session/entities/session.entity';
import { TokenAuthDto } from './token-auth.dto';
import { TokenAuthGuard } from './token-auth.guard';
import { TokenAuthService } from './token-auth.service';

@ApiTags('auth')
@ApiUnauthorizedResponse(ResponseUnauthorized)
@ApiInternalServerErrorResponse(ResponseInternalServerError)
@Controller('auth')
export class TokenAuthController {
  constructor(private readonly tokenAuthService: TokenAuthService) {}

  @Public()
  @ApiOperation({ summary: 'Generate new token using refresh token' })
  @ApiOkResponse({
    description: 'Ok',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            token_expiry: { type: 'string', format: 'date-time' },
          },
        },
        message: { type: 'string', example: 'Created' },
      },
    },
  })
  @UseGuards(TokenAuthGuard)
  @Post('token')
  async token(@Body() body: TokenAuthDto, @Owner() session: Session) {
    const { error, data } = await this.tokenAuthService.getNewToken(
      body,
      session,
    );
    if (error) {
      throw new ForbiddenException(
        error instanceof Error ? error.message : error,
      );
    }
    return { data, message: 'Token created' };
  }
}
