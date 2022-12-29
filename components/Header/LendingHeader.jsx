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

export default function LendingHeader() {
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
                    fontSize: "subtitle1.fontSize",
                    letterSpacing: 2,
                  }}
                >
                  Lending
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/lend",
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
                  Pools
                </Box>
              ),
              onClick: () => {
                Router.push({
                  pathname: "/lendingPools",
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
                  LOck
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
          <Link href="/lend">
            <Button
              primary
              size="medium"
              color={option == "lend" ? SELECTED_COLOR : UNSELECTED_COLOR}
              onClick={() => {
                setOption("lend");
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
                    Lending
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
          <Link href="/lendingPools">
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
                    L0ck
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
