import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BannerStrip } from "@web3uikit/core";
import { Button, Menu } from "grommet";
import {
  Home,
  Search,
  Reload,
  Plus,
  LockClosed,
  Rocket,
  Menu as MenuIcon,
} from "@web3uikit/icons";
import Box from "@mui/material/Box";
import { useState } from "react";
import { useAccount, useNetwork } from "wagmi";
import { useSwitchNetwork } from "wagmi";
import Router from "next/router";

export default function Header() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [option, setOption] = useState("home");

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
            text="leNFT is live on the Goerli testnet. Switch network to use the beta."
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
                >
                  {isConnected && chain.id != 1 ? (
                    <div className="text-red-700">[ BETA ]</div>
                  ) : (
                    <div className="text-red-700">[ ALPHA ]</div>
                  )}
                </Box>
              </div>
            </a>
          </Link>
        </div>
        <div className="flex flex-row items-center m-2">
          <div className="flex md:hidden px-2">
            <Menu
              icon={false}
              label={
                <div className="flex md:hidden xl:flex">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 2,
                    }}
                  >
                    <div className="flex flex-row items-center">
                      <MenuIcon
                        className="m-2 mr-4"
                        fontSize="30px"
                        color="#000000"
                      />
                      leNFT
                    </div>
                  </Box>
                </div>
              }
              items={[
                {
                  label: (
                    <Box
                      className="m-1"
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      Home
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/app",
                    });
                  },
                  icon: (
                    <div className="mr-1 my-1">
                      <Home fontSize="20px" />
                    </div>
                  ),
                },
                {
                  label: (
                    <Box
                      className="m-1"
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      Reserves
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/reserves",
                    });
                  },
                  icon: (
                    <div className="mr-1 my-1">
                      <Plus fontSize="20px" />
                    </div>
                  ),
                },
                {
                  label: (
                    <Box
                      className="m-1"
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      Search
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/search",
                    });
                  },
                  icon: (
                    <div className="mr-1 my-1">
                      <Search fontSize="20px" />
                    </div>
                  ),
                },
                {
                  label: (
                    <Box
                      className="m-1"
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      Stake
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/stake",
                    });
                  },
                  icon: (
                    <div className="mr-1 my-1">
                      <LockClosed fontSize="20px" />
                    </div>
                  ),
                },
                {
                  label: (
                    <Box
                      className="m-1"
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      leGenesis
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/genesis",
                    });
                  },
                  icon: (
                    <div className="mr-1 my-1">
                      <Rocket fontSize="20px" />
                    </div>
                  ),
                },
              ]}
            />
          </div>
          <div className="hidden md:flex flex-row md:items-center">
            <div className="flex flex-col m-2">
              <Link href="/app">
                <Button
                  primary
                  size="medium"
                  color={option == "home" ? SELECTED_COLOR : UNSELECTED_COLOR}
                  onClick={() => {
                    setOption("home");
                  }}
                  label={
                    <div className="flex md:hidden xl:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Home
                      </Box>
                    </div>
                  }
                  icon={
                    <div className="pl-[10px]">
                      <Home fontSize="20px" color="#000000" />
                    </div>
                  }
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <Link href="/reserves">
                <Button
                  primary
                  size="medium"
                  color={
                    option == "reserves" ? SELECTED_COLOR : UNSELECTED_COLOR
                  }
                  onClick={() => {
                    setOption("reserves");
                  }}
                  label={
                    <div className="flex md:hidden xl:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Reserves
                      </Box>
                    </div>
                  }
                  icon={
                    <div className="pl-[10px]">
                      <Plus fontSize="16px" color="#000000" />
                    </div>
                  }
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <Link href="/search">
                <Button
                  primary
                  size="medium"
                  color={option == "search" ? SELECTED_COLOR : UNSELECTED_COLOR}
                  onClick={() => {
                    setOption("search");
                  }}
                  label={
                    <div className="flex md:hidden xl:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Search
                      </Box>
                    </div>
                  }
                  icon={
                    <div className="pl-[10px]">
                      <Search fontSize="20px" color="#000000" />
                    </div>
                  }
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <Link href="/stake">
                <Button
                  primary
                  size="medium"
                  color={option == "stake" ? SELECTED_COLOR : UNSELECTED_COLOR}
                  onClick={() => {
                    setOption("stake");
                  }}
                  label={
                    <div className="flex md:hidden xl:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Stake
                      </Box>
                    </div>
                  }
                  icon={
                    <div className="pl-[10px]">
                      <LockClosed fontSize="20px" color="#000000" />
                    </div>
                  }
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <Link href="/genesis">
                <Button
                  primary
                  size="medium"
                  color={
                    option == "genesis" ? SELECTED_COLOR : UNSELECTED_COLOR
                  }
                  onClick={() => {
                    setOption("genesis");
                  }}
                  label={
                    <div className="flex md:hidden xl:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        leGenesis
                      </Box>
                    </div>
                  }
                  icon={
                    <div className="pl-[10px]">
                      <Rocket fontSize="20px" color="#000000" />
                    </div>
                  }
                />
              </Link>
            </div>
          </div>
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
