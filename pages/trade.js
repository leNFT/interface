import { Button } from "grommet";
import { useState } from "react";
import Box from "@mui/material/Box";
import Buy from "../components/trading/Buy";
import Sell from "../components/trading/Sell";
import Swap from "../components/trading/Swap";

export default function Trade() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("buy");

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row">
        <div className="flex flex-col m-2">
          <Button
            primary
            size="medium"
            color={option == "swap" ? SELECTED_COLOR : UNSELECTED_COLOR}
            onClick={() => {
              setOption("swap");
            }}
            label={
              <div className="flex">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  Swap
                </Box>
              </div>
            }
          />
        </div>
        <div className="flex flex-col m-2">
          <Button
            primary
            size="medium"
            color={option == "buy" ? SELECTED_COLOR : UNSELECTED_COLOR}
            onClick={() => {
              setOption("buy");
            }}
            label={
              <div className="flex">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  Buy
                </Box>
              </div>
            }
          />
        </div>
        <div className="flex flex-col m-2">
          <Button
            primary
            size="medium"
            color={option == "sell" ? SELECTED_COLOR : UNSELECTED_COLOR}
            onClick={() => {
              setOption("sell");
            }}
            label={
              <div className="flex">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  Sell
                </Box>
              </div>
            }
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        {option == "swap" && <Swap />}
        {option == "buy" && <Buy />}
        {option == "sell" && <Sell />}
      </div>
    </div>
  );
}
