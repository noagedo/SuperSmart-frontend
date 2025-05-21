import React, { useState } from "react";
import {
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Mail } from "lucide-react";
import useCart from "../hooks/useCart";
import axios from "axios";
import useAuth from "../hooks/useUsers";
import { Cart } from "../services/cart-service";
import useItems from "../hooks/useItems";

interface CartEmailSenderProps {
  buttonColor?: string;
  size?: number;
  savedCart?: Cart;
  hideTooltip?: boolean;
  onlyIcon?: boolean;
}

export interface Item {
  _id: string;
  name: string;
  category: string;
  image?: string;
  code?: string;
  barcode?: string;
}

const CartEmailSender: React.FC<CartEmailSenderProps> = ({
  buttonColor = "#16a34a",
  size = 24,
  savedCart,
  hideTooltip = false,
  onlyIcon = false,
}) => {
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info",
  });

  const { cart } = useCart();
  const { user } = useAuth();
  const { items: allProducts } = useItems();

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const sendEmail = async () => {
    if (!user || !user.email) {
      if (!onlyIcon) {
        setSnackbar({
          open: true,
          message: "יש להתחבר כדי לשלוח את העגלה למייל",
          severity: "error",
        });
      }
      return;
    }

    let cartItems: { productId: string; name: string; quantity: number; price?: number }[] = [];
    let cartName = "";

    if (savedCart) {
      if (!savedCart.items || savedCart.items.length === 0) {
        if (!onlyIcon) {
          setSnackbar({
            open: true,
            message: "העגלה ריקה",
            severity: "info",
          });
        }
        return;
      }

      cartItems = savedCart.items.map(item => {
        const productDetails = allProducts?.find(p => p._id === item.productId);
        return {
          productId: item.productId,
          name: productDetails?.name || "מוצר לא מזוהה",
          quantity: item.quantity,
          price: productDetails?.storePrices?.[0]?.prices?.[0]?.price || 0
        };
      });

      cartName = savedCart.name || "עגלה שמורה";

    } else {
      if (!cart || !cart.items || cart.items.length === 0) {
        if (!onlyIcon) {
          setSnackbar({
            open: true,
            message: "העגלה ריקה",
            severity: "info",
          });
        }
        return;
      }

      cartItems = cart.items.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.selectedStorePrice?.price || 0,
      }));

      cartName = "עגלה נוכחית";
    }

    const itemDescriptions = cartItems.map(item =>
      `${item.name} - כמות: ${item.quantity}${item.price ? ` - מחיר: ₪${item.price}` : ''}`
    );

    setSending(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      await axios.post(`${API_BASE_URL}/send-cart-email`, {
        email: user.email,
        cart: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price || 0
        })),
        userName: user.userName || user.email,
        cartName,
        formattedItems: itemDescriptions,  
        itemsList: itemDescriptions.join('\n'),
        cartItemsCount: cartItems.length,
       
        htmlItems: `<ul>${itemDescriptions.map(desc => `<li>${desc}</li>`).join('')}</ul>`
      });

      if (!onlyIcon) {
        setSnackbar({
          open: true,
          message: "העגלה נשלחה בהצלחה לכתובת המייל שלך",
          severity: "success",
        });
      }

    } catch (error) {
      console.error("Error sending email:", error);
      if (!onlyIcon) {
        setSnackbar({
          open: true,
          message: "אירעה שגיאה בשליחת המייל",
          severity: "error",
        });
      }
    } finally {
      setSending(false);
    }
  };

  const button = (
    <IconButton
      onClick={sendEmail}
      disabled={sending}
      sx={{ color: buttonColor, position: "relative" }}
    >
      {sending ? (
        <CircularProgress size={size - 2} color="inherit" thickness={5} />
      ) : (
        <Mail size={size} />
      )}
    </IconButton>
  );

  return (
    <>
      {hideTooltip ? button : (
        <Tooltip title="שלח את העגלה למייל">
          {button}
        </Tooltip>
      )}

      {!onlyIcon && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default CartEmailSender;
