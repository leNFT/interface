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
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { Trending } from "@web3uikit/icons";
import { useState } from "react";
import Router from "next/router";

export default function BorrowHeader() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const [option, setOption] = useState("lend");

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
                  Borrow
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/borrow",
                  options: { locale: "borrow" },
                });
              },
              icon: (
                <div className="flex items-center justify-center mr-1 mt-1">
                  <AccountBalanceIcon fontSize="20px" />
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
                  Lending Pools
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/lendingPools",
                  options: { locale: "lend" },
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
                  Loan Library
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/loans",
                  options: { locale: "lend" },
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
                  options: { locale: "lend" },
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
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
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
        <div className="flex flex-col m-2 space-y-1 border-r-2 p-2 pr-4">
          <Link href="/trade">
            <Button
              primary
              size="medium"
              color={UNSELECTED_COLOR}
              onClick={() => {
                setOption("trade");
              }}
              label={
                <div className="flex sm:hidden md:flex">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
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
                  <Trending fontSize="20px" color="#000000" />
                </div>
              }
            />
          </Link>
          <Link href="/borrow">
            <Button
              primary
              size="medium"
              color={option == "borrow" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("borrow");
              }}
              label={
                <div className="flex sm:hidden md:flex">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 1,
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
          </Link>
        </div>
        <div className="flex flex-col m-2">
          <Link href="/lendingPools">
            <Button
              primary
              size="medium"
              color={option == "pools" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("pools");
              }}
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
          <Link href="/loans">
            <Button
              primary
              size="medium"
              color={option == "loans" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("loans");
              }}
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
                    Loan Library
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
          <Link href="/lock">
            <Button
              primary
              size="medium"
              color={option == "lock" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("lock");
              }}
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
              color={option == "genesis" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("genesis");
              }}
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
