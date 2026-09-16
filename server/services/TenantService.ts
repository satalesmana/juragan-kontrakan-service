import { TenantRepository, TenantDB } from '../repositories/TenantRepository'
import { TenantInput, UpdateTenantInput } from '../schemas/tenant'

export class TenantService {
  private tenantRepo = new TenantRepository()

  async createTenant(input: TenantInput): Promise<TenantDB> {
    return this.tenantRepo.create(input)
  }

  async getTenants(page = 1, limit = 20, search?: string) {
    return this.tenantRepo.list(page, limit, search)
  }

  async getTenantById(id: string): Promise<TenantDB | null> {
    return this.tenantRepo.findById(id)
  }

  async updateTenant(id: string, input: UpdateTenantInput): Promise<TenantDB | null> {
    return this.tenantRepo.update(id, input)
  }

  async deleteTenant(id: string): Promise<boolean> {
    return this.tenantRepo.delete(id)
  }
}
