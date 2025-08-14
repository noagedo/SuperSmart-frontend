import { Modal, Box, Typography, Paper } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { Item } from "../services/item-service";
import { getStoreName } from "../utils/storeUtils";

interface PriceChartProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
}

const PriceChart = ({ item, open, onClose }: PriceChartProps) => {
  if (!item) return null;

  // Generate weekly price data with trend indicators
  const generateWeeklyPriceData = () => {
    if (!item.storePrices || item.storePrices.length === 0) return { chartData: [], xLabels: [] };

    // Get all dates from all stores and find the date range
    const allDates: Date[] = [];
    item.storePrices.forEach(storePrice => {
      if (storePrice.prices) {
        storePrice.prices.forEach(price => {
          const dateString = price.date || price.data || "";
          if (dateString) {
            allDates.push(new Date(dateString));
          }
        });
      }
    });

    if (allDates.length === 0) return { chartData: [], xLabels: [] };

    allDates.sort((a, b) => a.getTime() - b.getTime());
    const startDate = allDates[0];
    const endDate = new Date();

    // Generate weekly intervals instead of daily
    const weeklyDates: Date[] = [];
    const currentDate = new Date(startDate);

    // Start from the beginning of the week
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());

    while (currentDate <= endDate) {
      weeklyDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 14); // Bi-weekly intervals
    }

    // Create labels for the chart
    const xLabels = weeklyDates.map(date => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    });

    // Group stores and remove duplicates
    const storeMap = new Map<string, any>();
    item.storePrices
      .filter(storePrice => storePrice && storePrice.prices && Array.isArray(storePrice.prices))
      .forEach((storePrice) => {
        const storeId = storePrice.storeId;
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, {
            ...storePrice,
            prices: [...storePrice.prices] // Create a copy of prices array
          });
        } else {
          // Merge prices if we have duplicate store entries and remove duplicates
          const existing = storeMap.get(storeId);
          const allPrices = [...existing.prices, ...storePrice.prices];

          // Remove duplicate prices based on date
          const uniquePrices = allPrices.filter((price, index, array) => {
            const currentDate = price.date || price.data || "1970-01-01";
            return array.findIndex(p => (p.date || p.data || "1970-01-01") === currentDate) === index;
          });

          existing.prices = uniquePrices;
          storeMap.set(storeId, existing);
        }
      });

    // Process each unique store
    const chartData = Array.from(storeMap.values())
      .map((storePrice) => {
        try {
          // Sort prices by date
          const sortedPrices = [...storePrice.prices]
            .sort((a, b) => {
              const dateA = a.date || a.data || "1970-01-01";
              const dateB = b.date || b.data || "1970-01-01";
              return new Date(dateA).getTime() - new Date(dateB).getTime();
            });

          // Get the closest price for each weekly interval
          const priceValues: (number | null)[] = [];

          weeklyDates.forEach(weekDate => {
            let closestPrice: number | null = null;
            let minTimeDiff = Infinity;

            sortedPrices.forEach(price => {
              const priceDate = new Date(price.date || price.data || "1970-01-01");
              const timeDiff = Math.abs(priceDate.getTime() - weekDate.getTime());

              // Only consider prices within 2 weeks of the target date
              if (timeDiff <= 14 * 24 * 60 * 60 * 1000 && timeDiff < minTimeDiff) {
                const priceValue = typeof price.price === "string"
                  ? parseFloat(price.price)
                  : price.price;
                if (!isNaN(priceValue) && priceValue > 0) {
                  closestPrice = priceValue;
                  minTimeDiff = timeDiff;
                }
              }
            });

            priceValues.push(closestPrice);
          });

          return {
            data: priceValues,
            storeId: storePrice.storeId,
          };
        } catch (error) {
          console.error(`Error processing prices for store ${storePrice.storeId}:`, error);
          return { data: [], storeId: storePrice.storeId };
        }
      })
      .filter(series => series.data.some(price => price !== null));

    return { chartData, xLabels };
  };

  const { chartData, xLabels } = generateWeeklyPriceData();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="price-history-chart"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: { xs: "90%", sm: "80%", md: "70%" },
          maxWidth: 800,
          maxHeight: "90vh",
          p: 4,
          borderRadius: 2,
          outline: "none",
          overflow: "auto",
          direction: "rtl", // Support right-to-left layout
        }}
      >
        <Typography variant="h5" gutterBottom>
          היסטוריית מחירים - {item.name}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          הצגת מחירים כל שבועיים - 🔴 עלייה במחיר | 🟢 ירידה במחיר
        </Typography>

        {/* Price trend summary */}
        {chartData.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              סיכום מגמות מחירים:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {chartData.map((series) => {
                const validPrices = series.data.filter(price => price !== null) as number[];
                if (validPrices.length < 2) return null;

                const firstPrice = validPrices[0];
                const lastPrice = validPrices[validPrices.length - 1];
                const priceDiff = lastPrice - firstPrice;
                const percentChange = ((priceDiff / firstPrice) * 100);
                const isIncreasing = priceDiff > 0;

                return (
                  <Box
                    key={series.storeId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: isIncreasing ? 'error.light' : 'success.light',
                      color: isIncreasing ? 'error.contrastText' : 'success.contrastText',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span>{isIncreasing ? '📈' : '📉'}</span>
                    <span>{getStoreName(series.storeId)}</span>
                    <span>
                      {isIncreasing ? '+' : ''}{percentChange.toFixed(1)}%
                    </span>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ height: 400, mt: 3 }}>
          {chartData.length > 0 ? (
            <LineChart
              series={chartData.map((series) => {
                // Calculate trend for color coding
                const validPrices = series.data.filter(price => price !== null) as number[];
                const isIncreasing = validPrices.length > 1 &&
                  validPrices[validPrices.length - 1] > validPrices[0];

                return {
                  curve: "linear" as const,
                  data: series.data,
                  label: getStoreName(series.storeId),
                  color: isIncreasing ? '#ef4444' : '#22c55e', // Red for increase, green for decrease
                  connectNulls: false,
                };
              })}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: "point",
                  label: "תאריך (דו-שבועי)",
                },
              ]}
              yAxis={[
                {
                  label: "מחיר (₪)",
                  labelStyle: {
                    transform: "none",
                    textAnchor: "middle",
                  },
                },
              ]}
              height={400}
              margin={{ left: 70, right: 50, top: 50, bottom: 50 }}
              slotProps={{
                legend: {
                  position: { vertical: "top", horizontal: "center" },
                },
              }}
              grid={{ vertical: true, horizontal: true }}
            />
          ) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}>
              <Typography variant="h6" gutterBottom>
                אין מספיק נתונים להצגת הגרף
              </Typography>
              <Typography variant="body2">
                נדרשים לפחות נתוני מחירים משני תאריכים שונים
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Modal>
  );
};

export default PriceChart;
