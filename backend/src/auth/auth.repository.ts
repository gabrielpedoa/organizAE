import { Injectable } from '@nestjs/common';
import type { CategoryType, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_CATEGORIES: Array<{ name: string; type: CategoryType }> = [
  { name: 'Salário', type: 'INCOME' },
  { name: 'Freelance', type: 'INCOME' },
  { name: 'Investimentos', type: 'INCOME' },
  { name: 'Outros (receita)', type: 'INCOME' },
  { name: 'Alimentação', type: 'EXPENSE' },
  { name: 'Transporte', type: 'EXPENSE' },
  { name: 'Moradia', type: 'EXPENSE' },
  { name: 'Saúde', type: 'EXPENSE' },
  { name: 'Educação', type: 'EXPENSE' },
  { name: 'Lazer', type: 'EXPENSE' },
  { name: 'Vestuário', type: 'EXPENSE' },
  { name: 'Outros (despesa)', type: 'EXPENSE' },
];

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string): Promise<Pick<User, 'id' | 'name' | 'email'> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }

  createUserWithDefaults(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        members: { create: { name: data.name } },
        categories: { create: DEFAULT_CATEGORIES },
      },
    });
  }
}
