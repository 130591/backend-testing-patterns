# Cupcake Anti-Pattern

A pirâmide que virou um **bloco**: base de unit cheia, meio de integração cheio, topo de E2E cheio — e ainda uma camada gorda de teste manual por cima. A mesma regra é verificada de novo em cada nível, por times diferentes que não conversam. Parece o auge da qualidade — "testamos tudo, em todo lugar" — mas é redundância cara: você paga três ou quatro vezes pela confiança que já tinha numa camada só.

```
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\        ← Frosting: teste manual / exploratório pesado
    /   Manual (muitos)    \
   /________________________\
   |                        |
   |    E2E / UI (muitos)   |      ← Topo cheio
   |________________________|
   |                        |
   |  Integração (muitos)   |      ← Meio cheio
   |________________________|
   |                        |
   |     Unit (muitos)      |      ← Base cheia
   |________________________|

   ❌ Cupcake — cobertura máxima em TODOS os níveis (quase um quadrado)
```

Definido por Fabio Pereira (ThoughtWorks, 2014): "base grande, meio grande e topo enorme". Não é falta de uma camada — é **excesso em todas elas**.

## Por que acontece?

A causa raiz quase nunca é técnica, é organizacional: **times diferentes escrevem níveis de teste diferentes sem colaborar**.

- O time de **dev** monta sua própria pirâmide saudável: unit + integração + componente.
- O time de **QA de automação** não confia (ou não enxerga) essa pirâmide e empilha sua própria suíte de GUI/E2E por cima.
- Os **testers manuais** adicionam uma camada de teste manual/exploratório no topo, cobrindo de novo os mesmos fluxos.

Cada grupo, isolado, faz a coisa "certa" do seu ponto de vista. Somados, sem ninguém decidir *qual camada é dona de qual regra*, o resultado é o cupcake: a mesma funcionalidade provada quatro vezes.

## Por que é um problema?

- **Custo multiplicado**: a regra "médico não pode ter dois agendamentos sobrepostos" mora em 3–4 testes. Mudou a regra? Você edita unit, integração, E2E e ainda atualiza o roteiro manual. Um refactor simples vira uma maratona de manutenção.
- **Feedback lento**: a suíte fica dominada por E2E e manual, que são ordens de magnitude mais lentos que unit. O CI demora, o loop de dev trava, e aí o pessoal começa a *pular* testes — corroendo justamente a confiança que a redundância tentava comprar.
- **Falsa economia**: o relatório mostra cobertura altíssima, mas boa parte dela é repetida. Você não está cobrindo *mais* comportamento, está cobrindo o *mesmo* comportamento várias vezes.
- **Tautologia por excesso**: quando se empilha teste "só por segurança" em camadas altas, muitos acabam mockando exatamente a coisa que deveriam exercitar — e viram testes que só confirmam o próprio mock, sem provar nada novo.
- **Posse difusa**: ninguém sabe qual camada é a fonte da verdade pra uma regra. Quando algo quebra, três testes vermelhos apontam pro mesmo bug e zero deles isola a causa melhor que os outros.

## Como se manifesta no código?

### Exemplo: detecção de conflito de agendamento

A regra é uma só: `AppointmentService.schedule` chama `findConflicting(doctorId, dateTime, endTime)` e lança **409** se há sobreposição. No cupcake, essa *mesma* regra aparece em todas as camadas:

```typescript
// UNIT (repo) — tautológico: mocka o próprio findConflicting e verifica o mock
appointmentRepo.findConflicting.mockResolvedValueOnce([{ id: 1 } as any])
const result = await appointmentRepo.findConflicting(1, dateTime, endTime)
expect(result).toHaveLength(1) // não provou nada além do que você mesmo definiu

// UNIT (service) — mesma regra: conflito → 409, com repo mockado
appointmentRepo.findConflicting.mockResolvedValue([{ id: 1 } as any])
await expect(service.schedule(...)).rejects.toMatchObject({ statusCode: 409 })

// E2E — mesma regra de novo: agenda em cima de outro → 409 via HTTP + banco real
await request(app).post('/appointments').send({ ... })
const res = await request(app).post('/appointments').send({ /* mesmo horário */ })
expect(res.status).toBe(409)

// + MANUAL — o QA ainda clica no fluxo e confirma o 409 a cada release
```

**Cobertura aparente: ✅✅✅. Comportamento novo provado a cada teste: só o do meio.**

O problema não é nenhum teste individual estar errado — é que "conflito → 409" foi provado quatro vezes. O custo de manter quadruplicou, o tempo de CI inflou, e quando a regra mudar você vai caçar todas as cópias. A pirâmide saudável escolheria **um dono** por peça da regra.

