
import { ShoppingCart } from 'lucide-react';
import { Item } from '../services/item-service';

interface ProductCardProps {
  product: Item;
  onAddToCart: (product: Item, storePrice: { storeId: string; price: number }) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const lowestPrice = product.storePrices.reduce((min, current) => 
    current.price < min.price ? current : min
  , product.storePrices[0]);

  const highestPrice = product.storePrices.reduce((max, current) => 
    current.price > max.price ? current : max
  , product.storePrices[0]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      <img 
        src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} 
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <span className="text-sm text-gray-500">{product.category}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">{product.description}</p>
        <div className="mt-4">
          <div className="mb-2">
            <span className="text-xl font-bold text-gray-900">${lowestPrice.price}</span>
            {highestPrice.price > lowestPrice.price && (
              <span className="ml-2 text-sm text-gray-500">
                up to ${highestPrice.price}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product, lowestPrice)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}