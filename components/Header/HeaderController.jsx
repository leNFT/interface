import Link from "next/link";
import LendingHeader from "./LendingHeader";
import SwapHeader from "./SwapHeader";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BannerStrip } from "@web3uikit/core";
import { Reload } from "@web3uikit/icons";
import Box from "@mui/material/Box";
import { useAccount, useNetwork } from "wagmi";
import { useSwitchNetwork } from "wagmi";
import { useState, useEffect } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Router from "next/router";

export default function HeaderController() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [mode, setMode] = useState("swap");

  function handleModeChange(event) {
    console.log(event.target.value);
    setMode(event.target.value);

    if (event.target.value == "swap") {
      Router.push({
        pathname: "/swap",
      });
    } else {
      Router.push({
        pathname: "/lend",
      });
    }
  }

  return (
    <div>
      {chain && isConnected && chain.id != 5 && (
        <div className="mb-6">
          <BannerStrip
            buttonDisplayed
            buttonConfig={{
              onClick: function noRefCheck() {
                switchNetwork(5);
              },
              iconLayout: "icon-only",
              icon: (
                <Reload fontSize="28px" color="#000000" title="Reload Icon" />
              ),
            }}
            text="leNFT is only live on the Goerli testnet. Change networks to use the beta."
            type="warning"
          />
        </div>
      )}
      <div className="p-4 pb-0 md:pb-2 mb-2 border-b-2 flex flex-row justify-between items-center">
        <div className="hidden 2xl:flex flex-col items-center justify-content lg:pr-8">
          <Link href="/">
            <a target="_blank" rel="noopener noreferrer">
              <div className="px-4 mt-2 flex flex-row items-center">
                <div className="flex flex-col items-center">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                    }}
                  >
                    <div className="font-bold text-2xl">leNFT</div>
                  </Box>
                </div>
                <div className="flex flex-col ml-1 mb-4 items-center justify-content">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                    }}
                  >
                    <div className="text-2xl">.finance</div>
                  </Box>
                </div>
              </div>
              <div className="flex flex-row justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                  }}
                ></Box>
              </div>
            </a>
          </Link>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <ToggleButtonGroup
              size="small"
              color="warning"
              exclusive
              value={mode}
              onChange={handleModeChange}
            >
              <ToggleButton
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                  fontWeight: "bold",
                  letterSpacing: 4,
                }}
                value="swap"
              >
                Swap
              </ToggleButton>
              <ToggleButton
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                  fontWeight: "bold",
                  letterSpacing: 4,
                }}
                value="lend"
              >
                Lend
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          {mode == "swap" ? <SwapHeader /> : <LendingHeader />}
        </div>
        <div className="flex flex-col items-center px-8">
          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: "none", largeScreen: "icon" }}
            accountStatus="address"
          />
        </div>
      </div>
    </div>
  );
}
