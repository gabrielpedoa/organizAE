import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Salário', type: 'INCOME' as const },
  { name: 'Freelance', type: 'INCOME' as const },
  { name: 'Investimentos', type: 'INCOME' as const },
  { name: 'Outros (receita)', type: 'INCOME' as const },
  { name: 'Alimentação', type: 'EXPENSE' as const },
  { name: 'Transporte', type: 'EXPENSE' as const },
  { name: 'Moradia', type: 'EXPENSE' as const },
  { name: 'Saúde', type: 'EXPENSE' as const },
  { name: 'Educação', type: 'EXPENSE' as const },
  { name: 'Lazer', type: 'EXPENSE' as const },
  { name: 'Vestuário', type: 'EXPENSE' as const },
  { name: 'Outros (despesa)', type: 'EXPENSE' as const },
];

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        members: { create: { name: dto.name } },
        categories: {
          create: DEFAULT_CATEGORIES,
        },
      },
    });

    return this.signToken(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.signToken(user.id);
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  }

  private signToken(userId: string) {
    return this.jwt.sign({ sub: userId });
  }
}
