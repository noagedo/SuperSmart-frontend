import {  ShoppingCart as CartIcon, Trash2 } from 'lucide-react';
import { CartItem } from '../services/item-service';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const total = items.reduce((sum, item) => 
    sum + item.selectedStorePrice.price * item.quantity, 0
  );

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
            <CartIcon size={24} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-gray-600 font-medium">Your cart is empty</p>
            <p className="text-sm text-gray-500 mt-1">Start adding some products!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Shopping Cart</h2>
        <span className="text-sm font-medium text-gray-500">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item._id} className="py-4 first:pt-0">
            <div className="flex gap-4">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ${item.selectedStorePrice.price.toFixed(2)}
                </p>
                
                <div className="flex items-center gap-4 mt-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item._id, Number(e.target.value))}
                    className="rounded-lg border border-gray-200 py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onRemoveItem(item._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between text-gray-600 mb-2">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-600 mb-4">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-6">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        
        <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}