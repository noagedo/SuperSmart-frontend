import { Modal, Box, Typography, Paper } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import itemService, { Item } from "../services/item-service";

interface PriceChartProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
}

const getStoreName = (storeId: string): string => {
  // This function should be expanded with actual store names
  const storeNames: Record<string, string> = {
    "65a4e1e1e1e1e1e1e1e1e1e1": "שופרסל",
    "65a4e1e1e1e1e1e1e1e1e1e2": "רמי לוי",
    // Add more stores as needed
  };
  return storeNames[storeId] || `חנות ${storeId.substring(0, 5)}`;
};

const PriceChart = ({ item, open, onClose }: PriceChartProps) => {
  if (!item) return null;

  const chartData = itemService.formatPriceDataForChart(item);

  // Generate labels for the x-axis (dates)
  const xLabels =
    item.storePrices.length > 0 && item.storePrices[0].prices.length > 0
      ? item.storePrices[0].prices.map((p) => {
          const date = new Date(p.date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        })
      : [];

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
                    transform: "rotate(-90deg)",
                  },
                },
              ]}
              height={300}
              slotProps={{
                legend: {
                  direction: "row",
                  position: { vertical: "bottom", horizontal: "middle" },
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