### Como DEVERIA ser distribuído (empurrando pra baixo)

Cada teste no nível mais baixo que dá confiança, **sem repetir**:

```typescript
// INTEGRATION — dono da query de sobreposição (service + repo + banco real, sem HTTP)
it('detecta sobreposição parcial', async () => {
  await createAppointment({ dateTime: '10:00', duration: 30 })   // 10:00–10:30
  await expect(service.schedule({ ..., dateTime: '10:15' }))     // 10:15–10:45
    .rejects.toThrow(/already has/)
})

it('permite agendamento que começa exatamente quando o anterior termina', async () => {
  await createAppointment({ dateTime: '10:00', duration: 30 })   // 10:00–10:30
  await expect(service.schedule({ ..., dateTime: '10:30' }))     // 10:30–11:00
    .resolves.toBeDefined()
})

// UNIT — dono das decisões puras (sem banco): dado um conflito, vira 409
appointmentRepo.findConflicting.mockResolvedValue([{ id: 1 } as any])
await expect(service.schedule(...)).rejects.toMatchObject({ statusCode: 409 })

// E2E — UM smoke test só, provando a fiação controller → service → repo
const res = await request(app).post('/appointments').send({ /* mesmo horário */ })
expect(res.status).toBe(409)
```

Repara: o E2E continua existindo, mas como **um** teste de fiação, não como a enésima prova da regra de sobreposição. Os casos de boundary (sobreposição parcial, início == fim, ignorar `CANCELLED`) vivem na integração, onde são baratos e diretos — não replicados em E2E lento nem em roteiro manual.

## Sinais de alerta

Você está no Cupcake se:

- [ ] O mesmo cenário aparece em `unit/`, `integration/` **e** `e2e/`
- [ ] Mudar uma regra de negócio te obriga a editar testes em 3+ arquivos/camadas
- [ ] A suíte demora muito, dominada por E2E e teste manual
- [ ] Times diferentes (dev, QA automação, QA manual) escrevem camadas diferentes sem combinar onde cada teste deve morar
- [ ] Tem teste de camada alta que mocka justamente o que deveria exercitar (tautológico)
- [ ] A frase "vamos adicionar um E2E só por segurança" aparece mesmo quando unit + integração já cobrem o caso
- [ ] Quando algo quebra, vários testes em camadas diferentes ficam vermelhos pelo mesmo motivo, e nenhum isola melhor que os outros

## Como corrigir?

O remédio é mais **colaboração** que código. Tweak de volta pra pirâmide:

- **Decidir junto o nível certo de cada teste**: dev e QA combinam, por cenário, qual é a camada mais baixa que dá confiança — e escrevem ali, uma vez só.
- **Um dono por regra**: a query de sobreposição é da integração; as decisões puras são do unit; o E2E faz smoke de fiação; o manual fica só pra exploratório de verdade (descobrir o que automação não pensou).
- **Empurrar pra baixo e deletar duplicatas**: todo teste de camada alta que só reprova algo já coberto embaixo deve descer ou sumir.
- **Quebrar os silos**: pairing cross-role, kickoff de história junto, trabalhar em sincronia em vez de mini-waterfall (dev termina → joga pro QA testar tudo de novo).

```
         /‾‾‾‾‾‾\
        /  E2E   \              ← Poucos, smoke tests de fiação
       /__________\
      /            \
     /  Integration \           ← Regras com banco/query/transação, sem duplicar
    /________________\
   /                  \
  /   Unit (muitos)    \        ← Base sólida: lógica pura
 /______________________\

 ✅ Pirâmide correta — cada regra com um dono, sem repetição
```

## Diferença para Ice Cream Cone e Hourglass

Os três têm o mesmo sintoma de fundo (estratégia de teste ruim), mas formas e causas distintas:

- **Ice Cream Cone**: pirâmide invertida, **sem base** de unit. Tudo é UI/E2E e manual. Lento e frágil — automação concentrada no nível mais caro.
- **Hourglass (ampulheta)**: base de unit cheia e topo de E2E cheio, **meio oco** — quase nenhuma integração. O buraco esconde os bugs de boundary entre service e banco (FK, índices, mapeamento ORM, contrato de query).
- **Cupcake**: base, meio **e** topo todos cheios. Não falta camada — **sobra repetição**. Causado por silos de time, não por esquecer a integração.

Resumindo: o ice cream cone tem teste no lugar errado; o hourglass tem teste de menos no lugar certo; o cupcake tem teste **demais**, cobrindo a mesma coisa em todo lugar.