import { Service } from 'typedi'
import { FhirClient } from './FhirClient'
import { FhirMapper } from './FhirMapper'
import { PatientRepository } from '../repositories/PatientRepository'
import { DoctorRepository } from '../repositories/DoctorRepository'
import { AppError } from '../errors/AppError'

@Service()
export class FhirSyncService {
  constructor(
    private readonly fhirClient: FhirClient,
    private readonly fhirMapper: FhirMapper,
    private readonly patientRepository: PatientRepository,
    private readonly doctorRepository: DoctorRepository,
  ) {}

  async exportPatient(patientId: number): Promise<Record<string, unknown>> {
    const patient = await this.patientRepository.findById(patientId)
    if (!patient) {
      throw new AppError('Patient not found', 404)
    }

    const fhirPatient = this.fhirMapper.patientToFhir(patient)
    return this.fhirClient.createResource('Patient', fhirPatient)
  }

  async exportDoctor(doctorId: number): Promise<Record<string, unknown>> {
    const doctor = await this.doctorRepository.findById(doctorId)
    if (!doctor) {
      throw new AppError('Doctor not found', 404)
    }

    const fhirPractitioner = this.fhirMapper.doctorToFhir(doctor)
    return this.fhirClient.createResource('Practitioner', fhirPractitioner)
  }

  async importPatient(fhirPatientId: string): Promise<Record<string, unknown>> {
    const fhirPatient = await this.fhirClient.getResource('Patient', fhirPatientId)
    const patientData = this.fhirMapper.fhirToPatientData(fhirPatient)
    return patientData as Record<string, unknown>
  }

  async searchFhirPatients(name: string): Promise<Record<string, unknown>> {
    return this.fhirClient.searchResource('Patient', { name, _count: '10' })
  }

  async searchFhirPractitioners(name: string): Promise<Record<string, unknown>> {
    return this.fhirClient.searchResource('Practitioner', { name, _count: '10' })
  }
}
