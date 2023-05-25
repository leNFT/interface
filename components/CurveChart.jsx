import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

// Custom label component for the x-axis
const CustomXAxisLabel = ({ viewBox }) => {
  const { x, y, width, height } = viewBox;
  return (
    <g transform={`translate(${x},${y + height - 4})`}>
      <text x={width / 2 + 1} y={0} dy={0} textAnchor="middle" fill="#666">
        ◄ Sell | Buy ►
      </text>
    </g>
  );
};

const formatYAxisTick = (value) => {
  return parseFloat(value).toPrecision(3);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    let actionText;
    let buyPrice, sellPrice;
    const price = Number(payload[0].value); // Access price here
    const fee = Number(payload[0].payload.fee); // Access fee here

    console.log("CustomTooltip", { price, fee });

    if (label === 0) {
      actionText = "Initial Price";
      buyPrice = (price * (100 + fee)) / 100;
      sellPrice = (price * (100 - fee)) / 100;
    } else if (label < 0) {
      actionText = `Sell ${Math.abs(label)}`;
      buyPrice = (price * (100 + fee)) / 100;
      sellPrice = (price * (100 - fee)) / 100;
    } else if (label > 0) {
      actionText = `Buy ${label}`;
      buyPrice = (price * (100 + fee)) / 100;
      sellPrice = (price * (100 - fee)) / 100;
    }

    return (
      <div
        style={{
          backgroundColor: "#f5f5f5",
          border: "1px solid #ccc",
          padding: "5px",
        }}
      >
        <p>{actionText}</p>
        {buyPrice && (
          <p>{`Buy Price: ${parseFloat(buyPrice).toPrecision(3)}`}</p>
        )}
        {sellPrice && (
          <p>{`Sell Price: ${parseFloat(sellPrice).toPrecision(3)}`}</p>
        )}
      </div>
    );
  }

  return null;
};

const CurveChart = ({
  curveType = "exponential",
  delta = 20,
  fee = 10,
  initialPrice = 0.1,
}) => {
  console.log("CurveChart render", { curveType, delta, initialPrice });

  const generateCurveData = () => {
    const data = [];
    const numPoints = 10;

    for (let i = -numPoints / 2; i <= numPoints / 2; i++) {
      let y;
      if (curveType === "linear") {
        y = Number(Number(initialPrice) + delta * i).toFixed(6);
      } else if (curveType === "exponential") {
        y = Number(Number(initialPrice) * (1 + delta / 100) ** i).toFixed(6);
      }
      if (y >= 0) {
        data.push({ x: i, y, fee });
      }
    }
    return data;
  };

  const curveData = generateCurveData();
  const yMin = Math.min(...curveData.map((d) => d.y));
  const yMax = Math.max(...curveData.map((d) => d.y));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={curveData}
        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" tickLine={false} tickFormatter={() => ""}>
          <Label
            content={<CustomXAxisLabel />}
            offset={0}
            position="insideBottom"
          />
        </XAxis>
        <YAxis domain={[yMin, yMax]} tickFormatter={formatYAxisTick} />

        <Tooltip content={<CustomTooltip />} />
        <Line
          dot={({ cx, cy, index }) => (
            <circle
              cx={cx}
              cy={cy}
              r={5}
              fill={
                index == Math.floor(curveData.length / 2)
                  ? "white"
                  : index < curveData.length / 2
                  ? "red"
                  : "#4CBB17"
              }
              stroke={index === 5 ? "#8884d8" : "none"}
            />
          )}
          type="monotone"
          strokeWidth={3}
          dataKey="y"
          stroke="#8884d8"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CurveChart;
