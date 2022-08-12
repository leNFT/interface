import { useMoralis, useChain } from "react-moralis";
import Link from "next/link";
import { ConnectButton } from "@web3uikit/web3";
import { Tooltip, BannerStrip } from "@web3uikit/core";
import { Button } from "grommet";
import { Home, Search, Reload, Plus, LockClosed } from "@web3uikit/icons";

export default function Header() {
  const { isWeb3Enabled, chainId } = useMoralis();
  const { switchNetwork } = useChain();

  return (
    <div>
      {chainId != "0x1" && isWeb3Enabled && (
        <div className="mb-6">
          <BannerStrip
            buttonDisplayed
            buttonConfig={{
              onClick: function noRefCheck() {
                switchNetwork("0x1");
              },
              iconLayout: "icon-only",
              icon: (
                <Reload fontSize="26px" color="#000000" title="Reload Icon" />
              ),
            }}
            text="Please switch chain to Ethereum mainnet."
            type="warning"
          />
        </div>
      )}
      <div className="p-4 mb-2 border-b-2 flex flex-col md:flex-row justify-between items-center">
        <div className="flex flex-col items-center justify-content lg:pr-20">
          <Link href="/">
            <a target="_blank" rel="noopener noreferrer">
              <div className="mx-5 mt-2 flex flex-row items-center">
                <div className="flex flex-col items-center">
                  <h1 className="font-bold text-2xl">leNFT</h1>
                </div>
                <div className="flex flex-col ml-1 mb-4 items-center justify-content">
                  <h1 className="text-2xl">.finance</h1>
                </div>
              </div>
              <div className="flex flex-row justify-center">
                <h1 className="font-bold text-xs text-red-700">
                  [ ALPHA VERSION ]
                </h1>
              </div>
            </a>
          </Link>
        </div>
        <div className="flex flex-col items-center self-center my-2">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex flex-col m-2">
              <Link href="/app">
                <Button
                  size="medium"
                  color="neutral-3"
                  label="Home"
                  icon={<Home fontSize="24px" color="#000000" />}
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <Link href="/loanExplorer">
                <Button
                  size="medium"
                  color="neutral-3"
                  label="Loan Explorer"
                  icon={<Search fontSize="24px" color="#000000" />}
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <Link href="/supply">
                <Button
                  size="medium"
                  color="neutral-3"
                  label="Supply"
                  icon={<Plus fontSize="18px" color="#000000" />}
                />
              </Link>
            </div>
            <div className="flex flex-col m-2">
              <div className="flex justify-center">
                <Link href="">
                  <Tooltip content={"soon :)"} position="bottom" minWidth={70}>
                    <Button
                      size="medium"
                      color="neutral-3"
                      label="Stake LE"
                      disabled={true}
                      icon={<LockClosed fontSize="24px" color="#000000" />}
                    />
                  </Tooltip>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <ConnectButton moralisAuth={false} />
        </div>
      </div>
    </div>
  );
}
