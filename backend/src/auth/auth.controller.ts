import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { JwtUser } from './jwt-user.interface';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra novo usuário e retorna token via cookie' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const token = await this.auth.register(dto);
    res.cookie('token', token, COOKIE_OPTIONS);
    return { ok: true };
  }

  @Post('login')
  @ApiOperation({ summary: 'Autentica usuário e retorna token via cookie' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const token = await this.auth.login(dto);
    res.cookie('token', token, COOKIE_OPTIONS);
    return { ok: true };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Invalida o cookie de sessão' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { ok: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna dados do usuário autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.id);
  }
}
