// import { useEffect, useState } from "react";
// import {
//   ShoppingCart as CartIcon,
//   Delete as TrashIcon,
// } from "@mui/icons-material";
// import {
//   Box,
//   Typography,
//   Card,
//   CardContent,
//   CardMedia,
//   Button,
//   Select,
//   MenuItem,
//   Divider,
//   createTheme,
//   ThemeProvider,
//   styled,
//   List,
//   ListItem,
//   ListItemText,
//   Chip,
// } from "@mui/material";
// import { CartItem } from "../services/item-service";

// const theme = createTheme({
//   palette: {
//     primary: {
//       main: "#16a34a",
//       light: "#22c55e",
//       dark: "#15803d",
//     },
//   },
// });

// const StyledCard = styled(Card)(({ theme }) => ({
//   borderRadius: theme.spacing(2),
//   boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
//   overflow: "hidden",
// }));

// const CartItemContainer = styled(Box)(({ theme }) => ({
//   display: "flex",
//   alignItems: "center",
//   gap: theme.spacing(2),
//   padding: theme.spacing(2),
//   marginBottom: theme.spacing(2),
//   backgroundColor: "#f8fafc",
//   borderRadius: theme.spacing(1),
//   transition: "transform 0.2s ease-in-out",
//   "&:hover": {
//     transform: "translateY(-2px)",
//   },
// }));

// interface CartProps {
//   items: CartItem[];
//   onUpdateQuantity: (id: string, quantity: number) => void;
//   onRemoveItem: (id: string) => void;
// }

// export function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
//   const [showShopComparison, setShowShopComparison] = useState(false);

//   // Save cart items to localStorage whenever they change
//   useEffect(() => {
//     if (items.length > 0) {
//       localStorage.setItem("cartItems", JSON.stringify(items));
//     }
//   }, [items]);

//   const calculatePriceRange = (storePrices: CartItem["storePrices"]) => {
//     const allPrices = storePrices.flatMap((storePrice) =>
//       storePrice.prices.map((price) => price.price)
//     );
//     const lowestPrice = Math.min(...allPrices);
//     const highestPrice = Math.max(...allPrices);
//     return { lowestPrice, highestPrice };
//   };

//   const calculateCartPriceRange = (items: CartItem[]) => {
//     const totalLowestPrice = items.reduce((sum, item) => {
//       const lowestPrice = Math.min(
//         ...item.storePrices.flatMap((storePrice) =>
//           storePrice.prices.map((price) => price.price)
//         )
//       );
//       return sum + lowestPrice * item.quantity;
//     }, 0);

//     const totalHighestPrice = items.reduce((sum, item) => {
//       const highestPrice = Math.max(
//         ...item.storePrices.flatMap((storePrice) =>
//           storePrice.prices.map((price) => price.price)
//         )
//       );
//       return sum + highestPrice * item.quantity;
//     }, 0);

//     return { totalLowestPrice, totalHighestPrice };
//   };

//   // Calculate the total price for each shop
//   const calculateShopTotals = () => {
//     // Get all unique store IDs from all items
//     const allStoreIds = new Set<string>();
//     items.forEach((item) => {
//       item.storePrices.forEach((storePrice) => {
//         allStoreIds.add(storePrice.storeId);
//       });
//     });

//     const shopTotals = new Map<string, { total: number; name: string }>();

//     // Calculate the total for each store
//     allStoreIds.forEach((storeId) => {
//       let storeTotal = 0;
//       let hasAllItems = true;

//       // For each item in the cart
//       items.forEach((item) => {
//         // Find this store's price for the item
//         const storePriceObj = item.storePrices.find(
//           (sp) => sp.storeId === storeId
//         );

//         if (storePriceObj) {
//           // Get the latest price for this store
//           const latestPrice = storePriceObj.prices.reduce((latest, current) =>
//             new Date(current.date) > new Date(latest.date) ? current : latest
//           );

//           // Calculate the total for this item at this store (price * quantity)
//           storeTotal += latestPrice.price * item.quantity;
//         } else {
//           // This store doesn't have this item
//           hasAllItems = false;
//         }
//       });

//       // Only include stores that have all the items
//       if (hasAllItems) {
//         shopTotals.set(storeId, {
//           total: storeTotal,
//           name: getStoreName(storeId),
//         });
//       }
//     });

//     return Array.from(shopTotals.entries()).sort(
//       (a, b) => a[1].total - b[1].total
//     ); // Sort by lowest price
//   };

//   // Helper function to get store name from ID
//   const getStoreName = (storeId: string) => {
//     // This would ideally be fetched from your backend
//     const storeNames: Record<string, string> = {
//       "65a4e1e1e1e1e1e1e1e1e1e1": "חצי חינם",
//       "65a4e1e1e1e1e1e1e1e1e1e2": "רמי לוי",
//       // Add more store ID to name mappings as needed
//     };
//     return storeNames[storeId] || `חנות ${storeId.substring(0, 5)}`;
//   };

//   const { totalLowestPrice } = calculateCartPriceRange(items);

//   const total = items.reduce(
//     (sum, item) => sum + item.selectedStorePrice.price * item.quantity,
//     0
//   );

