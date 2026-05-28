# Ice Cream Cone Anti-Pattern

A pirâmide de testes invertida: tudo é E2E, quase nada é unit. Testes são lentos, frágeis e qualquer mudança na camada mais externa derruba toda a suite.

```
        /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\         ← Testes manuais / exploratórios
       /   Testes E2E (MUITOS) \       ← Tudo testado via HTTP + banco real
      /__________________________\
     /   Integration Tests (poucos) \   ← Alguns testes de integração
    /________________________________\
   |      Unit Tests (nenhum)          |  ← Regras de negócio sem cobertura isolada
   |___________________________________|

   ❌ Ice Cream Cone — invertido, pesado no topo
```

## Por que é um problema?

- **Suite lenta**: cada teste sobe HTTP, conecta ao banco, insere seed data. Uma suite com 50 cenários pode levar minutos.
- **Fragilidade**: se a rota muda de `/appointments` para `/v2/appointments`, TODOS os testes quebram — mesmo que a regra de negócio não tenha mudado.
- **Feedback impreciso**: um teste E2E falha, mas o erro está na validação de status? No banco? Na serialização da resposta? Difícil saber.
- **Acoplamento forte**: testes dependem de controller + service + repository + banco, todos ao mesmo tempo.


## Como se manifesta no código?

### Exemplo: testar a taxa de cancelamento via E2E (❌ anti-pattern)

No `AppointmentService`, existe uma regra: se cancelar com menos de 24h de antecedência, cobra 50% de taxa. No Ice Cream Cone, testamos essa regra **apenas** via request HTTP:

```typescript
// ❌ ICE CREAM CONE — teste E2E para uma regra de negócio pura
describe('PATCH /appointments/:id/cancel', () => {
  it('deve cobrar taxa de 50% quando cancela com menos de 24h', async () => {
    // 1. Precisa criar um paciente no banco
    const patient = await request(app).post('/patients').send({
      name: 'João Silva',
      cpf: '12345678900',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      phone: '11999999999',
      email: 'joao@email.com',
    })

    // 2. Precisa criar um médico no banco
    const doctor = await request(app).post('/doctors').send({
      name: 'Dra. Maria',
      crm: 'CRM12345',
      specialty: 'CARDIOLOGY',
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
      consultationDuration: 30,
    })

    // 3. Precisa agendar um appointment para daqui 2h
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'CHECKUP',
    })

    // 4. Finalmente, cancela
    const res = await request(app)
      .patch(`/appointments/${appointment.body.id}/cancel`)
      .send({ reason: 'Imprevisto' })

    // 5. Valida a taxa
    expect(res.status).toBe(200)
    expect(res.body.fee).toBe(0.5) // 50%
  })

  it('não deve cobrar taxa quando cancela com mais de 24h', async () => {
    // ... repete TODO o setup acima novamente ...
    // Paciente, médico, agendamento para daqui 48h, cancelamento...
  })
})
```

**Problemas desse teste:**
- ~30 linhas de setup para testar 1 linha de lógica (`hoursUntilAppointment < 24 ? 0.5 : 0`)
- Depende do banco, do Express, das rotas, dos controllers
- Se a rota `/patients` quebrar, o teste de cancelamento também quebra
- Roda em ~500ms+ ao invés de ~5ms

### Como DEVERIA ser testado (✅ teste unitário)

```typescript
// ✅ CORRETO — teste unitário isolado da regra de negócio
describe('AppointmentService.cancel', () => {
  it('deve cobrar taxa de 50% quando cancela com menos de 24h', async () => {
    const appointmentIn2Hours = {
      id: 1,
      status: AppointmentStatus.SCHEDULED,
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // daqui 2h
    }

    // Mock apenas do repositório
    mockAppointmentRepo.findById.mockResolvedValue(appointmentIn2Hours)
    mockAppointmentRepo.update.mockResolvedValue({
      ...appointmentIn2Hours,
      status: AppointmentStatus.CANCELLED,
    })

    const result = await service.cancel(1, { reason: 'Imprevisto' })

    expect(result.fee).toBe(0.5) // 50% — testou a REGRA, não a rota
  })
})
```

**5 linhas de setup, foco na regra, roda em ~5ms.**


## Sinais de alerta

Você está no Ice Cream Cone se:

- [ ] Precisa subir o banco/Docker para rodar **qualquer** teste
- [ ] A suite completa leva mais de 2 minutos
- [ ] Um teste E2E quebrou, mas você não consegue identificar qual regra de negócio falhou
- [ ] Para testar uma regra simples (ex: validação de status), você precisa criar 3+ entidades no banco
- [ ] Todos os testes fazem `request(app).post(...)` — nenhum testa service/repository isolado
- [ ] Quando uma rota muda de nome, dezenas de testes quebram
- [ ] Você tem medo de rodar os testes porque são lentos e instáveis


## Como corrigir?

Inverter a pirâmide para o formato correto (**Cupcake** ou **Pirâmide de Testes**):

```
   /‾‾‾‾‾‾‾‾\               ← Poucos testes E2E (fluxos críticos)
  /  E2E Tests \
 /________________\
 |  Integration    |          ← Testes de integração (service + repo)
 |_________________|
 |                  |
 |   Unit Tests     |         ← MUITOS testes unitários (regras de negócio)
 |   (base sólida)  |
 |__________________|

 ✅ Pirâmide correta — pesada na base
```

- **Unit**: testar regras puras (taxa de cancelamento, transições de status, validações)
- **Integration**: testar service + repository com banco real
- **E2E**: apenas fluxos críticos de ponta a ponta (agendar + confirmar + completar)

Veja os exemplos na pasta `../cupcake/` para a abordagem correta.