import { useState, useEffect } from "react";
import itemService, { Item, CanceledError } from "../services/item-service";

const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { request, cancel } = itemService.getAll();
    request
      .then((response) => {
        setItems(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error instanceof CanceledError) return;
        setError(error.message);
        setIsLoading(false);
      });

    return () => cancel();
  }, []);

  return { items, isLoading, error };
};

export default useItems;
