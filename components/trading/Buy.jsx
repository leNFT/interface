import { Button } from "grommet";
import { useState } from "react";
import Box from "@mui/material/Box";
import LimitBuy from "./LimitBuy";
import MarketBuy from "./MarketBuy";

export default function Trade() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("market");

  return (
    <div className="flex flex-col items-center text-center w-full py-4 md:w-fit md:p-8 justify-center my-4 rounded-3xl bg-black/5 shadow-lg">
      <div className="flex flex-row">
        <div className="flex flex-col m-2">
          <Button
            primary
            size="small"
            color={option == "market" ? SELECTED_COLOR : UNSELECTED_COLOR}
            onClick={() => {
              setOption("market");
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
                  Market
                </Box>
              </div>
            }
          />
        </div>
        <div className="flex flex-col m-2">
          <Button
            primary
            size="small"
            color={option == "limit" ? SELECTED_COLOR : UNSELECTED_COLOR}
            onClick={() => {
              setOption("limit");
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
                  Limit
                </Box>
              </div>
            }
          />
        </div>
      </div>
      <div className="flex flex-row items-center">
        {option == "market" && <MarketBuy />}
        {option == "limit" && <LimitBuy />}
      </div>
    </div>
  );
}
