# Just Unit Test Anti-Pattern

Testar **só no nível unitário, com mock**, um código cujo comportamento mora no banco. O teste fica verde, rápido e isolado — mas não prova nada: você mockou justamente a peça que continha o risco. Também conhecido como **"The Mockery"** (mockar tanto que o teste deixa de testar o sistema e passa a testar o próprio mock) ou _over-mocking_.

O problema não é "unit test é ruim". Unit test é ótimo — **para lógica pura**. O antipattern é usar unit + mock para SQL, agregação, JOIN, transação: coisas que só existem de verdade contra um banco real. Aí o mock corta o teste exatamente antes de onde o bug vive.

```
   O QUE O TESTE "SÓ UNIT" EXERCITA          O QUE RODA EM PRODUÇÃO
   ───────────────────────────────          ──────────────────────

        ┌───────────────┐                     ┌───────────────┐
        │ AnalyticsSvc  │                     │ AnalyticsSvc  │
        │  Math.round() │  ← só isto          │  Math.round() │
        └───────┬───────┘     é testado       └───────┬───────┘
                │                                      │
        ╳╳╳╳╳╳╳╳▼╳╳╳╳╳╳╳╳  ← o MOCK corta aqui         │
        ┌───────────────┐                      ┌───────▼───────┐
        │  mock devolve │                      │  QueryBuilder │
        │  { count: 10 }│                      │ WHERE/IN/AVG  │
        └───────────────┘                      └───────┬───────┘
            ✅ verde                                    │
                                               ┌───────▼───────┐
   A SQL, o WHERE, o BETWEEN, o EXTRACT:       │   Postgres    │ ← o BUG
   nada disso roda no teste.                   │ (dados reais) │   mora aqui
                                               └───────────────┘
```

## Por que acontece?

- **Caminho de menor resistência**: unit com mock é rápido e não precisa subir banco/Docker. Integração "dá trabalho" — então mocka-se tudo.
- **"Mockar é boa prática" levado ao extremo**: a regra "isole a unidade" vira "isole de tudo", inclusive da query que _é_ a unidade de comportamento ali.
- **A métrica de cobertura recompensa o errado**: o mock faz as linhas executarem, então o `% de cobertura` sobe — mesmo sem nenhum número ter sido validado contra dados reais.
- **Medo de teste de integração** ("é lento", "é flaky", "precisa de banco") — quando o helper `../helpers/db.ts` já resolve setup, truncate e teardown.

## Por que é um problema?

- **Falsa sensação de segurança**: verde no CI, vermelho em produção. É o pior tipo de teste — o que **mente**.
- **Tautológico**: o teste afirma o que você mesmo programou no mock. `mock devolve 10 → espero 10`. Não existe descoberta possível; o assert vira a aritmética do JavaScript (`Math.round`, divisão, `.length`), não a regra de negócio.
- **Cego para a classe de bug mais comum dessa camada**: status errado no `WHERE`, boundary de `BETWEEN`, coluna que não mapeia no ORM (`endTime` → `end_time`), `JOIN` errado, `NULL` não tratado, SQL específico de Postgres que nem roda.
- **Acopla no "como", não no "o quê"**: o mock simula a estrutura interna (a cadeia `.where().andWhere().getCount()`). Trocar `getCount()` por `getRawOne()` quebra o teste mesmo com o comportamento certo. É frágil para refactor **e** inútil para detecção.
- **Custo de manutenção sem retorno**: você mantém um mock elaborado (simular a cadeia inteira do TypeORM) que tem poder de detecção de bug ≈ zero.

## Como se manifesta no código?

### Exemplo: a taxa de no-show via `AnalyticsService`

`AnalyticsService.getNoShowRate` (em `../../analytics/AnalyticsService.ts`) faz dois `COUNT` no banco e divide um pelo outro. Repare que **toda a regra mora na SQL** — quem entra no denominador, o range de datas, o filtro de status:

