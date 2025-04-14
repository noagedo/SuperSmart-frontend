import apiClient from "./api-client";

export const getOrCreatePersonalCart = async () => {
  const response = await apiClient.get("/personal-cart");
  return response.data;
};

export const addItemToPersonalCart = async (itemId: string, quantity: number) => {
  const response = await apiClient.post("/personal-cart/add", {
    itemId,
    quantity,
  });
  return response.data;
};

export const removeItemFromPersonalCart = async (itemId: string) => {
  const response = await apiClient.delete("/personal-cart/remove", {
    data: { itemId },
  });
  return response.data;
};

export default {
  getOrCreatePersonalCart,
  addItemToPersonalCart,
  removeItemFromPersonalCart,
};
