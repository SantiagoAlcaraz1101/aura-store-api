import { AppError } from '../domain/errors';
import type { CatalogRepository } from '../domain/ports';
import type { CatalogQuery, ProductInput } from '../domain/entities';
export class CatalogService {
  constructor(private catalog: CatalogRepository) {}
  list(query: CatalogQuery) { return this.catalog.list(query); }
  options() { return this.catalog.options(); }
  async detail(id: string) { const product = await this.catalog.byId(id); if (!product) throw new AppError(404, 'El sneaker no existe.'); return product; }
  private async validateReferences(input: ProductInput) {
    const options = await this.catalog.options();
    const fields: Record<string, string> = {};
    if (!options.brands.some((brand) => brand.id === input.brandId)) fields.brandId = 'Selecciona una marca existente.';
    if (!options.categories.some((category) => category.id === input.categoryId)) fields.categoryId = 'Selecciona una categoría existente.';
    if (Object.keys(fields).length) throw new AppError(400, 'Revisa marca y categoría.', fields);
  }
  async create(input: ProductInput) { await this.validateReferences(input); return this.catalog.create(input); }
  async update(id: string, input: ProductInput) { await this.detail(id); await this.validateReferences(input); return this.catalog.update(id, input); }
  async delete(id: string) { await this.detail(id); return this.catalog.delete(id); }
}