```typescript
const total = await this.appointmentRepo.createQueryBuilder('a')
  .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
  .andWhere('a.status IN (:...statuses)', { statuses: [COMPLETED, NO_SHOW] }) // ← a regra
  .getCount()
const noShows = await this.appointmentRepo.createQueryBuilder('a')
  .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
  .andWhere('a.status = :status', { status: NO_SHOW })
  .getCount()
return { totalAppointments: total, noShows, noShowRate: Math.round((noShows / total) * 100) }
```

No antipattern, "testa-se" isso mockando os `getCount`:

```typescript
// ❌ JUST UNIT — mocka o QueryBuilder e asserta nos números que o mock inventou
it('calcula a taxa de no-show', async () => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn()
      .mockResolvedValueOnce(10)  // "total"   ← você inventou 10
      .mockResolvedValueOnce(3),  // "noShows" ← você inventou 3
  }
  jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
    createQueryBuilder: () => qb,
  } as any)

  const result = await new AnalyticsService().getNoShowRate(start, end)

  expect(result.noShowRate).toBe(30) // 3/10 = 30%
})
```

**O que esse teste realmente prova?** Que `Math.round((3 / 10) * 100) === 30`. Ou seja: que a divisão do JavaScript funciona. Os números `10` e `3` foram **digitados por você**. A query — que decide o que vira `10` e o que vira `3` — foi substituída por `mockResolvedValueOnce`.

**Os bugs que passam batido (todos deixam o teste verde):**

- O denominador deveria contar só `COMPLETED + NO_SHOW`. Se alguém trocar por `status != CANCELLED`, os `SCHEDULED` entram e a taxa muda — **o teste não percebe**, porque você nunca exercitou status nenhum: cravou `10`.
- Se o `BETWEEN` incluir/excluir os boundaries errado, **passa**.
- Se a coluna `dateTime` não mapear para `date_time` no banco, **passa** no teste e explode em produção.

> **Apague a query inteira e deixe `return { totalAppointments: 10, noShows: 3, ... }`. O teste continua verde.** Esse é o cheiro: o teste não enxerga a query.

### O golpe de misericórdia: `getAverageConsultationTime`

```typescript
.select('AVG(EXTRACT(EPOCH FROM (a.endTime - a.dateTime)) / 60)', 'avgMinutes')
```

Como você "unit testa" isso? Mocka `getRawOne()` para devolver `{ avgMinutes: 30, total: 5 }`. Pronto — você acabou de **afirmar que a média é 30 porque digitou 30**. O `EXTRACT(EPOCH FROM ...)` é SQL puro de Postgres; só existe dentro do banco; nenhum mock no mundo valida se essa expressão calcula minutos direito. O teste tem poder de detecção **zero** nessa linha.

### Como DEVERIA ser testado (integração, com banco real)

```typescript
// ✅ INTEGRAÇÃO — a SQL roda de verdade contra o Postgres
import { setupDatabase, truncateDatabase, closeDatabase } from '../../helpers/db'

describe('AnalyticsService.getNoShowRate (integração)', () => {
  beforeAll(setupDatabase)
  afterEach(truncateDatabase)
  afterAll(closeDatabase)

  it('conta só COMPLETED e NO_SHOW no denominador', async () => {
    const doctor = await createDoctor()
    const patient = await createPatient()
    // 2 COMPLETED, 1 NO_SHOW, 1 CANCELLED, 1 SCHEDULED — todos dentro do range
    await createAppointment({ doctor, patient, status: COMPLETED })
    await createAppointment({ doctor, patient, status: COMPLETED })
    await createAppointment({ doctor, patient, status: NO_SHOW })
    await createAppointment({ doctor, patient, status: CANCELLED })  // não entra
    await createAppointment({ doctor, patient, status: SCHEDULED })  // não entra

    const result = await service.getNoShowRate(start, end)

    expect(result.totalAppointments).toBe(3) // 2 completed + 1 no-show — NÃO 5
    expect(result.noShows).toBe(1)
    expect(result.noShowRate).toBe(33)        // round(1/3 * 100)
  })
})
```

