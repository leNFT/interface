import { useState, useEffect } from "react";
import { Button, Tooltip, Loading, Typography, LinkTo } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { getTradingPoolHistory } from "../../../helpers/getTradingPoolHistory.js";
import { getTradingPoolPrice } from "../../../helpers/getTradingPoolPrice.js";
import { BigNumber } from "@ethersproject/bignumber";
import { Table } from "@nextui-org/react";
import StyledModal from "../../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import { getAddressNFTs } from "../../../helpers/getAddressNFTs.js";
import { getTradingPools } from "../../../helpers/getTradingPools.js";
import contractAddresses from "../../../contractAddresses.json";
import tradingPoolContract from "../../../contracts/TradingPool.json";
import DepositTradingPool from "../../../components/trading/DepositTradingPool";
import WithdrawTradingPool from "../../../components/trading/WithdrawTradingPool";
import Box from "@mui/material/Box";
import { ethers } from "ethers";
import Card from "@mui/material/Card";
import { CardActionArea } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import { useAccount, useNetwork, useProvider, useBalance } from "wagmi";
import erc721 from "../../../contracts/erc721.json";
import erc20 from "../../../contracts/erc20.json";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";
import * as timeago from "timeago.js";

export default function TradingPool() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const [totalProvidedNFTs, setTotalProvidedNFTs] = useState(0);
  const [userNFTsAmount, setUserNFTsAmount] = useState(0);
  const [totalTokenAmount, setTotalTokenAmount] = useState("0");
  const [lpPositions, setLpPositions] = useState([]);
  const [selectedLP, setSelectedLP] = useState();
  const [poolHistory, setPoolHistory] = useState([]);
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [loadingTradingPool, setLoadingTradingPool] = useState(true);
  const [price, setPrice] = useState();
  const [poolInfo, setPoolInfo] = useState();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });
  const provider = useProvider();
  var addresses = contractAddresses[1];
  async function updateUI() {
    const pool = new ethers.Contract(
      router.query.address,
      tradingPoolContract.abi,
      provider
    );

    // Set pool details
    const poolInfo = await getTradingPools(chain.id, router.query.address);
    console.log("poolInfo", poolInfo);
    setPoolInfo(poolInfo);

    // Get number of user NFTs
    setUserNFTsAmount(
      (await getAddressNFTs(address, poolInfo.nft.address, chain.id)).length
    );

    // Get lp positions
    if (address) {
      console.log("Get LP positions", address);
      const addressNFTs = await getAddressNFTs(
        address,
        router.query.address,
        chain.id
      );
      console.log("addressNFTs", addressNFTs);
      const newLpPositions = [];
      var newTotalNFTs = 0;
      var newTotalTokenAmount = "0";
      for (let i = 0; i < addressNFTs.length; i++) {
        newLpPositions.push({
          id: BigNumber.from(addressNFTs[i].tokenId).toNumber(),
        });

        const lp = await pool.getLP(addressNFTs[i].tokenId);
        console.log("lp", lp);
        newTotalNFTs += lp.nftIds.length;
        newTotalTokenAmount = BigNumber.from(lp.tokenAmount)
          .add(newTotalTokenAmount)
          .toString();
      }
      setTotalProvidedNFTs(newTotalNFTs);
      setTotalTokenAmount(newTotalTokenAmount);

      setLpPositions(newLpPositions);
      console.log("lpPositions", lpPositions);
    }

    // Get pool history
    const updatePoolHistory = await getTradingPoolHistory(
      chain.id,
      router.query.address
    );
    console.log("updatePoolHistory", updatePoolHistory);
    setPoolHistory(updatePoolHistory);

    // Get the best price the pool LPs can offer
    try {
      const priceResponse = await getTradingPoolPrice(
        chain.id,
        router.query.address
      );
      console.log("priceResponse", priceResponse);
      setPrice(priceResponse);
    } catch (e) {
      console.log("Error getting price", e);
      setPrice({
        price: "0",
        buyPrice: "0",
        sellPrice: "0",
      });
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
    <div className="flex flex-col justify-center items-center">
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
          token={poolInfo?.token.address}
          gauge={poolInfo?.gauge}
          nft={poolInfo?.nft.address}
          nftName={poolInfo?.nft.name}
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
      <div className="flex flex-row w-full justify-between">
        <div className="flex flex-col justify-center mr-8">
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
        <div className="flex flex-row justify-center break-all items-center text-center mx-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "body2.fontSize",
            }}
          >
            {router.query.address &&
              router.query.address.slice(0, 10) +
                "..." +
                router.query.address.slice(-6)}
          </Box>
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
              } else {
                window.open(
                  "https://sepolia.etherscan.io/address/" +
                    router.query.address,
                  "_blank"
                );
              }
            }}
          />
        </div>
        <div className="flex flex-col justify-center">
          {poolInfo?.gauge &&
            poolInfo?.gauge != ethers.constants.AddressZero && (
              <Button
                color="blue"
                theme="colored"
                text="Go to Gauge"
                onClick={async function () {
                  Router.push({
                    pathname: "/trading/gauge/" + poolInfo?.gauge,
                  });
                }}
              />
            )}
        </div>
      </div>
      <div className="flex flex-col xl:flex-row w-fit xl:w-10/12 justify-between items-center p-8 rounded-3xl my-8 md:m-8 lg:mx-16 bg-black/5 shadow-lg">
        <div className="flex flex-col justify-center items-center xl:items-start">
          <div className="flex flex-row justify-center items-center">
            <Box
              className="m-2"
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "h6.fontSize",
                  sm: "h5.fontSize",
                },
                fontWeight: "bold",
              }}
            >
              {poolInfo?.nft.amount}
            </Box>
            <LinkTo
              type="external"
              iconLayout="none"
              text={
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: {
                      xs: "h6.fontSize",
                      sm: "h5.fontSize",
                    },
                  }}
                  className="m-2"
                >
                  {poolInfo?.nft.name}
                </Box>
              }
              address={
                isConnected
                  ? chain.id == 1
                    ? "https://etherscan.io/address/" + poolInfo?.nft.address
                    : "https://sepolia.etherscan.io/address/" +
                      poolInfo?.nft.address
                  : "https://sepolia.etherscan.io/address/" +
                    poolInfo?.nft.address
              }
            ></LinkTo>
          </div>
          <Box
            className="m-2"
            sx={{
              fontFamily: "Monospace",
              fontSize: {
                xs: "h6.fontSize",
                sm: "h5.fontSize",
              },
              fontWeight: "bold",
            }}
          >
            {poolInfo &&
              Number(formatUnits(poolInfo.token.amount)).toPrecision(2) +
                " " +
                poolInfo?.token.name}
          </Box>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 space-y-2 sm:space-y-0 mt-4 mx-2 p-6 border-2 rounded-3xl border-black">
          <div className="flex flex-col border-r-2 sm:pr-8 md:border-black justify-center items-center space-y-1 text-center">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "subtitle2.fontSize",
                  sm: "h6.fontSize",
                },
                fontWeight: "bold",
              }}
            >
              Buy Price
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "subtitle2.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
            >
              {(price
                ? Number(formatUnits(price.buyPrice, 18)).toFixed(6)
                : "0.00") + " ETH"}
            </Box>
          </div>
          <div className="flex flex-col border-r-2 sm:pr-8 space-y-1 md:border-black justify-center items-center text-center">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "subtitle2.fontSize",
                  sm: "h6.fontSize",
                },
                fontWeight: "bold",
              }}
            >
              Sell Price
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "subtitle2.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
            >
              {(price
                ? Number(formatUnits(price.sellPrice, 18)).toFixed(6)
                : "0.00") + " ETH"}
            </Box>
          </div>
          <div className="flex flex-col justify-center items-center space-y-1 text-center">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "subtitle2.fontSize",
                  sm: "h6.fontSize",
                },
                fontWeight: "bold",
              }}
            >
              Volume
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "subtitle2.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
            >
              {(poolInfo
                ? Number(formatUnits(poolInfo.volume, 18)).toFixed(3)
                : "0.00") + " ETH"}
            </Box>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center p-4 rounded-3xl my-8 md:m-8 lg:mx-16 !mt-8 bg-black/5 shadow-lg">
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
                  My Liquidity:
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
            <div className="flex flex-row m-2 items-center space-x-2">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h5.fontSize",
                  fontWeight: "bold",
                }}
              >
                {totalProvidedNFTs + " NFTs"}
              </Box>
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subitle1.fontSize",
                }}
              >
                {"(" + userNFTsAmount + " NFTs available)"}
              </Box>
            </div>
            <div className="flex flex-row m-2 items-center space-x-2">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h5.fontSize",
                  fontWeight: "bold",
                }}
              >
                {Number(formatUnits(totalTokenAmount, 18)).toPrecision(4) +
                  " ETH"}
              </Box>
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subitle1.fontSize",
                }}
              >
                {"(" +
                  (ethBalance &&
                    Number(formatUnits(ethBalance.value, 18)).toPrecision(2)) +
                  " ETH available)"}
              </Box>
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
                  <div className="flex flex-col items-center space-y-2">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                      }}
                    >
                      No LP Positions found.
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "caption.fontSize",
                      }}
                    >
                      {"(Staked positions available in the pool's "}
                      <a
                        href={"/trading/gauge/" + poolInfo.gauge}
                        className="text-blue-600 underline text-sm"
                      >
                        gauge
                      </a>
                      {")"}
                    </Box>
                  </div>
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
      <div className="flex flex-col items-center justify-center py-4 rounded-3xl my-8 md:m-8 lg:mx-16 !mt-8 bg-black/5 shadow-lg">
        <Table
          shadow={false}
          bordered={false}
          className="hidden md:table"
          aria-label="Trading Pool Activity"
          css={{
            height: "auto",
            width: "80vw",
            fontFamily: "Monospace",
            zIndex: 0,
          }}
        >
          <Table.Header>
            <Table.Column>Transaction</Table.Column>
            <Table.Column>Type</Table.Column>
            <Table.Column>Date</Table.Column>
            <Table.Column>Address</Table.Column>
            <Table.Column>NFTs</Table.Column>
            <Table.Column>Price</Table.Column>
          </Table.Header>
          <Table.Body>
            {poolHistory.map((data, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <LinkTo
                    type="external"
                    iconLayout="none"
                    text={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: {
                            xs: "caption.fontSize",
                            sm: "subtitle2.fontSize",
                          },
                        }}
                      >
                        {data.transaction.slice(0, 4) +
                          ".." +
                          data.transaction.slice(-3)}
                      </Box>
                    }
                    address={
                      isConnected
                        ? chain.id == 1
                          ? "https://etherscan.io/tx/" + data.transaction
                          : "https://sepolia.etherscan.io/tx/" +
                            data.transaction
                        : "https://sepolia.etherscan.io/tx/" + data.transaction
                    }
                  ></LinkTo>
                </Table.Cell>
                <Table.Cell>
                  {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                </Table.Cell>
                <Table.Cell>{timeago.format(data.timestamp * 1000)}</Table.Cell>
                <Table.Cell>
                  <LinkTo
                    type="external"
                    iconLayout="none"
                    text={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: {
                            xs: "caption.fontSize",
                            sm: "subtitle2.fontSize",
                          },
                        }}
                      >
                        {data.address.slice(0, 6) +
                          ".." +
                          data.address.slice(-4)}
                      </Box>
                    }
                    address={
                      isConnected
                        ? chain.id == 1
                          ? "https://etherscan.io/address/" + data.address
                          : "https://sepolia.etherscan.io/address/" +
                            data.address
                        : "https://sepolia.etherscan.io/address/" + data.address
                    }
                  ></LinkTo>
                </Table.Cell>
                <Table.Cell>{data.nftIds.join(",")}</Table.Cell>
                <Table.Cell>
                  {Number(formatUnits(data.price, 18)).toPrecision(6) + " ETH"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <Table.Pagination
            noMargin
            color={"secondary"}
            align="center"
            rowsPerPage={7}
            onPageChange={(page) => console.log({ page })}
          />
        </Table>
        <Table
          shadow={false}
          bordered={false}
          className="md:hidden"
          aria-label="Trading Pool Activity"
          css={{
            height: "auto",
            width: "75vw",
            fontFamily: "Monospace",
            zIndex: 0,
          }}
        >
          <Table.Header>
            <Table.Column>Tx</Table.Column>
            <Table.Column>Type</Table.Column>
            <Table.Column>Date</Table.Column>
            <Table.Column>Price</Table.Column>
          </Table.Header>
          <Table.Body>
            {poolHistory.map((data, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <LinkTo
                    type="external"
                    iconLayout="none"
                    text={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: {
                            xs: "caption.fontSize",
                            sm: "subtitle2.fontSize",
                          },
                        }}
                      >
                        {data.transaction.slice(0, 3) +
                          "." +
                          data.transaction.slice(-2)}
                      </Box>
                    }
                    address={
                      isConnected
                        ? chain.id == 1
                          ? "https://etherscan.io/tx/" + data.transaction
                          : "https://sepolia.etherscan.io/tx/" +
                            data.transaction
                        : "https://sepolia.etherscan.io/tx/" + data.transaction
                    }
                  ></LinkTo>
                </Table.Cell>
                <Table.Cell>
                  {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                </Table.Cell>
                <Table.Cell>{timeago.format(data.timestamp * 1000)}</Table.Cell>
                <Table.Cell>
                  {Number(formatUnits(data.price, 18)).toPrecision(3) + " ETH"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <Table.Pagination
            noMargin
            color={"secondary"}
            align="center"
            rowsPerPage={7}
            onPageChange={(page) => console.log({ page })}
          />
        </Table>
      </div>
    </div>
  );
}
