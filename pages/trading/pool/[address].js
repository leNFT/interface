import { useState, useEffect } from "react";
import { Button, Tooltip, Loading, Typography, LinkTo } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import { getAddressNFTs } from "../../../helpers/getAddressNFTs.js";
import contractAddresses from "../../../contractAddresses.json";
import tradingPoolContract from "../../../contracts/TradingPool.json";
import DepositTradingPool from "../../../components/trading/DepositTradingPool";
import WithdrawTradingPool from "../../../components/trading/WithdrawTradingPool";
import Box from "@mui/material/Box";
import { ethers } from "ethers";
import Card from "@mui/material/Card";
import { CardActionArea } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import { useAccount, useNetwork, useProvider } from "wagmi";
import erc721 from "../../../contracts/erc721.json";
import erc20 from "../../../contracts/erc20.json";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";

export default function TradingPool() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const [nft, setNFT] = useState("");
  const [token, setToken] = useState("");
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [totalTokenAmount, setTotalTokenAmount] = useState("0");
  const [lpPositions, setLpPositions] = useState([]);
  const [selectedLP, setSelectedLP] = useState();
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [loadingTradingPool, setLoadingTradingPool] = useState(true);
  const [nftName, setNFTName] = useState("...");
  const [tokenName, setTokenName] = useState("...");
  const provider = useProvider();
  const addresses =
    isConnected && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["5"];

  async function updateUI() {
    const pool = new ethers.Contract(
      router.query.address,
      tradingPoolContract.abi,
      provider
    );

    // Set pool details
    const nftResponse = await pool.getNFT();
    setNFT(nftResponse.toString());

    const nftContract = new ethers.Contract(
      nftResponse.toString(),
      erc721,
      provider
    );
    const nftNameResponse = await nftContract.name();
    setNFTName(nftNameResponse);

    const tokenResponse = await pool.getToken();
    setToken(tokenResponse.toString());

    const tokenContract = new ethers.Contract(
      tokenResponse.toString(),
      erc20,
      provider
    );
    const tokenNameResponse = await tokenContract.name();
    setTokenName(tokenNameResponse);

    // Get lp positions
    if (address) {
      const addressNFTs = await getAddressNFTs(
        address,
        router.query.address,
        chain.id
      );
      const newLpPositions = [];
      var newTotalNFTs = 0;
      var newTotalTokenAmount = "0";
      for (let i = 0; i < addressNFTs.length; i++) {
        newLpPositions.push({
          id: BigNumber.from(addressNFTs[i].id.tokenId).toNumber(),
        });

        const lp = await pool.getLP(addressNFTs[i].id.tokenId);
        console.log("lp", lp);
        newTotalNFTs += lp.nftIds.length;
        newTotalTokenAmount = BigNumber.from(lp.tokenAmount)
          .add(newTotalTokenAmount)
          .toString();
      }
      setTotalNFTs(newTotalNFTs);
      setTotalTokenAmount(newTotalTokenAmount);

      setLpPositions(newLpPositions);
    }

    setLoadingTradingPool(false);
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    console.log("router", router.query.address);
    if (router.query.address) {
      updateUI();
    }
  }, [isConnected, router.query.address, address]);

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Deposit LP"}
        isVisible={visibleDepositModal}
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <DepositTradingPool
          setVisibility={setVisibleDepositModal}
          pool={router.query.address}
          token={token}
          nft={nft}
          nftName={nftName}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Remove LP"}
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <WithdrawTradingPool
          setVisibility={setVisibleWithdrawalModal}
          pool={router.query.address}
          lp={selectedLP}
          updateUI={updateUI}
        />
      </StyledModal>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-center mr-auto ml-4">
          <Button
            size="small"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ChevronLeft fontSize="50px" />}
            onClick={async function () {
              Router.push({
                pathname: "/tradingPools",
              });
            }}
          />
        </div>
        <div className="flex flex-col justify-center break-all ml-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "body2.fontSize",
            }}
          >
            {router.query.address}
          </Box>
        </div>
        <div className="flex flex-col justify-center pb-1 mr-auto">
          <Button
            size="large"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ExternalLink fontSize="20px" />}
            onClick={async function (_event) {
              if (chain.id == 1) {
                window.open(
                  "https://etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              } else if (chain.id == 5) {
                window.open(
                  "https://goerli.etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-row justify-center items-center p-8 rounded-3xl m-8 lg:mx-16 bg-black/5 shadow-lg">
        <LinkTo
          type="external"
          iconLayout="none"
          text={
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "h5.fontSize",
                },
              }}
              className="m-2"
            >
              {nftName}
            </Box>
          }
          address={
            isConnected
              ? chain.id == 1
                ? "https://etherscan.io/address/" + nft
                : "https://goerli.etherscan.io/address/" + nft
              : "https://goerli.etherscan.io/address/" + nft
          }
        ></LinkTo>
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: {
              xs: "caption.fontSize",
              sm: "h5.fontSize",
            },
            fontWeight: "bold",
          }}
        >
          {" / "}
        </Box>
        <Box
          className="m-2"
          sx={{
            fontFamily: "Monospace",
            fontSize: {
              xs: "caption.fontSize",
              sm: "h5.fontSize",
            },
            fontWeight: "bold",
          }}
        >
          {tokenName}
        </Box>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center p-4 rounded-3xl m-8 lg:m-16 !mt-8 bg-black/5 shadow-lg">
        <div className="flex flex-col items-center p-4 rounded-3xl m-8 lg:m-16 bg-black/5 shadow-lg">
          <div className="flex flex-col m-4 rounded-2xl">
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Total Liquidity Provided:
                </Box>
              </div>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content="The sum of all your LPs in this pool"
                  position="top"
                  minWidth={200}
                >
                  <HelpCircle fontSize="20px" color="#000000" />
                </Tooltip>
              </div>
            </div>
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h5.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  {totalNFTs + " NFTs"}
                </Box>
              </div>
            </div>
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h5.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  {formatUnits(totalTokenAmount, 18) + " ETH"}
                </Box>
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center ">
            <div className="m-4">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text="Create LP"
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  setVisibleDepositModal(true);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle2.fontSize",
            }}
          >
            my LP Positions
          </Box>
          <div className="flex flex-col border-4 border-slate-400 rounded-2xl mt-0 p-8 m-8 lg:p-16 w-11/12">
            {loadingTradingPool ? (
              <div className="flex m-4">
                <Loading size={12} spinnerColor="#000000" />
              </div>
            ) : (
              <div>
                {lpPositions.length == 0 ? (
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle1.fontSize",
                    }}
                  >
                    <div>{"No LP Positions found"}</div>
                  </Box>
                ) : (
                  <div className="flex grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lpPositions.map((data) => (
                      <div
                        key={data.id}
                        className="flex items-center justify-center max-w-[300px]"
                      >
                        <Card
                          sx={{
                            borderRadius: 4,
                            background:
                              "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                          }}
                        >
                          <CardActionArea
                            onClick={function () {
                              setSelectedLP(data.id);
                              setVisibleWithdrawalModal(true);
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  fontFamily: "Monospace",
                                  fontSize: "subtitle1.fontSize",
                                }}
                              >
                                <div className="flex flex-col items-center justify-center m-2 text-center">
                                  {"LP " + BigNumber.from(data.id).toNumber()}
                                </div>
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
