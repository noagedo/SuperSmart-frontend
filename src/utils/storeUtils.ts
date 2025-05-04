/**
 * Central mapping of store IDs to store names
 */
const STORE_NAMES: Record<string, string> = {
  "65a4e1e1e1e1e1e1e1e1e1e1": "שופרסל",
  "65a4e1e1e1e1e1e1e1e1e1e2": "רמי לוי",
  // Add more stores as needed
};

/**
 * Gets a human-readable store name from a store ID
 * @param storeId The store ID to look up
 * @returns The store name, or a generic store name if not found
 */
export const getStoreName = (storeId: string): string => {
  return STORE_NAMES[storeId] || `חנות ${storeId.substring(0, 5)}`;
};
