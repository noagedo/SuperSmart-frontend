import { FC } from "react";
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
} from "@mui/material";
import { Item } from "../services/item-service";

interface ItemCardProps extends Item {
  onItemSelected: (id: string) => void;
  user: any;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  showMenu: boolean;
}

const ItemCard: FC<ItemCardProps> = ({
  _id,
  name,
  category,
  storePrices,
  suggestedAlternatives,
  onItemSelected,
  onEditItem,
  onDeleteItem,
  showMenu,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{name}</Typography>
        <Typography variant="body2" color="textSecondary">
          Category: {category}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Store Prices:{" "}
          {storePrices.map((sp) => `${sp.storeId}: $${sp.price}`).join(", ")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Suggested Alternatives:{" "}
          {suggestedAlternatives.map((sa) => sa.itemId).join(", ")}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onItemSelected(_id)}>
          View
        </Button>
        {showMenu && (
          <>
            <Button size="small" onClick={() => onEditItem(_id)}>
              Edit
            </Button>
            <Button size="small" onClick={() => onDeleteItem(_id)}>
              Delete
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default ItemCard;
