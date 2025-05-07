import { useState, useEffect } from "react";
import wishlistService, {
  addProductToWishlist,
  removeProductFromWishlist,
  getUserWishlist,
} from "../services/wishlist-service";
import { Wishlist } from "../types/wishlist";
import useUsers from "./useUsers";

interface UseWishlistResult {
  wishlist: Wishlist | null;
  isLoading: boolean;
  error: string | null;
  getOrCreateWishlist: () => Promise<void>;
  updateWishlist: (wishlist: Wishlist) => Promise<void>;
  addProduct: (productId: string) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  isProductInWishlist: (productId: string) => boolean;
}

const useWishlists = (): UseWishlistResult => {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUsers();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user || !user._id) {
        setWishlist(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { request, cancel } = getUserWishlist(user._id);
        const response = await request;
        setWishlist(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch wishlist");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const getOrCreateWishlist = async () => {
    if (!user || !user._id) return;

    try {
      setIsLoading(true);
      const { request } = getUserWishlist(user._id);
      const response = await request;
      setWishlist(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to get or create wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWishlist = async (wishlistData: Wishlist) => {
    try {
      setIsLoading(true);
      const { request } = wishlistService.update(wishlistData);
      const response = await request;
      setWishlist(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to update wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (productId: string) => {
    try {
      setIsLoading(true);

      console.log(`Starting to add product ${productId} to wishlist`);

      // אם אין עדיין wishlist, נסה לקבל או ליצור אחת
      if (!wishlist || !wishlist._id) {
        console.log("No wishlist exists, getting or creating one");

        if (!user || !user._id) {
          console.error("Cannot add product - no user logged in");
          throw new Error("User must be logged in");
        }

        // קבלת או יצירת רשימה
        try {
          const { request } = getUserWishlist(user._id);
          console.log(`Fetching/creating wishlist for user ${user._id}`);

          const response = await request;
          console.log("Wishlist response:", response);

          if (response && response.data) {
            // עדכון המצב עם הרשימה שהתקבלה
            setWishlist(response.data);

            // עכשיו הוסף את המוצר לרשימה החדשה
            if (response.data._id) {
              console.log(
                `Adding product ${productId} to wishlist ${response.data._id}`
              );
              const { request: addRequest } = addProductToWishlist(
                response.data._id,
                productId
              );
              const addResponse = await addRequest;
              setWishlist(addResponse.data);
              setError(null);
              return addResponse.data;
            }
          }
        } catch (err) {
          console.error("Error getting/creating wishlist:", err);
          throw err;
        }
      } else {
        // יש לנו wishlist, פשוט הוסף את המוצר
        console.log(
          `Adding product ${productId} to existing wishlist ${wishlist._id}`
        );
        const { request } = addProductToWishlist(wishlist._id, productId);
        const response = await request;
        setWishlist(response.data);
        setError(null);
        return response.data;
      }
    } catch (err) {
      console.error("Failed to add product to wishlist:", err);
      setError(
        `Failed to add product: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeProduct = async (productId: string) => {
    if (!wishlist || !wishlist._id) return;

    try {
      setIsLoading(true);
      const { request } = removeProductFromWishlist(wishlist._id, productId);
      const response = await request;
      setWishlist(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to remove product from wishlist");
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isProductInWishlist = (productId: string): boolean => {
    if (!wishlist) return false;
    return wishlist.products.includes(productId);
  };

  return {
    wishlist,
    isLoading,
    error,
    getOrCreateWishlist,
    updateWishlist,
    addProduct,
    removeProduct,
    isProductInWishlist,
  };
};

export default useWishlists;
