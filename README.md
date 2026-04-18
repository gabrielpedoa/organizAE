# OrganizAE

OrganizAE é um aplicativo de finanças pessoais em monorepo. Ele permite gerenciar receitas e despesas de membros da casa, incluindo lançamentos recorrentes e parcelamentos.

## Estrutura

- `backend/` — API REST em NestJS com Prisma e PostgreSQL
- `frontend/` — aplicação React + Vite + Tailwind

## Como rodar
... em construção.

## Observações

- A API usa autenticação JWT com cookie `httpOnly`
- O frontend faz requisições para `/api/*`
- O projeto já inclui configuração de categorias, membros e transações
