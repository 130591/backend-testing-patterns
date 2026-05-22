import { Service } from 'typedi'
import { Request, Response } from 'express'
import { PatientService } from '../services/PatientService'
import { PatientInsuranceService } from '../services/PatientInsuranceService'

@Service()
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientInsuranceService: PatientInsuranceService,
  ) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    const patients = await this.patientService.findAll()
    res.json(patients)
  }

  async findById(req: Request, res: Response): Promise<void> {
    const patient = await this.patientService.findById(Number(req.params.id))
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' })
      return
    }
    res.json(patient)
  }

  async searchByName(req: Request, res: Response): Promise<void> {
    const name = req.query.name as string
    if (!name) {
      res.status(400).json({ message: 'Query parameter "name" is required' })
      return
    }
    const patients = await this.patientService.searchByName(name)
    res.json(patients)
  }

  async searchByCpf(req: Request, res: Response): Promise<void> {
    const patient = await this.patientService.findByCpf(req.params.cpf as string)
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' })
      return
    }
    res.json(patient)
  }

  async create(req: Request, res: Response): Promise<void> {
    const patient = await this.patientService.create(req.body)
    res.status(201).json(patient)
  }

  async update(req: Request, res: Response): Promise<void> {
    const patient = await this.patientService.update(Number(req.params.id), req.body)
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' })
      return
    }
    res.json(patient)
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.patientService.delete(Number(req.params.id))
    res.status(204).send()
  }

  async getInsurances(req: Request, res: Response): Promise<void> {
    const insurances = await this.patientInsuranceService.findByPatientId(Number(req.params.id))
    res.json(insurances)
  }

  async addInsurance(req: Request, res: Response): Promise<void> {
    const insurance = await this.patientInsuranceService.create({
      ...req.body,
      patientId: Number(req.params.id),
    })
    res.status(201).json(insurance)
  }

  async removeInsurance(req: Request, res: Response): Promise<void> {
    await this.patientInsuranceService.delete(Number(req.params.insuranceId))
    res.status(204).send()
  }
}
