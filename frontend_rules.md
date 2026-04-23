# OrganizAE — Frontend: Arquitetura e Padrões de Código

> Estas regras se aplicam a todo código novo e a refatorações do frontend React.
> O agente deve ler este arquivo antes de criar ou editar qualquer arquivo no frontend.

---

## 1. Stack e Versões

| Tecnologia        | Uso                                      |
| ----------------- | ---------------------------------------- |
| React 18          | Framework principal                      |
| TypeScript strict | Linguagem — sem `any` explícito          |
| Vite              | Build tool                               |
| React Router v6   | Roteamento                               |
| Tailwind CSS      | Estilização — via classes utilitárias    |
| shadcn/ui         | Biblioteca de componentes base           |
| Axios             | HTTP client (via wrapper `api`)          |
| Sonner            | Notificações toast                       |
| Lucide React      | Ícones                                   |

---

## 2. Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/              ← componentes shadcn — NUNCA editar diretamente
│   ├── consolidation/   ← componentes específicos do módulo
│   ├── dashboard/       ← componentes específicos do dashboard
│   ├── entries/         ← componentes específicos de lançamentos
│   └── Layout.tsx       ← layout global com sidebar + mobile header
├── context/
│   └── AuthContext.tsx  ← contexto de autenticação global
├── hooks/
│   └── use[Feature].ts  ← custom hooks por feature
├── lib/
│   ├── api.ts           ← cliente HTTP — único ponto de acesso à API
│   ├── types.ts         ← todos os tipos TypeScript do domínio
│   └── utils.ts         ← funções utilitárias (formatCurrency, formatDateOnly, cn)
└── pages/
    └── [Feature]Page.tsx ← páginas — orquestram hooks e componentes
```

### Responsabilidades de cada camada

```
Page       →  orquestra hooks, gerencia estado de UI (modais, tabs), não faz fetch diretamente
Hook       →  todo fetch, estado de dados, lógica de negócio do cliente
Component  →  recebe props, renderiza UI, emite callbacks — sem fetch direto
lib/api    →  único ponto de acesso HTTP — nenhum componente/page chama axios diretamente
lib/types  →  fonte única de verdade para todos os tipos — sem tipos inline em componentes
```

**Regra absoluta:** nenhum componente ou page importa `axios` diretamente.
Todo acesso HTTP passa pelo `api` de `@/lib/api`.

---

## 3. Paleta de Cores

O projeto usa CSS variables definidas no `index.css`. Use sempre as variáveis semânticas, nunca valores hex hardcoded fora do CSS.

### Variáveis do tema (light mode)

| Variável              | HSL                | Uso                                      |
| --------------------- | ------------------ | ---------------------------------------- |
| `--background`        | `120 5% 96%`       | Fundo da aplicação                       |
| `--foreground`        | `138 24% 14%`      | Texto principal                          |
| `--card`              | `0 0% 100%`        | Fundo de cards                           |
| `--primary`           | `153 40% 30%`      | Cor primária (verde escuro)              |
| `--primary-foreground`| `0 0% 100%`        | Texto sobre primary                      |
| `--secondary`         | `138 50% 90%`      | Verde claro — backgrounds secundários   |
| `--muted`             | `138 10% 92%`      | Backgrounds neutros, skeletons          |
| `--muted-foreground`  | `148 17% 48%`      | Textos secundários, placeholders        |
| `--accent`            | `148 37% 61%`      | Verde médio — destaques                 |
| `--destructive`       | `0 84% 60%`        | Vermelho — ações destrutivas            |
| `--border`            | `138 12% 88%`      | Bordas                                  |

### Cores fixas da sidebar (hardcoded — intencional)

```
Sidebar background:  #1B4332   (verde escuro)
Active nav item:     #0D2B1F   (verde mais escuro)
Active nav border:   #74C69D   (verde claro — accent da sidebar)
Income icon color:   #74C69D
Expense icon color:  #ff7c7c
```

### Convenções de cor semântica no código

```tsx
// ✅ CORRETO — via classes Tailwind com variáveis
<p className="text-green-600">Receita</p>          // valores positivos / income
<p className="text-red-600">Despesa</p>            // valores negativos / expense
<p className="text-amber-600">Pendente</p>         // status pendente
<p className="text-muted-foreground">Secundário</p>// textos auxiliares
<p className="text-primary">Destaque</p>           // cor primária do tema

// ❌ ERRADO — hex hardcoded em className
<p style={{ color: '#1B4332' }}>Texto</p>
```

**Exceção permitida:** `style` com cores fixas da sidebar (`#1B4332`, `#0D2B1F`) no `Layout.tsx` porque são independentes do tema.

---

## 4. Padrão de Custom Hooks

Todo hook de feature segue este template:

```typescript
// src/hooks/useFeature.ts
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { FeatureType } from '@/lib/types';

export function useFeature() {
  const [data, setData] = useState<FeatureType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<FeatureType>('/endpoint');
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(async (payload: unknown) => {
    await api.post('/endpoint', payload);
    toast.success('Operação realizada');
    await fetchData(); // re-fetch após mutação
  }, [fetchData]);

  return { data, isLoading, error, mutate };
}
```

