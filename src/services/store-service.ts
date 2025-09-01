import apiClient, { CanceledError } from "./api-client";

export { CanceledError };

export interface Store {
    _id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

export const DEFAULT_STORE_LOCATIONS: Record<string, { lat: number; lng: number; address: string }> = {
    "65a4e1e1e1e1e1e1e1e1e1e1": { lat: 32.0853, lng: 34.7818, address: "שופרסל, תל אביב" },
    "65a4e1e1e1e1e1e1e1e1e1e2": { lat: 31.9522, lng: 34.7998, address: "רמי לוי, ראשון לציון" },
    "65a4e1e1e1e1e1e1e1e1e1e3": { lat: 32.0836, lng: 34.8004, address: "קרפור, תל אביב" },
    "65a4e1e1e1e1e1e1e1e1e1e4": { lat: 32.0707, lng: 34.8245, address: "סיטי מרקט, תל אביב" },
};


const getAllStores = () => {
    const controller = new AbortController();
    const request = apiClient.get<Store[]>("/stores", {
        signal: controller.signal,
    });
    return { request, cancel: () => controller.abort() };
};


const getMapSupermarkets = () => {
    const controller = new AbortController();
    const request = apiClient.get<Store[]>("/mapSupermarkets", {
        signal: controller.signal,
    });
    return { request, cancel: () => controller.abort() };
};


export const getStoreLocation = (storeId: string): { lat: number; lng: number; address: string } => {
    return DEFAULT_STORE_LOCATIONS[storeId] || {
        lat: 32.0853,
        lng: 34.7818,
        address: "ישראל",
    };
};


export const convertToSupermarketFormat = (stores: Store[]) => {
    return stores.map(store => ({
        id: store._id,
        name: store.name,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
    }));
};

export default {
    getAllStores,
    getMapSupermarkets,
    getStoreLocation,
    convertToSupermarketFormat,
};
