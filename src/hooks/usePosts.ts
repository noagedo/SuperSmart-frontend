import { useEffect, useState } from "react";
import postService, { CanceledError, Post } from "../services/post-service";

const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const { request, cancel } = postService.getAll();
    request
      .then((res: { data: Post[] }) => {
        setPosts(res.data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setIsLoading(false);
        if (err instanceof CanceledError) return;
        setError("An unexpected error occurred.");
        console.error(err);
      });

    return () => cancel();  
  }, []);

  return { posts, setPosts, error, setError, isLoading, setIsLoading };
};

export default usePosts;
