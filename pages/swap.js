import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { Button, Menu } from "grommet";
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

import { Divider } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { formatUnits, parseUnits } from "@ethersproject/units";

import { Loading, Typography, Input } from "@web3uikit/core";

export default function Swap() {
  const { chain } = useNetwork();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("buy");

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center text-center justify-center md:w-6/12 border-4 m-2 rounded-3xl bg-black/5 shadow-lg">
        <div className="flex flex-row m-4">
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
        <div className="flex flex-row w-10/12 justify-center items-center">
          <Divider style={{ width: "100%" }} />
        </div>
        <div className="flex flex-row m-8">
          <Autocomplete
            disablePortal
            ListboxProps={{
              style: {
                backgroundColor: "rgb(253, 241, 244)",
                fontFamily: "Monospace",
              },
            }}
            isOptionEqualToValue={(option, value) =>
              option.address === value.address
            }
            sx={{ minWidth: { xs: 180, sm: 250, md: 300 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Collection"
                sx={{
                  "& label": {
                    paddingLeft: (theme) => theme.spacing(2),
                    fontFamily: "Monospace",
                  },
                  "& input": {
                    paddingLeft: (theme) => theme.spacing(3.5),
                    fontFamily: "Monospace",
                  },
                  "& fieldset": {
                    paddingLeft: (theme) => theme.spacing(2.5),
                    fontFamily: "Monospace",
                  },
                }}
              />
            )}
          />
        </div>
        <div className="flex flex-row justify-center mb-8 mx-4">
          <div className="flex flex-col w-4/12 justify-center m-2">
            <TextField size="small" placeholder="Amount" variant="outlined" />
          </div>
          <div className="flex flex-col text-center justify-center m-2">OR</div>
          <div className="flex flex-col text-center justify-center m-2">
            <Button
              primary
              size="medium"
              color={SELECTED_COLOR}
              onClick={() => {}}
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
                    Select NFTs
                  </Box>
                </div>
              }
            />
          </div>
        </div>
        <div className="flex flex-row w-11/12 justify-center items-center">
          <Divider style={{ width: "100%" }} />
        </div>
        <div className="flex flex-row m-4 w-4/12">
          <Button
            primary
            fill="horizontal"
            size="large"
            color="#063970"
            onClick={() => {}}
            label={
              <div className="flex justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {option.toUpperCase()}
                </Box>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
