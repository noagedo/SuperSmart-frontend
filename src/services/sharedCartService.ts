import apiClient from "./api-client";

export const createSharedCartFromPersonal = async (name: string) => {
  const response = await apiClient.post("/s hared-cart/create", { name });
  return response.data;
};

export const addMemberToSharedCart = async (cartId: string, email: string) => {
  const response = await apiClient.post("/shared-cart/add-member", {
    cartId,
    email,
  });
  return response.data;
};

export const addItemToSharedCart = async (
  cartId: string,
  itemId: string,
  quantity: number
) => {
  const response = await apiClient.post("/shared-cart/add-item", {
    cartId,
    itemId,
    quantity,
  });
  return response.data;
};

export const removeItemFromSharedCart = async (cartId: string, itemId: string) => {
  const response = await apiClient.delete("/shared-cart/remove-item", {
    data: { cartId, itemId },
  });
  return response.data;
};

export default {
  createSharedCartFromPersonal,
  addMemberToSharedCart,
  addItemToSharedCart,
  removeItemFromSharedCart,
};
