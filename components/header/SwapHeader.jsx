import Link from "next/link";
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
import Router from "next/router";

export default function SwapHeader() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("swap");

  return (
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
                  Swap
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/swap",
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
                  Trading Pools
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/tradingPools",
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
                  Lock
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/lock",
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
          <Link href="/swap">
            <Button
              primary
              size="medium"
              color={option == "swap" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("swap");
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
                    Swap
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
          <Link href="/tradingPools">
            <Button
              primary
              size="medium"
              color={option == "pools" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("pools");
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
                    Pools
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
          <Link href="/lock">
            <Button
              primary
              size="medium"
              color={option == "lock" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("lock");
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
                    Lock
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
              color={option == "genesis" ? SELECTED_COLOR : UNSELECTED_COLOR}
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
  );
}
