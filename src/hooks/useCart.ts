// 📁 hooks/useCart.ts
import { useState, useEffect, useCallback } from "react";
import { CartItem } from "../services/item-service";
import cartService from "../services/cart-service";
import useUsers from "./useUsers";

interface CartState {
  items: CartItem[];
}

const useCart = () => {
  const [cart, setCart] = useState<CartState>({ items: [] });
  const { user } = useUsers();
  const [initialized, setInitialized] = useState(false);

  // Get user-specific localStorage key
  const getCartKey = useCallback(() => {
    if (!user || !user._id) {
      return null;
    }
    return `cart_${user._id}`;
  }, [user]);

  // Load cart from localStorage when user changes
  useEffect(() => {
    const cartKey = getCartKey();
    console.log("Loading cart for key:", cartKey);

    if (!cartKey) {
      console.log("No user logged in, using empty cart");
      setCart({ items: [] });
      return;
    }

    try {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        const parsedItems = JSON.parse(savedCart);
        console.log("Loaded cart with items:", parsedItems.length);
        setCart({ items: parsedItems });
      } else {
        console.log("No saved cart found for user:", cartKey);
        setCart({ items: [] });
      }
    } catch (error) {
      console.error(`Error loading cart from localStorage:`, error);
      setCart({ items: [] });
    }
  }, [user, getCartKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartKey = getCartKey();
    if (!cartKey) return;

    console.log(`Auto-saving cart with ${cart.items.length} items`);

    if (cart.items.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cart.items));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [cart.items, getCartKey]);

  // Simplified manual save function
  const save = () => {
    const cartKey = getCartKey();
    if (!cartKey) return;

    if (cart.items.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cart.items));
      console.log("Cart manually saved");
    } else {
      localStorage.removeItem(cartKey);
      console.log("Empty cart - removed from localStorage");
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
        return { items: updatedItems };
      } else {
        // Add new item
        return { items: [...prevCart.items, item] };
      }
    });
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) =>
        item._id === id ? { ...item, quantity } : item
      );
      return { items: updatedItems };
    });
  };

  // Remove item from cart (simplified)
  const removeItem = (id: string) => {
    console.log(`Removing item with ID: ${id}`);

    setCart((prevCart) => {
      const updatedItems = prevCart.items.filter((item) => item._id !== id);
      console.log(`Updated cart has ${updatedItems.length} items`);
      return { items: updatedItems };
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