### Regras de hooks

- Nome sempre `use` + PascalCase da feature: `useConsolidation`, `useDashboard`
- Estado de loading separado por operação se necessário: `isLoading`, `isResetting`, `isSaving`
- Sempre usar `cancelled` flag em `useEffect` com fetch assíncrono para evitar race conditions:
  ```typescript
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // ...
      if (!cancelled) setData(result);
    };
    load();
    return () => { cancelled = true; };
  }, [deps]);
  ```
- Erros de fetch: capturar, setar `error` state e chamar `toast.error()`
- Mutações bem-sucedidas: sempre chamar `toast.success()` com mensagem clara
- Nunca expor setState diretamente — expor funções com nomes semânticos

---

## 5. Padrão de API Client

O arquivo `src/lib/api.ts` é o único ponto de acesso HTTP. Nunca importar axios diretamente.

```typescript
// ✅ CORRETO
import { api } from '@/lib/api';
const data = await api.get<MinhaInterface>('/endpoint');
await api.post('/endpoint', payload);
await api.patch('/endpoint', payload);
await api.delete('/endpoint');

// ❌ ERRADO
import axios from 'axios';
axios.get('/api/endpoint');

// ❌ ERRADO
fetch('/api/endpoint');
```

O interceptor do axios já trata erros e extrai a mensagem do backend automaticamente.
Não precisa fazer `error.response?.data?.message` nos componentes — apenas `error.message`.

---

## 6. Tipagem

Todos os tipos de domínio vivem em `src/lib/types.ts`. Nunca criar interfaces inline em componentes para dados da API.

```typescript
// ✅ CORRETO — importar de types.ts
import { BudgetItem, ConsolidationSummary } from '@/lib/types';

// ❌ ERRADO — interface inline no componente
interface MyLocalBudgetItem {
  id: string;
  amount: number;
  // ...duplicação
}
```

### Tipos que já existem (não recriar)

`CategoryType`, `TransactionType`, `ExpenseType`, `RuleType`, `RecurrenceType`,
`Member`, `Category`, `TransactionRule`, `TransactionRuleFull`, `Transaction`,
`AuthUser`, `ConsolidationStatus`, `BudgetItemStatus`, `BudgetItemTransaction`,
`BudgetItem`, `MonthlyConsolidation`, `ConsolidationSummary`, `DailyFlow`

---

## 7. Componentes shadcn/ui disponíveis

Os seguintes componentes já estão instalados em `src/components/ui/`:

`accordion`, `alert-dialog`, `badge`, `button`, `card`, `dialog`,
`input`, `label`, `popover`, `progress`, `select`, `sheet`

**Nunca instalar um componente shadcn que já existe.**
**Nunca editar arquivos em `src/components/ui/` diretamente.**

Para adicionar novo componente shadcn: `npx shadcn-ui@latest add nome-do-componente`

---

## 8. Mobile First e Responsividade

O layout usa sidebar fixa no desktop e Sheet (drawer) no mobile com header fixo.

### Breakpoints usados

| Breakpoint | Tailwind | Uso                              |
| ---------- | -------- | -------------------------------- |
| < 768px    | (base)   | Mobile — header fixo de 56px    |
| ≥ 768px    | `md:`    | Desktop — sidebar de 224px      |
| ≥ 1024px   | `lg:`    | Large — layouts de 2 colunas    |

### Regras obrigatórias de responsividade

```tsx
// ✅ Padding que compensa o header mobile fixo
<main className="pt-14 px-4 pb-6 md:pt-6 md:px-6 md:pb-8">

// ✅ Grid responsivo
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// ✅ Flex responsivo
<div className="flex flex-col sm:flex-row sm:items-center gap-3">

// ✅ Texto truncado em containers pequenos
<p className="truncate">Nome longo aqui</p>

// ❌ ERRADO — layout que quebra em mobile
<div className="grid grid-cols-4 gap-4">  // sem fallback mobile
```

### Touch targets

Botões e links interativos devem ter área mínima de toque de 44×44px em mobile.
Use `h-10 min-w-10` ou `h-8 px-3` no mínimo para elementos interativos.

---

## 9. Padrão de Loading States

Sempre implementar skeleton loading — nunca deixar tela em branco durante fetch.

```tsx
// ✅ Skeleton de cards
function LoadingCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-4">
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ✅ Skeleton de linhas
function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 rounded-lg border p-3">
          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
          <div className="h-4 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}
```

Botões em operações assíncronas sempre recebem `disabled={isLoading}` enquanto a operação ocorre.

---

## 10. Segurança

### Autenticação

- Token de sessão armazenado **exclusivamente** em cookie `httpOnly` — nunca em `localStorage` ou `sessionStorage`
- Cookie configurado com `sameSite: 'strict'` e `maxAge` de 7 dias
- Axios configurado com `withCredentials: true` para enviar o cookie automaticamente
- **Nunca** armazenar token JWT, dados do usuário sensíveis ou credenciais em `localStorage`

