import Link from "next/link";
import { Button, Menu } from "grommet";
import { Badge } from "@nextui-org/react";
import {
  Home,
  Search,
  Reload,
  Plus,
  LockClosed,
  Rocket,
  Trending,
  Menu as MenuIcon,
} from "@web3uikit/icons";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import Router from "next/router";
import { useRouter } from "next/router";

export default function TradeHeader() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const { router, asPath } = useRouter();

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
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Trade
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/trade",
                });
              },
              icon: (
                <div className="mr-1 my-1">
                  <Trending fontSize="20px" />
                </div>
              ),
            },
            // {
            //   label: (
            //     <Box
            //       className="m-1"
            //       sx={{
            //         fontFamily: "Monospace",
            //         fontSize: "h6.fontSize",
            //         fontWeight: "bold",
            //       }}
            //     >
            //       Borrow
            //     </Box>
            //   ),
            //   onClick: () => {
            //     // Router.push({
            //     //   pathname: "/borrow",
            //     //   options: { locale: "borrow" },
            //     // });
            //   },
            //   icon: (
            //     <div className="flex items-center justify-center mr-1 mt-1">
            //       <AccountBalanceIcon fontSize="15px" />
            //     </div>
            //   ),
            // },
            {
              label: (
                <Box
                  className="m-1"
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
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
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Lock $LE
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
                <Badge
                  disableOutline
                  color="success"
                  content="LIVE"
                  size="xs"
                  shape="rectangle"
                  horizontalOffset="-10%"
                >
                  <Box
                    className="m-1"
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    leGenesis
                  </Box>
                </Badge>
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
        <div className="flex flex-col m-2 space-y-3 border-r-2 p-2 pr-4">
          <Link href="/trade">
            <Button
              primary
              size="medium"
              color={
                asPath.startsWith("/trade") ? SELECTED_COLOR : UNSELECTED_COLOR
              }
              label={
                <div className="flex sm:hidden md:flex">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 2,
                    }}
                  >
                    Trade
                  </Box>
                </div>
              }
              icon={
                <div className="pl-[10px]">
                  <Trending fontSize="25px" color="#000000" />
                </div>
              }
            />
          </Link>
          {/* <Link href="/borrow">
            <Badge
              className="z-0"
              disableOutline
              enableShadow
              color="neutral"
              content="soon™"
              size="md"
              shape="rectangle"
            >
              <Button
                primary
                disabled
                size="medium"
                color={UNSELECTED_COLOR}
                onClick={() => {
                  setOption("borrow");
                }}
                label={
                  <div className="flex sm:hidden md:flex">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        fontWeight: "bold",
                        letterSpacing: 2,
                      }}
                    >
                      Borrow
                    </Box>
                  </div>
                }
                icon={
                  <div className="flex items-center justify-center pl-[10px]">
                    <AccountBalanceIcon fontSize="20px" color="#000000" />
                  </div>
                }
              />
            </Badge>
          </Link> */}
        </div>
        <div className="flex flex-col m-2">
          <Link href="/tradingPools">
            <Button
              primary
              size="medium"
              color={
                asPath.startsWith("/tradingPools")
                  ? SELECTED_COLOR
                  : UNSELECTED_COLOR
              }
              label={
                <div className="hidden lg:flex">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 2,
                    }}
                  >
                    Pools
                  </Box>
                </div>
              }
              icon={
                <div className="pl-[10px]">
                  <Plus fontSize="20px" color="#000000" />
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
              color={
                asPath.startsWith("/lock") ? SELECTED_COLOR : UNSELECTED_COLOR
              }
              label={
                <div className="hidden lg:flex">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 2,
                    }}
                  >
                    Lock $LE
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
                asPath.startsWith("/genesis")
                  ? SELECTED_COLOR
                  : UNSELECTED_COLOR
              }
              label={
                <div className="hidden lg:flex z-0">
                  <Badge
                    disableOutline
                    color="success"
                    content="LIVE"
                    size="md"
                    shape="rectangle"
                    horizontalOffset="-25%"
                    verticalOffset="-25%"
                  >
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                        fontWeight: "bold",
                        letterSpacing: 2,
                      }}
                    >
                      leGenesis
                    </Box>
                  </Badge>
                </div>
              }
              icon={
                <div className="pl-[10px]">
                  <div className="flex lg:hidden">
                    <Badge
                      disableOutline
                      color="success"
                      content="LIVE"
                      size="sm"
                      shape="rectangle"
                      horizontalOffset="-150%"
                      verticalOffset="-30%"
                    >
                      <Rocket fontSize="20px" color="#000000" />
                    </Badge>
                  </div>
                  <Rocket
                    className="hidden lg:flex"
                    fontSize="20px"
                    color="#000000"
                  />
                </div>
              }
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
