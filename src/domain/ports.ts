import type { User, PublicUser, Product, ProductInput, CatalogQuery, Page, Brand, Category, Order, OrderInput, Principal } from './entities';
export interface UserRepository {
  byEmail(email: string): Promise<User | null>;
  byId(id: string): Promise<PublicUser | null>;
  create(data: { name: string; email: string; passwordHash: string }): Promise<PublicUser>;
}
export interface CatalogRepository {
  list(query: CatalogQuery): Promise<Page<Product>>;
  byId(id: string): Promise<Product | null>;
  options(): Promise<{ brands: Brand[]; categories: Category[] }>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
  delete(id: string): Promise<void>;
}
export interface OrderRepository {
  create(userId: string, input: OrderInput, unitPrice: number): Promise<Order>;
  list(userId: string | undefined, page: number, limit: number): Promise<Page<Order>>;
}
export interface PasswordHasher { hash(value: string): Promise<string>; compare(value: string, hash: string): Promise<boolean> }
export interface TokenService { sign(user: Principal): string; verify(token: string): Principal }
