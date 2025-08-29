import { useState, useEffect } from "react";
import userService, { googleSignin, User } from "../services/user-service";
import { CredentialResponse } from "@react-oauth/google";

const useUsers = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { request } = userService.signIn({ email, password });
      const response = await request;
      setUser(response.data);

      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.accessToken!); 
      localStorage.setItem("refreshToken", response.data.refreshToken!); 

      return { success: true };
    } catch (err) {
      const errorMessage = "Email or password is incorrect. Please try again.";
      setError(errorMessage);
      console.error(err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithGoogle = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await googleSignin(credentialResponse);
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", user.accessToken!); // 🛠️ assert בטוח
      localStorage.setItem("refreshToken", user.refreshToken!);

      return { success: true };
    } catch (err) {
      const errorMessage = "Failed to sign up with Google. Please try again.";
      setError(errorMessage);
      console.error(err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userName: string,
    avatarFile?: File
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      let avatarUrl = "";

      if (avatarFile) {
        const { request: imageRequest } = userService.uploadImage(avatarFile);
        const imageResponse = await imageRequest;
        avatarUrl = imageResponse.data.url;
      }

      const { request } = userService.signUp({
        email,
        userName,
        password,
        profilePicture: avatarUrl,
      });

      const response = await request;
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.accessToken!); 
      localStorage.setItem("refreshToken", response.data.refreshToken!); 

    } catch (err) {
      setError("Failed to sign up. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await userService.logout(refreshToken); 
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
  };
  

  const updateUser = async (updatedUser: User) => {
    setIsLoading(true);
    setError(null);
    try {
      const { request } = userService.update(updatedUser);
      const response = await request;
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      return { success: true };
    } catch (err) {
      const errorMessage = "Failed to update user details. Please try again.";
      setError(errorMessage);
      console.error(err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    error,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUser,
    signUpWithGoogle,
  };
};

export default useUsers;
