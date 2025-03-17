import { useState } from "react";
import postService, { CanceledError } from "../services/post-service";
import { Post } from "../services/post-service";

const useAddPost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPost = async (postData: Partial<Post>) => {
    setIsLoading(true);
    setError(null);
    try {
      const completePostData: Post = { _id: "", ...postData } as Post;
      const { request } = postService.add(completePostData);
      const response = await request;
      setIsLoading(false);
      return response.data; 
    } catch (err: unknown) {
      setIsLoading(false);
      if (!(err instanceof CanceledError)) {
        setError("Failed to create post. Please try again.");
      }
      throw err;
    }
  };

  return { addPost, isLoading, error };
};

export default useAddPost;
