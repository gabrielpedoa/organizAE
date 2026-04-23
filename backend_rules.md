# OrganizAE — Backend: Arquitetura e Padrões de Código

> Estas regras se aplicam a todo código novo e a refatorações do backend NestJS.
> O agente deve ler este arquivo antes de criar ou editar qualquer arquivo no backend.

---

## 1. Stack e Versões

| Tecnologia                          | Uso                             |
| ----------------------------------- | ------------------------------- |
| NestJS                              | Framework principal             |
| Prisma                              | ORM — acesso ao banco           |
| PostgreSQL                          | Banco de dados                  |
| class-validator + class-transformer | Validação de DTOs               |
| @nestjs/swagger                     | Documentação OpenAPI            |
| TypeScript (strict)                 | Linguagem — sem `any` explícito |

---

## 2. Estrutura de Módulos

Cada módulo deve seguir exatamente esta estrutura de arquivos:

```
src/
└── nome-do-modulo/
    ├── dto/
    │   ├── create-nome.dto.ts
    │   └── update-nome.dto.ts
    ├── nome.controller.ts
    ├── nome.module.ts
    ├── nome.repository.ts   ← OBRIGATÓRIO
    └── nome.service.ts
```

### Responsabilidades de cada camada

```
Controller  →  recebe HTTP, valida auth, chama Service, retorna resposta
Service     →  lógica de negócio, orquestra chamadas ao Repository
Repository  →  toda e qualquer chamada ao Prisma — nada mais
```

**Regra absoluta:** o Service nunca importa ou chama `PrismaService` diretamente.
Toda interação com o banco passa pelo Repository do módulo.

---

## 3. Repository Pattern

### Template de Repository

```typescript
// src/nome-do-modulo/nome.repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, NomeDoModelo } from "@prisma/client";

@Injectable()
export class NomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NomeDoModelo | null> {
    return this.prisma.nomeDoModelo.findUnique({ where: { id } });
  }

  async findByUser(userId: string): Promise<NomeDoModelo[]> {
    return this.prisma.nomeDoModelo.findMany({ where: { userId } });
  }

  async create(data: Prisma.NomeDoModeloCreateInput): Promise<NomeDoModelo> {
    return this.prisma.nomeDoModelo.create({ data });
  }

  async update(
    id: string,
    data: Prisma.NomeDoModeloUpdateInput,
  ): Promise<NomeDoModelo> {
    return this.prisma.nomeDoModelo.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.nomeDoModelo.delete({ where: { id } });
  }
}
```

### Template de Module (com Repository)

```typescript
// src/nome-do-modulo/nome.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NomeController } from "./nome.controller";
import { NomeService } from "./nome.service";
import { NomeRepository } from "./nome.repository";

@Module({
  imports: [PrismaModule],
  controllers: [NomeController],
  providers: [NomeService, NomeRepository],
  exports: [NomeService],
})
export class NomeModule {}
```

### Template de Service (chamando Repository)

```typescript
// src/nome-do-modulo/nome.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { NomeRepository } from "./nome.repository";
import { CreateNomeDto } from "./dto/create-nome.dto";

@Injectable()
export class NomeService {
  constructor(private readonly nomeRepository: NomeRepository) {}

  async findById(id: string, userId: string) {
    const item = await this.nomeRepository.findById(id);
    if (!item) throw new NotFoundException("Recurso não encontrado");
    if (item.userId !== userId) throw new ForbiddenException();
    return item;
  }

  async create(userId: string, dto: CreateNomeDto) {
    return this.nomeRepository.create({
      ...dto,
      user: { connect: { id: userId } },
    });
  }
}
```

---

## 4. DTOs e Validação

Todo endpoint que recebe corpo (POST, PATCH, PUT) deve ter um DTO com decorators
do `class-validator`. Nunca aceitar `body: any` ou objeto sem tipagem.

```typescript
// src/nome-do-modulo/dto/create-nome.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDecimal,
  IsDateString,
} from "class-validator";

export class CreateNomeDto {
  @ApiProperty({ description: "Descrição do item", example: "Conta de luz" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: "Valor", example: "200.00" })
  @IsOptional()
  @IsDecimal()
  amount?: string;

  @ApiProperty({ description: "Data no formato ISO", example: "2026-04-15" })
  @IsDateString()
  date: string;
}
```

### Regras de DTO

- `CreateDto` → todos os campos obrigatórios com `@IsNotEmpty()` ou equivalente
- `UpdateDto` → estender `PartialType(CreateDto)` do `@nestjs/mapped-types`
- Campos imutáveis (como `type`, `ruleType`) **não entram** no `UpdateDto`
- Nunca usar `@IsOptional()` em campo que é obrigatório na criação

```typescript
// src/nome-do-modulo/dto/update-nome.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateNomeDto } from "./create-nome.dto";

export class UpdateNomeDto extends PartialType(CreateNomeDto) {}
```

---

## 5. Controllers e Swagger

Todo controller deve ter documentação Swagger completa.