```typescript
// ✅ CORRETO — cookie httpOnly (configurado no backend)
res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

// ❌ ERRADO — nunca fazer isso no frontend
localStorage.setItem('token', token);
sessionStorage.setItem('user', JSON.stringify(user));
```

### Proteção de rotas

Toda rota privada passa pelo componente `PrivateRoute` que verifica `user` do `AuthContext`.
Durante o carregamento inicial (`loading: true`), mostrar spinner — nunca redirecionar prematuramente.

```tsx
// ✅ CORRETO — verificar loading antes de redirecionar
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;      // aguarda verificação
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

// ❌ ERRADO — redireciona antes de verificar
function PrivateRoute({ children }) {
  const { user } = useAuth();           // loading ignorado
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

### XSS

- Nunca usar `dangerouslySetInnerHTML` com dados vindos da API
- Nunca interpolar strings da API diretamente em atributos `href` sem validação
- Dados do usuário exibidos via JSX são escapados automaticamente pelo React — não precisa sanitizar para renderização

### Dados sensíveis

- Nunca logar dados do usuário no console em produção
- Nunca expor email, ID ou dados pessoais em URLs (query params visíveis)
- IDs de recursos em URLs são aceitáveis (ex: `/consolidation/:id`)

---

## 11. Tratamento de Erros

```tsx
// ✅ Padrão em handlers de evento
const handleAction = async () => {
  try {
    await someHookMethod();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro inesperado');
  }
};

// ✅ Padrão em hooks (captura + estado de erro)
} catch (err) {
  const msg = err instanceof Error ? err.message : 'Erro desconhecido';
  setError(msg);
  toast.error(msg);
}

// ❌ ERRADO — engolir erros silenciosamente
} catch (err) {
  console.log(err); // usuário nunca sabe o que aconteceu
}

// ❌ ERRADO — alert/confirm nativos do browser (exceto casos já existentes)
window.alert('Erro!');
window.confirm('Tem certeza?'); // usar AlertDialog do shadcn
```

**Nota:** O uso de `window.prompt` e `window.confirm` já existente no `ConsolidationPage` deve ser refatorado para modais shadcn (`Dialog`, `AlertDialog`) em iterações futuras.

---

## 12. Formatação e Utilitários

Funções utilitárias disponíveis em `@/lib/utils`:

```typescript
// Formatar moeda brasileira
formatCurrency(1234.56) // → "R$ 1.234,56"

// Formatar data (sem timezone shift)
formatDateOnly(isoString, { day: 'numeric', month: 'short' }) // → "15 jan"
formatDateOnly(isoString, { day: 'numeric', month: 'long', year: 'numeric' }) // → "15 de janeiro de 2026"

// Merge de classes Tailwind
cn('base-class', condition && 'conditional-class') // → string de classes mescladas
```

Nunca reimplementar formatação de moeda ou data inline em componentes.

---

## 13. Convenções de Nomenclatura

| Elemento          | Convenção    | Exemplo                        |
| ----------------- | ------------ | ------------------------------ |
| Arquivos/Pastas   | PascalCase   | `ConsolidationPage.tsx`        |
| Hooks             | camelCase    | `useConsolidation.ts`          |
| Utilitários       | camelCase    | `api.ts`, `utils.ts`           |
| Componentes       | PascalCase   | `function ItemRow()`           |
| Props interfaces  | PascalCase   | `interface ItemRowProps`       |
| Variáveis/funções | camelCase    | `handleConfirmPayment`         |
| Constantes        | UPPER_SNAKE  | `MONTH_NAMES`                  |
| CSS classes       | kebab-case   | `border-primary`               |

---

## 14. O que nunca fazer

```typescript
// ❌ Sem `any` explícito
const data: any = await api.get('/endpoint');

// ❌ Fetch direto sem o wrapper api
fetch('/api/consolidations');
axios.get('/api/consolidations');

// ❌ Token em localStorage
localStorage.setItem('token', jwt);

// ❌ Tipos inline para dados da API
const [items, setItems] = useState<{ id: string; name: string }[]>([]);

// ❌ Editar arquivos em src/components/ui/
// São gerados pelo shadcn — alterações são sobrescritas

// ❌ console.log em produção
console.log('dados do usuário:', user);

// ❌ dangerouslySetInnerHTML com dados da API
<div dangerouslySetInnerHTML={{ __html: apiData.description }} />

// ❌ Layout sem suporte mobile (esquecer pt-14 no main)
<main className="p-6">  // quebra no mobile por causa do header fixo

// ❌ Cores hardcoded fora do Layout
<div className="bg-[#1B4332]">  // usar bg-primary ou variável semântica
```

---

## 15. Checklist antes de abrir PR

- [ ] Nenhum `any` explícito no TypeScript
- [ ] Todos os tipos de API importados de `@/lib/types`
- [ ] Nenhum `fetch` ou `axios` direto — somente `api.*`
- [ ] Loading states implementados com skeleton
- [ ] Erros capturados e exibidos via `toast.error()`
- [ ] Layout testado em mobile (< 768px) — sem overflow horizontal
- [ ] Dados sensíveis ausentes em `localStorage`/`sessionStorage`
- [ ] Nenhum `console.log` com dados de usuário