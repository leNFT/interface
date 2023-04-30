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
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

// Custom label component for the x-axis
// Custom label component for the x-axis
const CustomXAxisLabel = ({ viewBox }) => {
  const { x, y, width, height } = viewBox;
  return (
    <g transform={`translate(${x},${y + height + 25})`}>
      <text x={width / 2 + 1} y={0} dy={0} textAnchor="middle" fill="#666">
        ◄ Sell | Buy ►
      </text>
    </g>
  );
};

// Custom tick component for the x-axis
const CustomTick = ({ x, y, payload }) => {
  const labelText = Math.abs(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
        {labelText}
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
      data.push({ x: i, y });
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
        <XAxis dataKey="x" tick={<CustomTick />}>
          <Label
            content={<CustomXAxisLabel />}
            offset={0}
            position="insideBottom"
          />
        </XAxis>

        <YAxis></YAxis>
        <Tooltip />
        <Line type="monotone" dataKey="y" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CurveChart;