```typescript
// src/nome-do-modulo/nome.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { NomeService } from "./nome.service";
import { CreateNomeDto } from "./dto/create-nome.dto";

@ApiTags("nome-do-modulo")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("nome-do-modulo")
export class NomeController {
  constructor(private readonly nomeService: NomeService) {}

  @Get()
  @ApiOperation({ summary: "Lista todos os itens do usuário autenticado" })
  @ApiResponse({ status: 200, description: "Lista retornada com sucesso" })
  findAll(@CurrentUser() user: { id: string }) {
    return this.nomeService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Cria um novo item" })
  @ApiResponse({ status: 201, description: "Item criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateNomeDto) {
    return this.nomeService.create(user.id, dto);
  }
}
```

### Ordem de rotas no Controller (CRÍTICO)

Rotas estáticas SEMPRE antes de rotas com parâmetro dinâmico.
Caso contrário, `:id` captura rotas como `/best-dates` gerando 404.

```typescript
// ✅ CORRETO
@Get('summary')       // estática primeiro
@Get('best-dates')    // estática
@Get(':id')           // dinâmica por último
@Get(':id/detail')    // dinâmica composta

// ❌ ERRADO
@Get(':id')           // captura tudo que vier antes
@Get('summary')       // nunca será alcançada
```

---

## 6. Tratamento de Erros

Use as exceções do NestJS — nunca lance `Error` genérico.

| Situação                 | Exceção                 |
| ------------------------ | ----------------------- |
| Recurso não encontrado   | `NotFoundException`     |
| Usuário sem permissão    | `ForbiddenException`    |
| Dados inválidos (lógica) | `BadRequestException`   |
| Conflito de dados        | `ConflictException`     |
| Não autenticado          | `UnauthorizedException` |

```typescript
// ✅ CORRETO
if (!item) throw new NotFoundException("Consolidação não encontrada");
if (item.userId !== userId) throw new ForbiddenException("Acesso negado");

// ❌ ERRADO
if (!item) throw new Error("not found");
```

---

## 7. Operações Atômicas com Prisma

Sempre que uma operação envolve múltiplas escritas no banco,
use `prisma.$transaction` para garantir atomicidade.

```typescript
// No Repository — transações atômicas
async confirmPayment(budgetItemId: string, transactionData: Prisma.TransactionCreateInput) {
  return this.prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({ data: transactionData });
    await tx.budgetItem.update({
      where: { id: budgetItemId },
      data: { status: 'PAID', transactionId: transaction.id },
    });
    return transaction;
  });
}
```

---

## 8. Campos Decimal do Prisma

Campos `Decimal` do Prisma chegam como objetos, não como `number`.
**Sempre** converter antes de qualquer operação aritmética.

```typescript
// ❌ ERRADO — concatena strings em vez de somar
const total = items.reduce((acc, i) => acc + i.amount, 0);

// ✅ CORRETO
const total = items.reduce((acc, i) => acc + Number(i.amount), 0);
```

---

## 9. Datas e Timezone

O banco armazena datas em UTC. Sempre use métodos UTC para evitar
offset do timezone do servidor.

```typescript
// ❌ ERRADO — timezone-dependent
const month = date.getMonth() + 1;
const year = date.getFullYear();

// ✅ CORRETO — sempre UTC
const month = date.getUTCMonth() + 1;
const year = date.getUTCFullYear();

// Normalizar para meia-noite UTC ao receber datas da API
function toMidnightUTC(date: Date | string): Date {
  const str = typeof date === "string" ? date : date.toISOString();
  return new Date(str.split("T")[0] + "T00:00:00.000Z");
}
```

---

## 10. Convenções de Nomenclatura

| Elemento   | Convenção                | Exemplo                             |
| ---------- | ------------------------ | ----------------------------------- |
| Arquivos   | kebab-case               | `consolidation.service.ts`          |
| Classes    | PascalCase               | `ConsolidationService`              |
| Métodos    | camelCase                | `findByUserId`                      |
| Variáveis  | camelCase                | `budgetItems`                       |
| Constantes | UPPER_SNAKE              | `MAX_INSTALLMENTS`                  |
| Enums      | PascalCase + UPPER_SNAKE | `BudgetItemStatus.PENDING`          |
| Rotas HTTP | kebab-case               | `/budget-items/:id/confirm-payment` |

---

## 11. O que nunca fazer

```typescript
// ❌ Sem `any` explícito
async findAll(): Promise<any> { ... }

// ❌ Service chamando Prisma diretamente
constructor(private prisma: PrismaService) {} // só no Repository

// ❌ Lógica de negócio no Controller
@Post()
create(@Body() dto) {
  if (!dto.amount) throw ...; // isso é responsabilidade do Service/DTO
}

// ❌ Rotas estáticas após dinâmicas
@Get(':id')
@Get('fixed-route') // nunca será alcançada

// ❌ Scripts Python/shell para editar arquivos TypeScript
// Sempre use str_replace diretamente

// ❌ console.log em produção
// Use Logger do NestJS: private readonly logger = new Logger(NomeService.name)
```

---

## 12. Logger

Use o Logger do NestJS — nunca `console.log`.

```typescript
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class NomeService {
  private readonly logger = new Logger(NomeService.name);

  async create(dto: CreateNomeDto) {
    this.logger.log(`Criando item: ${dto.description}`);
    try {
      return await this.nomeRepository.create(dto);
    } catch (error) {
      this.logger.error("Erro ao criar item", error);
      throw error;
    }
  }
}
```
