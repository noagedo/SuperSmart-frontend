import createHttpService from "./http-service";
import { Wishlist } from "../types/wishlist";
import apiClient from "./api-client";

const wishlistService = createHttpService<Wishlist>("/wishlists");


export const getUserWishlist = (userId: string) => {
  const controller = new AbortController();
  console.log(`Getting wishlist for user: ${userId}`);

  
  
  const request = apiClient
    .get(`/wishlists`, {
      params: { userId: userId },
      signal: controller.signal,
    })
    .then(async (response) => {
      
      if (response.data && response.data.length > 0) {
        console.log("Found existing wishlist:", response.data[0]);
        return { data: response.data[0] };
      }

      
      console.log("No wishlist found, creating a new one");
      const createResponse = await apiClient.post("/wishlists", {
        name: "המועדפים שלי",
        userId: userId,
        products: [],
      });
      console.log("Created new wishlist:", createResponse.data);
      return { data: createResponse.data };
    })
    .catch((error) => {
      console.error(`Error in getUserWishlist for user ${userId}:`, error);
      console.error(`Request or creation failed`);
      throw error;
    });

  return { request, cancel: () => controller.abort() };
};


export const addProductToWishlist = (wishlistId: string, productId: string) => {
  const controller = new AbortController();
  console.log(`Adding product ${productId} to wishlist ${wishlistId}`);

  
  if (!wishlistId) {
    console.error("Attempted to add product without a valid wishlist ID");
    return {
      request: Promise.reject(new Error("Invalid wishlist ID")),
      cancel: () => controller.abort(),
    };
  }

  const request = apiClient
    .post(
      `/wishlists/${wishlistId}/products`,
      { productId },
      { signal: controller.signal }
    )
    .catch((error) => {
      console.error(
        `Error adding product ${productId} to wishlist ${wishlistId}:`,
        error
      );
      console.error(`Request URL: /wishlists/${wishlistId}/products`);
      console.error(`Request payload:`, { productId });
      throw error;
    });

  return { request, cancel: () => controller.abort() };
};


export const removeProductFromWishlist = (
  wishlistId: string,
  productId: string
) => {
  const controller = new AbortController();
  console.log(`Removing product ${productId} from wishlist ${wishlistId}`);

  
  if (!wishlistId) {
    console.error("Attempted to remove product without a valid wishlist ID");
    return {
      request: Promise.reject(new Error("Invalid wishlist ID")),
      cancel: () => controller.abort(),
    };
  }

  const request = apiClient
    .delete(`/wishlists/${wishlistId}/products`, {
      data: { productId },
      signal: controller.signal,
    })
    .catch((error) => {
      console.error(
        `Error removing product ${productId} from wishlist ${wishlistId}:`,
        error
      );
      console.error(`Request URL: /wishlists/${wishlistId}/products`);
      console.error(`Request payload:`, { productId });
      throw error;
    });

  return { request, cancel: () => controller.abort() };
};

export default wishlistService;
