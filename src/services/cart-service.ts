import apiClient from "./api-client";
import { CartItem } from "./item-service";

/**
 * Retrieves the user's cart from the server
 */
const getCart = async (userId: string) => {
  try {
    // Assuming there's a GET endpoint for the user that includes cart data
    const response = await apiClient.get(`/auth/${userId}`);
    return response.data.cart || [];
  } catch (error) {
    console.error("Failed to get cart from server:", error);
    return [];
  }
};

/**
 * Updates or adds an item to the user's cart
 */
const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  try {
    console.log(
      `Updating cart item for user ${userId}: product ${productId}, quantity ${quantity}`
    );
    // Use PUT instead of POST to match the backend API endpoint
    const response = await apiClient.put(`/auth/${userId}/cart`, {
      productId,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update cart item (${productId}):`, error);
    // Don't throw error to prevent app crashes
    return null;
  }
};

/**
 * Removes an item from the user's cart
 */
const removeCartItem = async (userId: string, productId: string) => {
  try {
    // Check if your API expects DELETE with body or query params
    const response = await apiClient.delete(`/auth/${userId}/cart`, {
      data: { productId },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to remove cart item (${productId}):`, error);
    // Don't throw error to prevent app crashes
    return null;
  }
};

/**
 * Synchronizes the local cart with the server
 */
const syncCart = async (userId: string, cartItems: CartItem[]) => {
  try {
    // Process each cart item sequentially to avoid overwhelming the server
    for (const item of cartItems) {
      await updateCartItem(userId, item._id, item.quantity);
    }
    return true;
  } catch (error) {
    console.error("Failed to sync cart with server:", error);
    return false;
  }
};

export default {
  getCart,
  updateCartItem,
  removeCartItem,
  syncCart,
};
