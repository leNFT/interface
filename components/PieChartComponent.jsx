import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const PieChartComponent = ({ data, title }) => {
  console.log("data", data);
  data = {
    "0xbABd746E2B4C73C56A8B7B0D521Cfe0e2eB6137C": 20,
    "0xa139124944192acF3633Cc3Def5F8153eBcB8074": 30,
    "0xb2d5027A5659D6637B6eB4bE9F3497E8Db004489": 40,
    "0x68a5Df8c9A6069Be1B1F66776Efe0318826A1088": 50,
    "0xd9E1CE17F2641f24aE83637AB66A2CCA9C378B9F": 60,
  };

  const transformedData = Object.entries(data).map(([name, value]) => ({
    name:
      name.length > 10 ? `${name.substring(0, 6)}...${name.slice(-3)}` : name,
    value,
  }));

  return (
    <div className="flex flex-col justify-center">
      <h3 className="text-center mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="value"
            data={transformedData}
            cx="50%"
            cy="50%"
            outerRadius={90}
            fill="#8884d8"
            label={({ name }) => name}
            labelLine={true}
          >
            {transformedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export { PieChartComponent };
