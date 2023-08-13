import BorrowHeader from "./BorrowHeader";
import TradeHeader from "./TradeHeader";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useNetwork } from "wagmi";
import { useSwitchNetwork } from "wagmi";
import Router from "next/router";
import { useState } from "react";
//import BedtimeIcon from "@mui/icons-material/Bedtime";
import { useRouter } from "next/router";
var mode;

export default function HeaderController() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [darkMode, setDarkMode] = useState(false);

  const { switchNetwork } = useSwitchNetwork();
  console.log("router.locale", router);
  if (router.pathname == "/borrow" || router.pathname == "/trade") {
    mode = router.pathname;
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  return (
    <div className="border-b-2 flex flex-row justify-between items-center">
      <div className="flex flex-row-reverse md:flex-row items-center">
        <div className="flex flex-row-reverse md:flex-row 2xl:flex-col items-center">
          {mode == "/borrow" ? <BorrowHeader /> : <TradeHeader />}
        </div>
      </div>
      <div className="flex flex-row space-x-4 items-center px-8">
        {/* <Button
            size="small"
            onClick={() => {
              toggleDarkMode();
            }}
            icon={<BedtimeIcon />}
          /> */}
        <ConnectButton
          showBalance={false}
          chainStatus={{ smallScreen: "none", largeScreen: "icon" }}
          accountStatus={{ smallScreen: "none", largeScreen: "none" }}
        />
      </div>
    </div>
  );
}
