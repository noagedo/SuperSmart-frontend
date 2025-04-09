import { useState, useEffect } from "react";
import itemService, { Item, CanceledError } from "../services/item-service";

const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    itemService.getAll()
      .then((response: { data: Item[] }) => {
        setItems(response.data);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof CanceledError) return;
        setError((error as Error).message);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { items, isLoading, error };
};

export default useItems;