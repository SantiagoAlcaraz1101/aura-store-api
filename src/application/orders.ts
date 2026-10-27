import { AppError } from '../domain/errors';
import type { CatalogRepository, OrderRepository } from '../domain/ports';
import type { OrderInput } from '../domain/entities';
export class OrderService {
  constructor(private orders: OrderRepository, private catalog: CatalogRepository) {}
  async create(userId: string, input: OrderInput) {
    const product = await this.catalog.byId(input.productId);
    if (!product) throw new AppError(404, 'El sneaker no existe.', { productId: 'Este modelo ya no está disponible.' });
    const size = product.sizes.find((item) => item.size === input.size);
    if (!size || size.stock < 1) throw new AppError(400, 'La talla no está disponible.', { size: 'Selecciona una talla disponible para este modelo.' });
    return this.orders.create(userId, input, product.price);
  }
  mine(userId: string, page: number, limit: number) { return this.orders.list(userId, page, limit); }
  all(page: number, limit: number) { return this.orders.list(undefined, page, limit); }
}
