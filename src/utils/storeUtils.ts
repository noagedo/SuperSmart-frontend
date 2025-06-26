/**
 * Central mapping of store IDs to store names
 */
const STORE_NAMES: Record<string, string> = {
  "65a4e1e1e1e1e1e1e1e1e1e1": "שופרסל",
  "65a4e1e1e1e1e1e1e1e1e1e2": "רמי לוי",
  "65a4e1e1e1e1e1e1e1e1e1e3": "קרפור",
  "65a4e1e1e1e1e1e1e1e1e1e4": "סיטי מרקט",

};

/**
 * Gets a human-readable store name from a store ID
 * @param storeId The store ID to look up
 * @returns The store name, or a generic store name if not found
 */
export const getStoreName = (storeId: any): string => {
  const id = String(storeId || "");
  if (!id) {
    return "חנות לא ידועה";
  }
  return STORE_NAMES[id] || `חנות ${id.substring(0, 5)}`;
}
