export type Role = 'admin' | 'user';
export interface Principal { id: string; role: Role }
export interface User extends Principal { name: string; email: string; passwordHash: string }
export type PublicUser = Omit<User, 'passwordHash'>;
export interface Brand { id: string; name: string }
export interface Category extends Brand { description: string }
export interface SizeStock { size: number; stock: number }
export interface ProductInput { name: string; brandId: string; categoryId: string; description: string; color: string; price: number; sku: string; image: string; alt: string; tag: string; sizes: SizeStock[] }
export interface Product extends ProductInput { id: string; brand: Brand; category: Category }
export interface CatalogQuery { page: number; limit: number; search?: string; categoryId?: string; brandId?: string; minPrice?: number; maxPrice?: number; sort: 'featured' | 'price-asc' | 'price-desc' | 'name' }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface Page<T> { pagination: Pagination; data: T[] }
export interface OrderInput { productId: string; size: number; city: string; message: string; consent: true }
export interface Order { id: string; userId: string; productId: string; size: number; city: string; message: string; unitPrice: number; status: string; createdAt: Date; product: Pick<Product, 'id' | 'name' | 'image' | 'color'>; user: Pick<PublicUser, 'id' | 'name' | 'email'> }
