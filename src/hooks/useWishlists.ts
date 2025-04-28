import { useState, useEffect } from "react";
import wishlistService, {
  addProductToWishlist,
  removeProductFromWishlist,
  getWishlistsByUser,
} from "../services/wishlist-service";
import { Wishlist } from "../types/wishlist";
import useUsers from "./useUsers";

interface UseWishlistsResult {
  wishlists: Wishlist[];
  isLoading: boolean;
  error: string | null;
  createWishlist: (name: string) => Promise<void>;
  deleteWishlist: (id: string) => Promise<void>;
  updateWishlist: (wishlist: Wishlist) => Promise<void>;
  addProduct: (wishlistId: string, productId: string) => Promise<void>;
  removeProduct: (wishlistId: string, productId: string) => Promise<void>;
}

const useWishlists = (): UseWishlistsResult => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUsers();

  useEffect(() => {
    const fetchWishlists = async () => {
      if (!user || !user._id) {
        setWishlists([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { request, cancel } = getWishlistsByUser(user._id);
        const response = await request;
        setWishlists(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch wishlists");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlists();
  }, [user]);

  const createWishlist = async (name: string) => {
    if (!user || !user._id) return;

    try {
      setIsLoading(true);
      const { request } = wishlistService.add({
        name,
        userId: user._id,
        products: [],
      });
      const response = await request;
      setWishlists([...wishlists, response.data]);
      setError(null);
    } catch (err) {
      setError("Failed to create wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWishlist = async (id: string) => {
    try {
      setIsLoading(true);
      const { request } = wishlistService.delete(id);
      await request;
      setWishlists(wishlists.filter((wishlist) => wishlist._id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWishlist = async (wishlist: Wishlist) => {
    try {
      setIsLoading(true);
      const { request } = wishlistService.update(wishlist);
      const response = await request;
      setWishlists(
        wishlists.map((w) => (w._id === wishlist._id ? response.data : w))
      );
      setError(null);
    } catch (err) {
      setError("Failed to update wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (wishlistId: string, productId: string) => {
    try {
      setIsLoading(true);
      const { request } = addProductToWishlist(wishlistId, productId);
      const response = await request;
      setWishlists(
        wishlists.map((w) => (w._id === wishlistId ? response.data : w))
      );
      setError(null);
    } catch (err) {
      setError("Failed to add product to wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeProduct = async (wishlistId: string, productId: string) => {
    try {
      setIsLoading(true);
      const { request } = removeProductFromWishlist(wishlistId, productId);
      const response = await request;
      setWishlists(
        wishlists.map((w) => (w._id === wishlistId ? response.data : w))
      );
      setError(null);
    } catch (err) {
      setError("Failed to remove product from wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wishlists,
    isLoading,
    error,
    createWishlist,
    deleteWishlist,
    updateWishlist,
    addProduct,
    removeProduct,
  };
};

export default useWishlists;
