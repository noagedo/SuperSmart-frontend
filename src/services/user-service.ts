  import { CredentialResponse } from "@react-oauth/google";
  import apiClient, { CanceledError } from "./api-client";

  export { CanceledError }

  export interface User {
      _id?: string;
      userName: string;
      email: string;
      password: string;
      profilePicture?: string;
      accessToken?: string;
      refreshToken?: string; 
    }
    

  const signUp = (user: User) => {
    const abortController = new AbortController();
    const request = apiClient.post<User>("/auth/register", user, {
      signal: abortController.signal,
    });

    return { request, cancel: () => abortController.abort() };
  };

  export const googleSignin = (credentialResponse: CredentialResponse) => {
    return new Promise<User>((resolve, reject) => {
      console.log("googleSignin ...");
      apiClient
        .post("/auth/google", credentialResponse)
        .then((response) => {
          console.log(response);
          resolve(response.data);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  };

  const signIn = (user: { email: string; password: string }) => {
    const abortController = new AbortController();
    const request = apiClient.post<User>("/auth/login", user, {
      signal: abortController.signal,
    });
    return { request, cancel: () => abortController.abort() };
  };

  const uploadImage = (img: File) => {
    const formData = new FormData();
    formData.append("file", img);
    const request = apiClient.post("/file?file=" + img.name, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { request };
  };

  const update = (user: User) => {
    const abortController = new AbortController();
    const request = apiClient.put<User>(`/auth/${user._id}`, user, {
      signal: abortController.signal,
    });
    return { request, cancel: () => abortController.abort() };
  };

  const getUser = (id: string) => {
    const abortController = new AbortController();
    const request = apiClient.get<User>(`/auth/${id}`, {
      signal: abortController.signal,
    });
    return { request, cancel: () => abortController.abort() };
  };

  
  const changePassword = (
      userId: string,
      currentPassword: string,
      newPassword: string
    ) => {
      const abortController = new AbortController();
      const token = localStorage.getItem("token"); // ← כאן נשמר ה־JWT לאחר login
    
      const request = apiClient.put(
        `/auth/change-password`,
        { id: userId, currentPassword, newPassword },
        {
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, 
          },
        }
      );
    
      return { request, cancel: () => abortController.abort() };
    };
    const logout = (refreshToken: string) => {
      const request = apiClient.post("/auth/logout", { refreshToken }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return { request };
    };
    
    

  export default {
    signUp,
    signIn,
    uploadImage,
    update,
    getUser,
    changePassword, 
    logout,
  };
