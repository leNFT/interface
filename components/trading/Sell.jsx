import { Button } from "grommet";
import { useState } from "react";
import Box from "@mui/material/Box";
import LimitSell from "./LimitSell";
import MarketSell from "./MarketSell";

export default function Trade() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("market");
  const [backgroundImageURL, setBackgroundImageURL] = useState("");

  const setBackgroundImage = (imageURL) => {
    setBackgroundImageURL(imageURL);
  };

  return (
    <div
      className="flex flex-col items-center text-center w-full py-4 md:w-fit md:p-8 justify-center my-4 rounded-3xl bg-black/5 shadow-lg"
      style={{
        ...(backgroundImageURL && {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.96)), url('${backgroundImageURL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }),
      }}
    >
      <div className="flex flex-row">
        <div className="flex flex-col m-2">
          <Button
            primary
            size="small"
            color={option == "market" ? SELECTED_COLOR : UNSELECTED_COLOR}
            onClick={() => {
              setBackgroundImageURL("");
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
              setBackgroundImageURL("");
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
        {option == "market" && (
          <MarketSell setBackgroundImage={setBackgroundImage} />
        )}
        {option == "limit" && (
          <LimitSell setBackgroundImage={setBackgroundImage} />
        )}
      </div>
    </div>
  );
}
