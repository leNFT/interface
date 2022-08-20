import { useMoralis, useChain } from "react-moralis";
import Link from "next/link";
import { ConnectButton } from "@web3uikit/web3";
import { Tooltip, BannerStrip } from "@web3uikit/core";
import { Button } from "grommet";
import { Home, Search, Reload, Plus, LockClosed } from "@web3uikit/icons";
import Box from "@mui/material/Box";

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
        <div className="hidden lg:flex flex-col items-center justify-content lg:pr-20">
          <Link href="/">
            <a target="_blank" rel="noopener noreferrer">
              <div className="mx-5 mt-2 flex flex-row items-center">
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
                  <div className="text-red-700">[ ALPHA ]</div>
                </Box>
              </div>
            </a>
          </Link>
        </div>
        <div className="flex flex-col items-center self-center my-2">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex flex-col m-2">
              <Link href="/app">
                <Button
                  primary
                  size="medium"
                  color="#eae5ea"
                  label={
                    <div className="flex md:hidden lg:flex">
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
              <Link href="/loanSearch">
                <Button
                  primary
                  size="medium"
                  color="#eae5ea"
                  label={
                    <div className="flex md:hidden lg:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Loan Search
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
              <Link href="/supply">
                <Button
                  primary
                  size="medium"
                  color="#eae5ea"
                  label={
                    <div className="flex md:hidden lg:flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Supply
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
              <div className="flex justify-center">
                <Link href="">
                  <Tooltip content={"soon :)"} position="bottom" minWidth={70}>
                    <Button
                      primary
                      size="medium"
                      color="#eae5ea"
                      label={
                        <div className="flex md:hidden lg:flex">
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
                      disabled={true}
                      icon={
                        <div className="pl-[10px]">
                          <LockClosed fontSize="20px" color="#000000" />
                        </div>
                      }
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
