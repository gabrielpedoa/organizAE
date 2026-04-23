import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly authRepository: AuthRepository, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const exists = await this.authRepository.findUserByEmail(dto.email);
    if (exists) throw new BadRequestException('Email já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.authRepository.createUserWithDefaults({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.signToken(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.signToken(user.id);
  }

  async me(userId: string) {
    return this.authRepository.findUserById(userId);
  }

  private signToken(userId: string) {
    return this.jwt.sign({ sub: userId });
  }
}
