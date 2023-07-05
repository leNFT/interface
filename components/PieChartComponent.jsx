import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const PieChartComponent = ({ data, title }) => {
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
