// 📁 hooks/useCart.ts
import { useEffect, useState, useCallback } from "react";
import cartService, { Cart } from "../services/cart-service";
import { CartItem } from "../services/item-service";
import useUsers from "./useUsers";

const useCart = () => {
  const { user } = useUsers();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!user?._id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await cartService.getUserCarts(user._id);
      if (data.length > 0) {
        setCart(data[0]);
      } else {
        const { data: newCart } = await cartService.createCart({
          ownerId: user._id,
          participants: [],
          items: [],
        });
        setCart(newCart);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = (item: CartItem) => {
    if (!cart) return;
    const existing = cart.items.find((i) => i._id === item._id);
    const updatedItems = existing
      ? cart.items.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...(cart.items || []), { ...item, quantity: 1 }];

    setCart({ ...cart, items: updatedItems });
  };

  const removeItem = (itemId: string) => {
    if (!cart) return;
    const updatedItems = cart.items.filter((item) => item._id !== itemId);
    setCart({ ...cart, items: updatedItems });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (!cart) return;
    const updatedItems = cart.items.map((item) =>
      item._id === itemId ? { ...item, quantity } : item
    );
    setCart({ ...cart, items: updatedItems });
  };

  const save = async () => {
    if (cart?._id) {
      try {
        await cartService.updateCart(cart._id, cart);
        console.log("Cart saved.");
      } catch (err) {
        console.error("Failed to save cart:", err);
      }
    }
  };

  return {
    cart,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    save,
    refetch: fetchCart,
  };
};

export default useCart;