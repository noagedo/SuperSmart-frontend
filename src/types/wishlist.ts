export interface Wishlist {
  _id: string;
  name: string;
  userId: string;
  products: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