Agora sim a SQL rodou. Se o `IN (COMPLETED, NO_SHOW)` estiver errado, `totalAppointments` vem diferente de `3` e o teste **quebra de verdade**. Você está validando a **regra** ("o que conta como denominador") — a coisa que o mock tinha escondido de você — em vez da aritmética do JavaScript. Inseriu 5 appointments e descobriu que o denominador real é 3: isso é informação que nenhum mock te daria.

## A regra de bolso

> **Depois de mockar o repositório, o que sobrou para o teste verificar?**
>
> - Sobrou **comportamento real** (cálculo de taxa, transição de status, validação)? → unit + mock está certo.
> - Sobrou só **cola** (um `Math.round`, um `.length`, uma divisão)? → o mock comeu o comportamento. Esse caso pedia **integração**.

O contraste no próprio projeto deixa isso claro:

- `AppointmentService.cancel` → `fee = hoursUntil < 24 ? 0.5 : 0`. Lógica **pura**. Mockar o repo e testar a regra é o certo. ✅ unit
- `AppointmentService.validateStatusTransition` → consulta um mapa em memória. **Pura**. ✅ unit
- `AnalyticsService.*` → a regra vive na SQL. Mockar = testar o mock. ❌ unit / ✅ integração

## Sinais de alerta

Você está no Just Unit Test se:

- [ ] O teste mocka `createQueryBuilder` / `getRawOne` / `getRawMany` / `getCount` e asserta nos números que o **próprio mock** devolveu
- [ ] Para "testar" uma função você teve que simular a cadeia `.where().andWhere().getCount()` do TypeORM
- [ ] Se você apagasse a query e deixasse `return { count: 5 }` fixo, o teste continuaria **verde**
- [ ] O `expect` é basicamente aritmética de JS (`Math.round`, divisão, `.length`), não uma regra de negócio
- [ ] **Nenhum** teste roda a SQL contra um Postgres real
- [ ] Bugs de SQL/ORM (status errado no `WHERE`, boundary de `BETWEEN`, coluna mal mapeada, `JOIN`) só aparecem em staging/produção, nunca no CI
- [ ] A cobertura de "analytics" marca 100%, mas nenhum número foi validado contra dados reais

## Como corrigir?

- **Código cujo valor mora no banco** (queries, agregações, `JOIN`, transações) → **teste de integração** com banco real, usando `../helpers/db.ts` (`setupDatabase` / `truncateDatabase` / `closeDatabase`). Insira dados, rode a SQL, asserte o resultado.
- **Lógica pura** (taxa, transição de status, formatação, validação) → unit com mock. Onde não há banco, o mock é a ferramenta certa.
- **Pare de mockar a fronteira com o banco.** Não se testa SQL com mock — exercita-se a SQL.
- **Persiga cobertura de _comportamento_, não de _linha_.** 100% de linhas com mock pode ser 0% de comportamento validado.

## Diferença para Ice Cream Cone, Cupcake e Hourglass

- **Ice Cream Cone**: o oposto do exagero. Testa **demais** via E2E/HTTP — inclusive regras puras que deviam ser unit. Lento e frágil, teste alto demais.
- **Cupcake**: testa a **mesma** regra em todas as camadas. Excesso redundante.
- **Hourglass (ampulheta)**: base de unit cheia, topo de E2E cheio, **meio oco** — sem integração. O _Just Unit Test_ é exatamente o que **cava esse buraco**: tudo vira unit mockado, a integração nunca nasce, e os bugs de boundary entre service e banco passam direto. É a ampulheta vista de perto, dentro de um único service.

Resumindo: o ice cream cone tem teste no lugar errado (**alto** demais); o cupcake tem teste **demais** em todo lugar; o just unit test tem teste no lugar errado (**baixo** demais) — mocka a fronteira com o banco e acaba provando só a si mesmo.
