import { FC, useEffect, useState } from "react";
import { Grid, Button, Box } from "@mui/material";
import ItemCard from "./ItemCard";
import useItems from "../hooks/useItems";
import useUsers from "../hooks/useUsers";

const ItemsList: FC = () => {
  const { items, isLoading, error } = useItems();
  const { user: initialUser } = useUsers();
  const [user, setUser] = useState(initialUser);
  const [visibleItems, setVisibleItems] = useState(5);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [setUser]);

  if (!user) {
    return <p>Please log in to view items.</p>;
  }

  const handleEditItem = (itemId: string) => {
    console.log("Edit Item ID:", itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    console.log("Delete Item ID:", itemId);
  };

  const handleLoadMoreItems = () => {
    setVisibleItems((prev) => prev + 5);
  };

  return (
    <div>
      <br />
      {isLoading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {items.length === 0 && !isLoading && <p>No items available.</p>}

      <Grid container spacing={2}>
        {items.slice(0, visibleItems).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <ItemCard
              _id={item._id}
              name={item.name}
              category={item.category}
              storePrices={item.storePrices}
              suggestedAlternatives={item.suggestedAlternatives}
              onItemSelected={(id) => console.log("Selected Item ID:", id)}
              user={user}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              showMenu={false}
            />
          </Grid>
        ))}
      </Grid>
      {visibleItems < items.length && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Button onClick={handleLoadMoreItems} variant="contained">
            Load More
          </Button>
        </Box>
      )}
    </div>
  );
};

export default ItemsList;
