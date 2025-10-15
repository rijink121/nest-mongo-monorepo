import { ApiErrorResponses } from '@core/decorators/api.decorator';
import { Owner } from '@core/decorators/owner.decorator';
import { Public } from '@core/decorators/public.decorator';
import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session } from '@shared/modules/session/entities/session.entity';
import { TokenAuthDto } from './token-auth.dto';
import { TokenAuthGuard } from './token-auth.guard';
import { TokenAuthService } from './token-auth.service';

@ApiTags('auth')
@ApiErrorResponses()
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
