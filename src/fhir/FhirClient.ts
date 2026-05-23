import { Service } from 'typedi'
import axios, { AxiosInstance } from 'axios'

const FHIR_BASE_URL = process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4'

@Service()
export class FhirClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: FHIR_BASE_URL,
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      },
      timeout: 10000,
    })
  }

  async createResource(resourceType: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.client.post(`/${resourceType}`, data)
    return response.data
  }

  async getResource(resourceType: string, id: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/${resourceType}/${id}`)
    return response.data
  }

  async searchResource(resourceType: string, params: Record<string, string>): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/${resourceType}`, { params })
    return response.data
  }

  async updateResource(resourceType: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.client.put(`/${resourceType}/${id}`, { ...data, id })
    return response.data
  }
}
