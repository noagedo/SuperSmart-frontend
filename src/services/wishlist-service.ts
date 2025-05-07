import createHttpService from "./http-service";
import { Wishlist } from "../types/wishlist";
import apiClient from "./api-client";

const wishlistService = createHttpService<Wishlist>("/wishlists");

// Get or create a user's wishlist - using existing API endpoints!
export const getUserWishlist = (userId: string) => {
  const controller = new AbortController();
  console.log(`Getting wishlist for user: ${userId}`);

  // שינוי כאן - במקום /wishlists/user/${userId} אנחנו משתמשים ב-endpoint הקיים
  // שמחזיר את כל הרשימות של המשתמש ולוקחים את הראשונה כרשימה היחידה
  const request = apiClient
    .get(`/wishlists`, {
      params: { userId: userId },
      signal: controller.signal,
    })
    .then(async (response) => {
      // בדוק אם יש רשימות קיימות
      if (response.data && response.data.length > 0) {
        console.log("Found existing wishlist:", response.data[0]);
        return { data: response.data[0] };
      }

      // אם אין רשימות, צור רשימה חדשה
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

// Add product to user's wishlist - no need to specify wishlist ID since it's a single wishlist
export const addProductToWishlist = (wishlistId: string, productId: string) => {
  const controller = new AbortController();
  console.log(`Adding product ${productId} to wishlist ${wishlistId}`);

  // Make sure we have a valid wishlistId
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

// Remove product from user's wishlist - no need to specify wishlist ID
export const removeProductFromWishlist = (
  wishlistId: string,
  productId: string
) => {
  const controller = new AbortController();
  console.log(`Removing product ${productId} from wishlist ${wishlistId}`);

  // Make sure we have a valid wishlistId
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
