import BorrowHeader from "./BorrowHeader";
import TradeHeader from "./TradeHeader";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BannerStrip } from "@web3uikit/core";
import { Reload, Roadmap } from "@web3uikit/icons";
import { useAccount, useNetwork } from "wagmi";
import { useSwitchNetwork } from "wagmi";
import Router from "next/router";
import { useRouter } from "next/router";
var mode;

export default function HeaderController() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  console.log("router.locale", router);
  if (router.pathname == "/borrow" || router.pathname == "/trade") {
    mode = router.pathname;
  }

  console.log("mode", mode);

  return (
    <div>
      {chain && isConnected && (
        <div className="mb-4">
          <BannerStrip
            buttonDisplayed
            buttonConfig={{
              onClick: function noRefCheck() {
                if (chain.id == 1) {
                  switchNetwork(11155111);
                } else if (chain.id == 11155111) {
                  Router.push({
                    pathname: "/test",
                  });
                }
              },
              iconLayout: "icon-only",
              icon:
                chain.id == 1 ? (
                  <Reload fontSize="30px" color="#000000" title="Reload Icon" />
                ) : (
                  <Roadmap fontSize="30px" color="white" title="Help Icon" />
                ),
            }}
            text={
              chain.id == 1
                ? "leNFT is live on the Sepolia testnet. Change networks to use the beta."
                : "Follow the flag to mint testnet assets"
            }
            type={chain.id == 1 ? "error" : "info"}
          />
        </div>
      )}
      <div className="p-4 pb-0 md:pb-2 mb-2 border-b-2 flex flex-row justify-between items-center">
        <div className="flex flex-row-reverse md:flex-row items-center">
          <div className="flex flex-row-reverse md:flex-row 2xl:flex-col items-center">
            {mode == "/borrow" ? <BorrowHeader /> : <TradeHeader />}
          </div>
        </div>
        <div className="flex flex-col items-center px-8">
          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: "none", largeScreen: "icon" }}
            accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
          />
        </div>
      </div>
    </div>
  );
}
