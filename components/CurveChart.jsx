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

const CurveChart = ({
  curveType = "exponential",
  delta = 20,
  initialPrice = 0.1,
}) => {
  console.log("CurveChart render", { curveType, delta, initialPrice });
  const generateCurveData = () => {
    const data = [];
    const numPoints = 10;

    for (let i = -numPoints / 2; i <= numPoints / 2; i++) {
      let y;
      if (curveType === "linear") {
        y = Number(initialPrice) + delta * i;
      } else if (curveType === "exponential") {
        y = Number(initialPrice) * (1 + delta / 100) ** i;
      }
      if (y >= 0) {
        data.push({ x: i, y });
      }
    }
    return data;
  };

  const curveData = generateCurveData();

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
        <YAxis />
        <Tooltip />
        <Line
          dot={({ cx, cy, index }) => (
            <circle
              cx={cx}
              cy={cy}
              r={5}
              fill={
                index === 5
                  ? "white"
                  : index < curveData.length / 2
                  ? "red"
                  : "green"
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
