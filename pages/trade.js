import { Button } from "grommet";
import { useState } from "react";
import Box from "@mui/material/Box";
import Swap from "../components/trading/Swap";
import BuyAndSell from "../components/trading/BuyAndSell";

export default function Trade() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("buy");
  const [nftAddress, setNFTAddress] = useState("");

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

      {option == "swap" && <Swap />}
      {option == "buy" && (
        <BuyAndSell
          nftAddress={nftAddress}
          setNFTAddress={setNFTAddress}
          option="buy"
        />
      )}
      {option == "sell" && (
        <BuyAndSell
          nftAddress={nftAddress}
          setNFTAddress={setNFTAddress}
          option="sell"
        />
      )}
    </div>
  );
}
