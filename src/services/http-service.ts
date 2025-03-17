import apiClient, {CanceledError} from "./api-client";

export {CanceledError};

interface BaseEntity {
    _id: string;
}

class HttpService<T extends BaseEntity>{
    endpoint: string;
    constructor(endpoint: string){
        this.endpoint = endpoint;
    }

    getAll(){
        const controller = new AbortController();
        const request = apiClient.get(this.endpoint, {signal: controller.signal});
        return { request, cancel: ()=>controller.abort()};
    }

    add(data: Omit<T, '_id'>) {
        const controller = new AbortController();
        const request = apiClient.post(this.endpoint, data, { signal: controller.signal });
        return { request, cancel: () => controller.abort() };
    }

    update(data: T){
        const controller = new AbortController();
        const request = apiClient.put(`${this.endpoint}/${data._id}`, data, {signal: controller.signal});
        return { request, cancel: ()=>controller.abort()};
    }

    updateImage(id: string, image: File) {
        const controller = new AbortController();
        const formData = new FormData();
        formData.append("image", image);

        const request = apiClient.put(`${this.endpoint}/${id}/image`, formData, {
            signal: controller.signal
        });

        return { request, cancel: () => controller.abort() };
    }

    delete(id: string){
        const controller = new AbortController();
        const request = apiClient.delete(`${this.endpoint}/${id}`, {signal: controller.signal});
        return { request, cancel: ()=>controller.abort()};
    }

    get(id: string){
        const controller = new AbortController();
        const request = apiClient.get(`${this.endpoint}/${id}`, {signal: controller.signal});
        return { request, cancel: ()=>controller.abort()};
    }

}

const createHttpService = <T extends BaseEntity>(endpoint: string) => new HttpService<T>(endpoint);

export default createHttpService;