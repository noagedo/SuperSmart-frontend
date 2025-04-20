// 📁 hooks/useCart.ts
import { useEffect, useState } from "react";
import { CartItem } from "../services/item-service";
import cartService from "../services/cart-service";
import useUsers from "./useUsers";

interface CartState {
  items: CartItem[];
}

const useCart = () => {
  const [cart, setCart] = useState<CartState>({ items: [] });
  const { user } = useUsers();

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart);
        setCart({ items: parsedItems });
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  const save = () => {
    if (cart.items.length > 0) {
      localStorage.setItem("cartItems", JSON.stringify(cart.items));
    }
  };

  // Add item to cart
  const addItem = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (i) => i._id === item._id
      );

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex].quantity =
          (updatedItems[existingItemIndex].quantity || 0) +
          (item.quantity || 1);
        return { ...prevCart, items: updatedItems };
      } else {
        // Add new item
        return { ...prevCart, items: [...prevCart.items, item] };
      }
    });
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) =>
        item._id === id ? { ...item, quantity } : item
      );
      return { ...prevCart, items: updatedItems };
    });
  };

  // Remove item from cart
  const removeItem = (id: string) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.items.filter((item) => item._id !== id);
      return { ...prevCart, items: updatedItems };
    });
  };

  // Save cart to backend
  const saveCart = async (name?: string) => {
    if (!user) {
      throw new Error("User must be logged in to save cart");
    }

    try {
      const { request } = cartService.createCart({
        name: name || `Cart ${new Date().toLocaleDateString()}`,
        ownerId: user._id || "",
        participants: [],
        items: cartService.transformCartItems(cart.items),
      });

      return await request;
    } catch (error) {
      console.error("Failed to save cart:", error);
      throw error;
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart({ items: [] });
    localStorage.removeItem("cartItems");
  };

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    saveCart,
    clearCart,
    save,
  };
};

export default useCart;
