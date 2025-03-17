import { useEffect, useState } from "react";
import commentService, { Comment } from "../services/comment-service";
import { CanceledError } from "../services/api-client"; 

interface CommentWithUser extends Comment {
  user: {
    userName: string;
    profilePicture: string;
  };
}

const useComments = (postId: string) => {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const { request, cancel } = commentService.get(postId);
    request
      .then((res: { data: CommentWithUser[] }) => {
        setComments(res.data); 
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setIsLoading(false);
        if (err instanceof CanceledError) return;
        setError("An unexpected error occurred.");
        console.error(err);
      });

    return () => cancel();
  }, [postId]);

  return { comments, setComments, error, setError, isLoading, setIsLoading };
};

export default useComments;
