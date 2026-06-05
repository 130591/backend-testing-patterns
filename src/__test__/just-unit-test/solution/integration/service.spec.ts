import { AnalyticsService } from "../../../../analytics/AnalyticsService"
import { closeDatabase, setupDatabase, truncateDatabase } from "../../../helpers/db"
import { createAppointment, createDoctor, createPatient, createPatientWithAppointments } from "../../../helpers/seed"


describe("AnalyticsService", () => {
  beforeAll(setupDatabase)
  // Limpa ANTES de cada teste: garante slate limpo mesmo se o suite anterior
  // (e2e) deixou resíduo, já que eles também truncam no beforeEach.
  beforeEach(truncateDatabase)
  afterAll(closeDatabase)
  
  it("deve calcular a taxa de no-show", async () => {
    const doctor = await createDoctor()
    const patient = await createPatient()

    await createAppointment({ doctor, patient, status: 'COMPLETED' })
    await createAppointment({ doctor, patient, status: 'COMPLETED' })
    await createAppointment({ doctor, patient, status: 'NO_SHOW' })
    await createAppointment({ doctor, patient, status: 'CANCELLED' })
    await createAppointment({ doctor, patient, status: 'SCHEDULED' })

    const service = new AnalyticsService()

    const result = await service.getNoShowRate(new Date('2025-01-01'), new Date('2025-12-31'))
    expect(result).toMatchObject({
      totalAppointments: 3,
      noShows: 1,
      noShowRate: 33
    })
  })

  it("deve calcular estatísticas de pacientes", async () => {
    const doctor = await createDoctor()
    const patient = await createPatient()
    await createPatientWithAppointments({ ...patient })

    const service = new AnalyticsService()
    const result = await service.getPatientStats(new Date('2025-01-01'), new Date('2025-12-31'))

    expect(result).toMatchObject({
     newPatients: 1,
     activePatients: 0,
     returningPatients: 0
    })
  })
})