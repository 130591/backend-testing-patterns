import { Service } from 'typedi'
import { Request, Response } from 'express'
import { FhirSyncService } from './FhirSyncService'

@Service()
export class FhirController {
  constructor(private readonly fhirSyncService: FhirSyncService) {}

  async exportPatient(req: Request, res: Response): Promise<void> {
    const result = await this.fhirSyncService.exportPatient(Number(req.params.id))
    res.json(result)
  }

  async exportDoctor(req: Request, res: Response): Promise<void> {
    const result = await this.fhirSyncService.exportDoctor(Number(req.params.id))
    res.json(result)
  }

  async importPatient(req: Request, res: Response): Promise<void> {
    const result = await this.fhirSyncService.importPatient(req.params.fhirId as string)
    res.json(result)
  }

  async searchPatients(req: Request, res: Response): Promise<void> {
    const result = await this.fhirSyncService.searchFhirPatients(req.query.name as string)
    res.json(result)
  }

  async searchPractitioners(req: Request, res: Response): Promise<void> {
    const result = await this.fhirSyncService.searchFhirPractitioners(req.query.name as string)
    res.json(result)
  }
}