//   if (items.length === 0) {
//     return (
//       <StyledCard>
//         <CardContent sx={{ textAlign: "center", py: 6 }}>
//           <CartIcon
//             sx={{
//               fontSize: 48,
//               color: "primary.main",
//               opacity: 0.6,
//               mb: 2,
//             }}
//           />
//           <Typography
//             variant="h6"
//             sx={{ color: "primary.main", fontWeight: 600 }}
//           >
//             Your cart is empty
//           </Typography>
//           <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//             Start adding some products!
//           </Typography>
//         </CardContent>
//       </StyledCard>
//     );
//   }

//   return (
//     <ThemeProvider theme={theme}>
//       <StyledCard>
//         <Box sx={{ bgcolor: "primary.main", p: 3, color: "white" }}>
//           <Typography variant="h6" sx={{ fontWeight: 600 }}>
//             Shopping Cart ({items.length}{" "}
//             {items.length === 1 ? "item" : "items"})
//           </Typography>
//         </Box>

//         <CardContent>
//           {showShopComparison ? (
//             // Shop comparison view
//             <Box>
//               <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
//                 השוואת מחירים בין חנויות
//               </Typography>
//               <List>
//                 {calculateShopTotals().map(
//                   ([storeId, { total, name }], index) => (
//                     <ListItem
//                       key={storeId}
//                       sx={{
//                         bgcolor:
//                           index === 0
//                             ? "rgba(22, 163, 74, 0.1)"
//                             : "transparent",
//                         borderRadius: 1,
//                         mb: 1,
//                         border:
//                           index === 0
//                             ? "1px solid rgba(22, 163, 74, 0.3)"
//                             : "none",
//                       }}
//                     >
//                       <ListItemText
//                         primary={name}
//                         secondary={index === 0 ? "המחיר הנמוך ביותר" : null}
//                       />
//                       <Box
//                         sx={{ display: "flex", alignItems: "center", gap: 1 }}
//                       >
//                         {index === 0 && (
//                           <Chip
//                             label="הכי זול"
//                             size="small"
//                             color="primary"
//                             sx={{ mr: 1 }}
//                           />
//                         )}
//                         <Typography
//                           variant="h6"
//                           sx={{
//                             fontWeight: 600,
//                             color:
//                               index === 0 ? "primary.main" : "text.primary",
//                           }}
//                         >
//                           ₪{total.toFixed(2)}
//                         </Typography>
//                       </Box>
//                     </ListItem>
//                   )
//                 )}
//               </List>
//             </Box>
//           ) : (
//             // Regular cart view
//             <Box sx={{ mb: 3 }}>
//               {items.map((item) => (
//                 <CartItemContainer key={item._id}>
//                   <CardMedia
//                     component="img"
//                     image={
//                       item.image ||
//                       "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
//                     }
//                     alt={item.name}
//                     sx={{
//                       width: 80,
//                       height: 80,
//                       borderRadius: 1.5,
//                       objectFit: "cover",
//                       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
//                     }}
//                   />
//                   <Box sx={{ flex: 1 }}>
//                     <Box
//                       sx={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         mb: 1,
//                       }}
//                     >
//                       <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                         {item.name}
//                       </Typography>
//                     </Box>
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       sx={{ mb: 1 }}
//                     >
//                       Quantity: {item.quantity}
//                     </Typography>
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       sx={{ mb: 1 }}
//                     >
//                       {(() => {
//                         const { lowestPrice, highestPrice } =
//                           calculatePriceRange(item.storePrices);
//                         return `Price Range: ₪${lowestPrice.toFixed(
//                           2
//                         )} - ₪${highestPrice.toFixed(2)}`;
//                       })()}
//                     </Typography>
//                     <Box
//                       sx={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                       }}
//                     >
//                       <Select
//                         value={item.quantity}
//                         onChange={(e) =>
//                           onUpdateQuantity(item._id, Number(e.target.value))
//                         }
//                         size="small"
//                         sx={{
//                           minWidth: 80,
//                           "& .MuiOutlinedInput-notchedOutline": {
//                             borderColor: "primary.main",
//                           },
//                         }}
//                       >
//                         {[1, 2, 3, 4, 5].map((num) => (
//                           <MenuItem key={num} value={num}>
//                             {num}
//                           </MenuItem>
//                         ))}
//                       </Select>
//                       <Button
//                         onClick={() => onRemoveItem(item._id)}
//                         color="error"
//                         startIcon={<TrashIcon />}
//                         size="small"
//                         sx={{
//                           "&:hover": {
//                             backgroundColor: "error.light",
//                             color: "white",
//                           },
//                         }}
//                       >
//                         Remove
//                       </Button>
//                     </Box>
//                   </Box>
//                 </CartItemContainer>
//               ))}
//             </Box>
//           )}

//           <Divider sx={{ my: 3 }} />

//           <Button
//             variant="contained"
//             fullWidth
//             sx={{
//               bgcolor: "primary.main",
//               color: "white",
//               py: 1.5,
//               fontSize: "1.1rem",
//               fontWeight: 600,
//               borderRadius: 2,
//               mb: 2,
//               "&:hover": {
//                 bgcolor: "primary.dark",
//               },
//               "&:active": {
//                 transform: "scale(0.98)",
//               },
//             }}
//             onClick={() => setShowShopComparison(!showShopComparison)}
//           >
//             {showShopComparison
//               ? "חזרה לעגלת הקניות"
//               : "השוואת מחירים בסופרים שונים"}
//           </Button>
//         </CardContent>
//       </StyledCard>
//     </ThemeProvider>
//   );
// }
