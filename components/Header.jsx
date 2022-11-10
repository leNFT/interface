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
      {chain && chain.id != 1 && isConnected && (
        <div className="mb-6">
          <BannerStrip
            buttonDisplayed
            buttonConfig={{
              onClick: function noRefCheck() {
                switchNetwork(1);
              },
              iconLayout: "icon-only",
              icon: (
                <Reload fontSize="26px" color="#000000" title="Reload Icon" />
              ),
            }}
            text="Switch to Ethereum mainnet."
            type="warning"
          />
        </div>
      )}
      <div className="p-4 mb-2 border-b-2 flex flex-row justify-between items-center">
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
                  icon: <Home className="mr-2" fontSize="20px" />,
                },
                {
                  label: (
                    <Box
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
                  icon: <Plus className="mr-2" fontSize="20px" />,
                },
                {
                  label: (
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      Loans
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/loans",
                    });
                  },
                  icon: <Search className="mr-2" fontSize="20px" />,
                },
                {
                  label: (
                    <Box
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
                  icon: <LockClosed className="mr-2" fontSize="20px" />,
                },
                {
                  label: (
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        letterSpacing: 2,
                      }}
                    >
                      Genesis
                    </Box>
                  ),
                  onClick: () => {
                    Router.push({
                      pathname: "/genesis",
                    });
                  },
                  icon: <Rocket className="mr-2" fontSize="20px" />,
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
              <Link href="/loans">
                <Button
                  primary
                  size="medium"
                  color={option == "loans" ? SELECTED_COLOR : UNSELECTED_COLOR}
                  onClick={() => {
                    setOption("loans");
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
                        Loans
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
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      </div>
    </div>
  );
}
