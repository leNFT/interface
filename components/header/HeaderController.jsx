import BorrowHeader from "./BorrowHeader";
import TradeHeader from "./TradeHeader";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useNetwork } from "wagmi";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useSwitchNetwork } from "wagmi";
import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import Router from "next/router";
import Link from "next/link";
import { Button } from "grommet";
import { useEffect, useState } from "react";
//import BedtimeIcon from "@mui/icons-material/Bedtime";
import { useRouter } from "next/router";
import { useBalance } from "wagmi";
import Box from "@mui/material/Box";

export default function HeaderController() {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const { address } = useAccount();
  const { router, asPath } = useRouter();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [darkMode, setDarkMode] = useState(false);

  console.log("router.locale", router);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  useEffect(() => {
    console.log("balance", ethBalance);
  }, [ethBalance, address]);

  return (
    <div className="border-b-2 flex flex-row justify-between items-center">
      <div className="flex flex-row-reverse md:flex-row items-center">
        <div className="flex flex-row-reverse md:flex-row 2xl:flex-col items-center">
          {asPath.startsWith("/borrow") ? <BorrowHeader /> : <TradeHeader />}
        </div>
      </div>
      <div className="flex flex-row space-x-4 items-center justify-cente px-8">
        {isConnected ? (
          <div className="flex flex-row items-center justify-center">
            <Box
              className="border-r-2 border-gray-400 pr-4"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
            >
              {(ethBalance ? Number(ethBalance.formatted).toFixed(3) : "-") +
                " ETH"}
            </Box>
            <Link href="/wallet">
              <Button
                size="large"
                icon={
                  <AccountBalanceWalletIcon
                    className="hover:bg-black/10 rounded p-0.5"
                    fontSize="large"
                    color="inherit"
                  />
                }
              />
            </Link>
          </div>
        ) : (
          <Button
            primary
            size="medium"
            color={UNSELECTED_COLOR}
            onClick={openConnectModal}
            label={
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                Connect Wallet
              </Box>
            }
          />
        )}
      </div>
    </div>
  );
}
