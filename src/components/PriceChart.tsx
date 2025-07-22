import { Modal, Box, Typography, Paper } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import itemService, { Item } from "../services/item-service";
import { getStoreName } from "../utils/storeUtils";

interface PriceChartProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
}

const PriceChart = ({ item, open, onClose }: PriceChartProps) => {
  if (!item) return null;

  const chartData = itemService.formatPriceDataForChart(item);

  // Generate complete date range from first price date to today
  const generateDateRange = () => {
    if (!item.storePrices || item.storePrices.length === 0) return [];

    // Get all dates from all stores
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

    if (allDates.length === 0) return [];

    // Sort dates and get the first and last dates
    allDates.sort((a, b) => a.getTime() - b.getTime());
    const startDate = allDates[0];
    const endDate = new Date(); // Today

    // Generate all dates from start to end
    const dateRange: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dateRange.push(`${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateRange;
  };

  const xLabels = generateDateRange();

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
        <Box sx={{ height: 300, mt: 3 }}>
          {chartData.length > 0 ? (
            <LineChart
              series={chartData.map((series) => ({
                curve: "linear",
                data: series.data,
                label: getStoreName(series.storeId),
              }))}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: "point",
                  label: "תאריך",
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
              height={300}
              slotProps={{
                legend: {
                  position: { vertical: "top", horizontal: "center" },
                },
              }}
            />
          ) : (
            <Typography>אין מספיק נתונים להצגת הגרף</Typography>
          )}
        </Box>
      </Paper>
    </Modal>
  );
};

export default PriceChart;
