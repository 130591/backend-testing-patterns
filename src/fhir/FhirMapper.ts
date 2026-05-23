import { Service } from 'typedi'
import { Patient } from '../entities/Patient'
import { Doctor } from '../entities/Doctor'
import { Appointment } from '../entities/Appointment'
import { MedicalRecord } from '../entities/MedicalRecord'
import { Prescription } from '../entities/Prescription'
import { AppointmentStatus } from '../enums'

@Service()
export class FhirMapper {
  patientToFhir(patient: Patient): Record<string, unknown> {
    return {
      resourceType: 'Patient',
      id: String(patient.id),
      identifier: [
        { system: 'urn:oid:2.16.840.1.113883.13.237', value: patient.cpf },
      ],
      active: patient.active,
      name: [{ text: patient.name }],
      telecom: [
        { system: 'email', value: patient.email },
        { system: 'phone', value: patient.phone },
      ],
      gender: this.mapGender(patient.gender),
      birthDate: patient.dateOfBirth,
      address: patient.address
        ? [{ text: patient.address }]
        : undefined,
    }
  }

  doctorToFhir(doctor: Doctor): Record<string, unknown> {
    return {
      resourceType: 'Practitioner',
      id: String(doctor.id),
      identifier: [
        { system: 'urn:oid:2.16.840.1.113883.13.243', value: doctor.crm },
      ],
      active: doctor.active,
      name: [{ text: doctor.name }],
      telecom: [
        { system: 'email', value: doctor.email },
        { system: 'phone', value: doctor.phone },
      ],
      qualification: [
        {
          code: {
            coding: [{ display: doctor.specialty }],
          },
        },
      ],
    }
  }

  appointmentToFhir(appointment: Appointment): Record<string, unknown> {
    return {
      resourceType: 'Appointment',
      id: String(appointment.id),
      status: this.mapAppointmentStatus(appointment.status),
      start: appointment.dateTime,
      end: appointment.endTime,
      participant: [
        {
          actor: { reference: `Patient/${appointment.patientId}` },
          status: 'accepted',
        },
        {
          actor: { reference: `Practitioner/${appointment.doctorId}` },
          status: 'accepted',
        },
      ],
      comment: appointment.notes,
    }
  }

  medicalRecordToFhir(record: MedicalRecord): Record<string, unknown> {
    return {
      resourceType: 'Encounter',
      id: String(record.id),
      status: 'finished',
      class: { code: 'AMB', display: 'ambulatory' },
      subject: { reference: `Patient/${record.patientId}` },
      participant: [
        {
          individual: { reference: `Practitioner/${record.doctorId}` },
        },
      ],
      reasonCode: record.chiefComplaint
        ? [{ text: record.chiefComplaint }]
        : undefined,
      diagnosis: record.diagnosis.map((d) => ({
        condition: { display: d },
      })),
      text: {
        status: 'generated',
        div: record.notes || '',
      },
    }
  }

  prescriptionToFhir(prescription: Prescription): Record<string, unknown> {
    return {
      resourceType: 'MedicationRequest',
      id: String(prescription.id),
      status: 'active',
      intent: 'order',
      subject: { reference: `Patient/${prescription.patientId}` },
      requester: { reference: `Practitioner/${prescription.doctorId}` },
      authoredOn: prescription.issuedAt,
      dosageInstruction: prescription.medications.map((med) => ({
        text: `${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}`,
        additionalInstruction: med.instructions
          ? [{ text: med.instructions }]
          : undefined,
      })),
      note: prescription.notes ? [{ text: prescription.notes }] : undefined,
    }
  }

  fhirToPatientData(fhirPatient: Record<string, unknown>): Partial<Patient> {
    const name = (fhirPatient.name as any[])?.[0]
    const telecom = (fhirPatient.telecom as any[]) || []
    const identifier = (fhirPatient.identifier as any[]) || []
    const address = (fhirPatient.address as any[])?.[0]

    return {
      name: name?.text || name?.given?.join(' ') + ' ' + (name?.family || ''),
      cpf: identifier.find((i: any) => i.system?.includes('237'))?.value,
      email: telecom.find((t: any) => t.system === 'email')?.value,
      phone: telecom.find((t: any) => t.system === 'phone')?.value,
      dateOfBirth: fhirPatient.birthDate as string,
      address: address?.text || null,
    }
  }

  private mapGender(gender: string): string {
    const map: Record<string, string> = {
      MALE: 'male',
      FEMALE: 'female',
      OTHER: 'other',
      PREFER_NOT_TO_SAY: 'unknown',
    }
    return map[gender] || 'unknown'
  }

  private mapAppointmentStatus(status: AppointmentStatus): string {
    const map: Record<string, string> = {
      SCHEDULED: 'booked',
      CONFIRMED: 'booked',
      IN_PROGRESS: 'arrived',
      COMPLETED: 'fulfilled',
      CANCELLED: 'cancelled',
      NO_SHOW: 'noshow',
    }
    return map[status] || 'proposed'
  }
}
