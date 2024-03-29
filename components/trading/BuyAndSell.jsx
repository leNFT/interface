import { Button } from "grommet";
import Autocomplete from "@mui/material/Autocomplete";
import { Button as ButtonNextUI } from "@nextui-org/react";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import Box from "@mui/material/Box";
import { getNFTImage } from "../../helpers/getNFTImage.js";
import TextField from "@mui/material/TextField";
import erc721 from "../../contracts/erc721.json";
import Link from "next/link";
import LimitBuy from "./LimitBuy";
import MarketBuy from "./MarketBuy";
import { getTradingNFTCollections } from "../../helpers/getTradingNFTCollections.js";
import LimitSell from "./LimitSell";
import MarketSell from "./MarketSell";
import Divider from "@mui/material/Divider";
import { Loading, LinkTo } from "@web3uikit/core";
import { Table } from "@nextui-org/react";
import { getTradingPoolOrderbook } from "../../helpers/getTradingPoolOrderbook";
import { getTradingPools } from "../../helpers/getTradingPools";
import { getOpenOrders } from "../../helpers/getOpenOrders";
import { getTradingPoolPrice } from "../../helpers/getTradingPoolPrice.js";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
import tradingPoolContract from "../../contracts/TradingPool.json";
import { getTradingPoolHistory } from "../../helpers/getTradingPoolHistory";
import {
  useAccount,
  useProvider,
  useNetwork,
  useContract,
  useSigner,
} from "wagmi";
import { formatUnits } from "@ethersproject/units";
import * as timeago from "timeago.js";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import { BigNumber } from "ethers";
import { useRouter } from "next/router";

export default function BuyAndSell(props) {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const { query, asPath } = useRouter();
  const { isConnected, address } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const [option, setOption] = useState("market");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [proMode, setProMode] = useState(false);
  const [pool, setPool] = useState("");
  const [orderbook, setOrderbook] = useState();
  const [loadingOrderbook, setLoadingOrderbook] = useState(false);
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false);
  const [loadingTradingHistory, setLoadingTradingHistory] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [poolHistory, setPoolHistory] = useState([]);
  const [lowLiquidity, setLowLiquidity] = useState(false);
  const [nftName, setNFTName] = useState("");
  const [tradingCollections, setTradingCollections] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [approvedLP, setApprovedLP] = useState(false);
  const [price, setPrice] = useState();
  const [myHistory, setMyHistory] = useState(true);
  const [myOrders, setMyOrders] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  var addresses = contractAddresses[chain ? chain.id : 1];

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const factoryProvider = useContract({
    contractInterface: tradingPoolFactoryContract.abi,
    addressOrName: addresses.TradingPoolFactory,
    signerOrProvider: provider,
  });

  async function getTradingCollections(chain) {
    // Get user NFT assets
    const updatedTradingCollections = await getTradingNFTCollections(chain);
    setTradingCollections(updatedTradingCollections);
    console.log("tradingCollections", updatedTradingCollections);
  }

  async function getBackgroundImage(collection) {
    const updatedURL = await getNFTImage(collection, 1, chain ? chain.id : 1);
    console.log("updatedURL", updatedURL);
    setBackgroundImage(updatedURL);
  }

  async function getTradingPoolAddress(collection) {
    console.log("Getting trading pool address for", collection);
    // Get trading pool for collection
    const updatedPool = (
      await factoryProvider.getTradingPool(collection, addresses.ETH.address)
    ).toString();

    console.log("updatedpool", updatedPool);
    const pool = await getTradingPools(chain ? chain.id : 1, updatedPool);
    console.log("pool", pool);
    setNFTName(pool.nft.name);
    setPool(updatedPool);
    if (pool.nft.amount < 2 || BigNumber.from(pool.token.amount).eq(0)) {
      setLowLiquidity(true);
    } else {
      setLowLiquidity(false);
    }

    const updatedPrice = await getTradingPoolPrice(
      chain ? chain.id : 1,
      updatedPool
    );
    setPrice(updatedPrice);
    console.log("updatedPrice", updatedPrice);
  }

  const handleWithdrawSuccess = async function () {
    dispatch({
      type: "success",
      message: "Your order was successfully withdrawn.",
      title: "Withdraw Successful!",
      position: "bottomL",
    });
  };

  const handleLPApprovalSuccess = async function () {
    dispatch({
      type: "success",
      message: "Your LP was successfully approved.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  const handleNFTAddressChange = (_event, value) => {
    console.log("handleNFTAddressChange", value);
    if (ethers.utils.isAddress(value)) {
      props.setNFTAddress(value);
      getBackgroundImage(value);
      getTradingPoolAddress(value);
    } else if (
      tradingCollections.map((collection) => collection.name).includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.name == value
      ).address;
      props.setNFTAddress(nftAddress);
      getBackgroundImage(nftAddress);
      getTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        props.setNFTAddress("");
      } else {
        props.setNFTAddress("0x");
      }
      setPool("");
      setPrice();
      setBackgroundImage("");
      setNFTName("");
    }
  };

  // Runs once
  useEffect(() => {
    if (chain) {
      console.log("chain", chain);

      const chainId = chain ? chain.id : 1;
      console.log("chainId", chainId);

      getTradingCollections(chainId);

      // Parsing address from URL using new URL() and asPath
      const url = new URL(asPath, window.location.origin);
      const addressFromUrl = url.searchParams.get("address");

      console.log("addressFromUrl", addressFromUrl);

      if (addressFromUrl) {
        // Here you can call your handle function with the address
        handleNFTAddressChange(null, addressFromUrl);
        console.log("addressFromUrl", addressFromUrl);
      }
    }

    console.log("useEffect called");
  }, [isConnected, chain, asPath]);

  useEffect(() => {
    if (props.nftAddress) {
      handleNFTAddressChange(null, props.nftAddress);
    }
  }, [isConnected]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        console.log("Small screen detected");
        setIsSmallScreen(true);
      } else {
        setIsSmallScreen(false); // Reset to false if the screen is larger
      }
    };

    // Initial check (in case you want to check right away when the component mounts)
    handleResize();

    // Set up the event listener
    window.addEventListener("resize", handleResize);

    // Clean up the event listener when the component unmounts
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array ensures this useEffect runs only on mount and unmount

  useEffect(() => {
    if (pool && proMode) {
      const updatePoolHistory = async () => {
        setLoadingTradingHistory(true);
        const newPoolHistory = await getTradingPoolHistory(
          chain ? chain.id : 1,
          pool,
          myHistory ? address : null
        );
        console.log("poolHistory:", newPoolHistory);
        setPoolHistory(newPoolHistory);
        setLoadingTradingHistory(false);
      };
      updatePoolHistory();
    }
  }, [myHistory]);

  useEffect(() => {
    if (pool && proMode) {
      const fetchProModeInfo = async () => {
        setLoadingOrderbook(true);
        setLoadingTradingHistory(true);
        setLoadingOpenOrders(true);
        const newOrderbook = await getTradingPoolOrderbook(
          chain ? chain.id : 1,
          pool
        );
        console.log("orderbook:", newOrderbook);
        setOrderbook(newOrderbook);
        setLoadingOrderbook(false);
        const newPoolHistory = await getTradingPoolHistory(
          chain ? chain.id : 1,
          pool,
          myHistory ? address : null
        );
        console.log("poolHistory:", newPoolHistory);
        setPoolHistory(newPoolHistory);
        setLoadingTradingHistory(false);
        const updatedOpenOrders = await getOpenOrders(
          chain ? chain.id : 1,
          pool,
          address
        );
        console.log("updatedOpenOrders", updatedOpenOrders);
        setOpenOrders(updatedOpenOrders);

        // Get approved status
        const poolContract = new ethers.Contract(
          pool,
          tradingPoolContract.abi,
          provider
        );

        // GEt allowance for LP token
        const approvedResponse = await poolContract.isApprovedForAll(
          address,
          addresses.WETHGateway
        );
        console.log("approvedResponse", approvedResponse);
        setApprovedLP(approvedResponse);
        setLoadingOpenOrders(false);
      };
      fetchProModeInfo();
      console.log("pool:", pool);
    }
    console.log("pool:", pool);
  }, [pool, chain, proMode]);

  const OrderbookComponent = () => {
    if (!pool) {
      return (
        <div className="flex flex-col m-8 items-center justify-center">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle2.fontSize",
            }}
          >
            {isConnected
              ? "Select a collection to view the orderbook"
              : "Connect Wallet to view the orderbook"}
          </Box>
        </div>
      );
    }

    if (loadingOrderbook) {
      return (
        <div className="m-32">
          <Loading size={18} spinnerColor="#000000" />
        </div>
      );
    }

    if (orderbook && (orderbook.sell.length || orderbook.buy.length)) {
      return (
        <table>
          <thead>
            <tr>
              <th className="px-8 py-2 text-sm">Price (ETH)</th>
              <th className="px-8 py-2 text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {orderbook.sell
              .slice()
              .reverse()
              .map((sellOrder, i) => (
                <tr key={i} align="center">
                  <td className="text-red-600">
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "subtitle2.fontSize",
                      }}
                    >
                      {Number(formatUnits(sellOrder.price, 18)).toPrecision(4)}
                    </Box>
                  </td>
                  <td>{sellOrder.amount}</td>
                </tr>
              ))}
            <tr>
              <td colSpan="2">
                <Box
                  className="text-red-600 text-center"
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Ask
                </Box>
                <Divider className="my-1" variant="middle" />
                <Box
                  className="text-green-600 text-center"
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Bid
                </Box>
              </td>
            </tr>
            {orderbook.buy.map((buyOrder, i) => (
              <tr key={i} align="center">
                <td className="text-green-600">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                    }}
                  >
                    {Number(formatUnits(buyOrder.price, 18)).toPrecision(4)}
                  </Box>
                </td>
                <td>{buyOrder.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <div className="flex flex-col m-8 space-y-2 items-center justify-center">
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle2.fontSize",
          }}
        >
          Empty Orderbook.
        </Box>
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle2.fontSize",
          }}
        >
          Be the first to{" "}
          <Link href={"/trading/pool/" + pool}>
            <a style={{ textDecoration: "underline" }}>add liquidity</a>
          </Link>
          .
        </Box>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col items-center justify-center md:flex-row w-full p-4 space-y-8 md:space-y-0 md:space-x-8">
        <div
          className="flex flex-col items-center text-center w-full p-4 pt-0 sm:w-fit md:p-8 md:pt-0 justify-center rounded-3xl bg-black/5 shadow-lg"
          style={{
            ...(backgroundImage && {
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('${backgroundImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }),
          }}
        >
          <div className="flex items-center justify-end mt-4 w-full">
            <ButtonNextUI
              size="sm"
              auto
              color="secondary"
              onClick={() => {
                setProMode(!proMode);
              }}
            >
              {proMode ? "Simple Mode" : "Pro Mode"}
            </ButtonNextUI>
          </div>
          <div className="flex flex-col mt-4 mb-4 items-center">
            <div className="flex flex-row justify-center items-center m-2">
              <Autocomplete
                value={nftName}
                autoComplete
                freeSolo
                disablePortal
                ListboxProps={{
                  style: {
                    backgroundColor: "rgb(253, 241, 244)",
                    fontFamily: "Monospace",
                  },
                }}
                options={tradingCollections.map((option) => option.name)}
                sx={{ minWidth: { xs: 260, sm: 320, md: 380 } }}
                onInputChange={handleNFTAddressChange}
                renderOption={(props, option, state) => (
                  <div className="flex flex-row m-4" {...props}>
                    <div className="flex w-3/12 h-[50px]">
                      {tradingCollections.find(
                        (collection) => collection.name == option
                      ).image != "" && (
                        <Image
                          loader={() =>
                            tradingCollections.find(
                              (collection) => collection.name == option
                            ).image
                          }
                          src={
                            tradingCollections.find(
                              (collection) => collection.name == option
                            ).image
                          }
                          height="50"
                          width="50"
                          className="rounded-xl"
                        />
                      )}
                    </div>
                    <div className="flex mx-2">{option}</div>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="NFT Name or Address"
                    sx={{
                      "& label": {
                        paddingLeft: (theme) => theme.spacing(2),
                        fontFamily: "Monospace",
                        fontSize: "subtitle1.fontSize",
                        backdropFilter: "blur(10px)",
                      },
                      "& input": {
                        paddingLeft: (theme) => theme.spacing(3.5),
                        fontFamily: "Monospace",
                        backdropFilter: "blur(10px)",
                      },
                      "& fieldset": {
                        paddingLeft: (theme) => theme.spacing(2.5),
                        borderRadius: "20px",
                        fontFamily: "Monospace",
                      },
                    }}
                  />
                )}
              />
            </div>
            {props.nftAddress && (
              <div className="flex flex-row justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {pool ? (
                    <div className="flex flex-col">
                      {"Pool: " +
                        pool.slice(0, 5) +
                        ".." +
                        pool.slice(-2) +
                        " "}
                      {lowLiquidity && (
                        <span className="text-red-600 mt-1">
                          (Low Liquidity Pool)
                        </span>
                      )}
                    </div>
                  ) : isConnected ? (
                    "No pool found"
                  ) : (
                    "Connect Wallet"
                  )}
                </Box>
              </div>
            )}
            {price && (
              <div className="flex flex-row justify-around border-black/20 backdrop-blur-md mt-6 border-2 rounded-xl w-fit p-2">
                <div className="flex flex-col items-center justify-center p-3 px-4 border-r-2 border-black/20">
                  <Box
                    className="mb-1"
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "caption.fontSize",
                      letterSpacing: 1,
                    }}
                  >
                    Buy Price
                  </Box>
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {(BigNumber.from(price.buyPrice).eq(0)
                      ? "―.―"
                      : Number(formatUnits(price.buyPrice, 18)).toPrecision(
                          3
                        )) + " ETH"}
                  </Box>
                </div>
                <div className="flex flex-col items-center justify-center p-3 px-4">
                  <Box
                    className="mb-1"
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "caption.fontSize",
                      letterSpacing: 1,
                    }}
                  >
                    Sell Price
                  </Box>
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {(BigNumber.from(price.sellPrice).eq(0)
                      ? "―.―"
                      : Number(formatUnits(price.sellPrice, 18)).toPrecision(
                          3
                        )) + " ETH"}
                  </Box>
                </div>
              </div>
            )}
          </div>
          {proMode && (
            <div className="flex flex-row mb-1">
              <div className="flex flex-col m-2">
                <Button
                  primary
                  size="small"
                  color={option == "market" ? SELECTED_COLOR : UNSELECTED_COLOR}
                  onClick={() => {
                    setOption("market");
                  }}
                  label={
                    <div className="flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 2,
                        }}
                      >
                        Market
                      </Box>
                    </div>
                  }
                />
              </div>
              <div className="flex flex-col m-2">
                <Button
                  primary
                  size="small"
                  color={option == "limit" ? SELECTED_COLOR : UNSELECTED_COLOR}
                  onClick={() => {
                    setOption("limit");
                  }}
                  label={
                    <div className="flex">
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 2,
                        }}
                      >
                        Limit
                      </Box>
                    </div>
                  }
                />
              </div>
            </div>
          )}
          {props.option == "buy" && (
            <div className="flex flex-row items-center">
              {option == "market" && (
                <MarketBuy
                  nftAddress={props.nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
              {option == "limit" && (
                <LimitBuy
                  nftAddress={props.nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
            </div>
          )}
          {props.option == "sell" && (
            <div className="flex flex-row items-center">
              {option == "market" && (
                <MarketSell
                  nftAddress={props.nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
              {option == "limit" && (
                <LimitSell
                  nftAddress={props.nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
            </div>
          )}
        </div>

        {proMode && (
          <div className="hidden md:flex flex-col items-center rounded-3xl bg-black/5 w-fit shadow-lg p-4">
            <Box
              className="mb-4"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              Orderbook
            </Box>
            <OrderbookComponent />
          </div>
        )}
      </div>
      {proMode && (
        <div className="flex flex-col items-center rounded-3xl bg-black/5 w-full md:w-fit min-w-[50%] m-4 shadow-lg py-4">
          <div className="flex flex-row items-center justify-center mb-4 space-x-4">
            <Box
              className="cursor-pointer md:cursor-auto hover:bg-black/10 md:hover:bg-transparent p-2 rounded"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
                backgroundColor: {
                  xs: myOrders && SELECTED_COLOR,
                  md: "transparent",
                },
              }}
              onClick={() => {
                setMyOrders(true);
              }}
            >
              My Open Orders
            </Box>
            <Box
              className="cursor-pointer hover:bg-black/10 p-2 rounded md:hidden"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
                backgroundColor: !myOrders && SELECTED_COLOR,
              }}
              onClick={() => {
                setMyOrders(false);
              }}
            >
              Orderbook
            </Box>
          </div>
          {(myOrders || !isSmallScreen) &&
            (pool ? (
              loadingOpenOrders ? (
                <div className="m-16">
                  <Loading size={18} spinnerColor="#000000" />
                </div>
              ) : openOrders.length > 0 ? (
                <table>
                  <thead>
                    <tr className="border-b-2 border-black/10">
                      <th className="px-6 md:px-12 py-2 text-sm">Type</th>
                      <th className="px-6 md:px-12 py-2 text-sm">Filled</th>
                      <th className="px-6 md:px-12 py-2 text-sm">Price</th>
                      <th className="px-8 md:px-12 py-2 text-sm hidden md:table-cell">
                        Token
                      </th>
                      <th className="px-8 md:px-12 py-2 text-sm hidden md:table-cell">
                        NFTs
                      </th>
                      <th className="px-8 md:px-12 py-2 text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((order, index) => (
                      <tr key={index} align="center" className="text-sm">
                        <td>
                          {order.type.charAt(0).toUpperCase() +
                            order.type.slice(1)}
                        </td>
                        <td>
                          {order.type == "buy"
                            ? (order.nfts.length /
                                (order.nfts.length +
                                  BigNumber.from(order.token)
                                    .div(order.price)
                                    .toNumber())) *
                                100 +
                              "%"
                            : BigNumber.from(order.token)
                                .div(
                                  BigNumber.from(order.token).add(
                                    BigNumber.from(order.nfts.length).mul(
                                      order.price
                                    )
                                  )
                                )
                                .toNumber() *
                                100 +
                              "%"}
                        </td>
                        <td>{formatUnits(order.price, 18) + " ETH"}</td>
                        <td className="hidden md:table-cell">
                          {formatUnits(order.token, 18) + " ETH"}
                        </td>
                        <td className="hidden md:table-cell">
                          {order.nfts.length == 0
                            ? "None"
                            : order.nfts.join(", ")}
                        </td>
                        <td>
                          {approvedLP ? (
                            <ButtonNextUI
                              className="m-2"
                              size="xs"
                              auto
                              color="secondary"
                              onPress={async function () {
                                try {
                                  var tx;

                                  console.log("Removing LP");
                                  tx =
                                    await wethGatewaySigner.withdrawTradingPool(
                                      pool,
                                      order.lpId
                                    );

                                  await tx.wait(1);
                                  handleWithdrawSuccess();
                                } catch (error) {
                                  console.log(error);
                                }
                              }}
                            >
                              Withdraw
                            </ButtonNextUI>
                          ) : (
                            <ButtonNextUI
                              className="m-2"
                              size="xs"
                              auto
                              color="secondary"
                              onPress={async function () {
                                try {
                                  const poolContract = new ethers.Contract(
                                    pool,
                                    tradingPoolContract.abi,
                                    signer
                                  );
                                  const tx =
                                    await poolContract.setApprovalForAll(
                                      addresses.WETHGateway,
                                      true
                                    );
                                  await tx.wait(1);
                                  handleLPApprovalSuccess();
                                } catch (error) {
                                  console.log(error);
                                }
                              }}
                            >
                              Approve Removal
                            </ButtonNextUI>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col m-8 items-center justify-center">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "subtitle2.fontSize",
                    }}
                  >
                    No open orders
                  </Box>
                </div>
              )
            ) : (
              <div className="flex flex-col m-8 items-center justify-center text-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                  }}
                >
                  {isConnected
                    ? "Select a collection to view open orders"
                    : "Connect Wallet to view open orders"}
                </Box>
              </div>
            ))}
          {!myOrders && isSmallScreen && (
            <div className="flex flex-col items-center justify-center text-center m-2 p-2 border-black/20 rounded border-4">
              <OrderbookComponent />
            </div>
          )}
        </div>
      )}
      {proMode && (
        <div className="flex flex-col items-center w-full md:w-fit min-w-[50%] justify-center rounded-3xl py-4 m-4 bg-black/5 shadow-lg">
          <div className="flex flex-row items-center justify-center mb-4 space-x-4">
            <Box
              className="cursor-pointer hover:bg-black/10 p-2 rounded"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
                backgroundColor: myHistory && SELECTED_COLOR,
              }}
              onClick={() => {
                setMyHistory(true);
              }}
            >
              My History
            </Box>
            <Box
              className="cursor-pointer hover:bg-black/10 p-2 rounded"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
                backgroundColor: !myHistory && SELECTED_COLOR,
              }}
              onClick={() => {
                setMyHistory(false);
              }}
            >
              History
            </Box>
          </div>
          {pool ? (
            loadingTradingHistory ? (
              <div className="m-32">
                <Loading size={18} spinnerColor="#000000" />
              </div>
            ) : poolHistory.length ? (
              <table>
                <thead>
                  <tr className="border-b-2 border-black/10">
                    <th className="hidden md:table-cell px-8 md:px-12 py-2 text-sm">
                      Transaction
                    </th>
                    <th className="px-8 md:px-12 py-2 text-sm">Type</th>
                    <th className="px-8 md:px-12 py-2 text-sm">Date</th>
                    <th className="hidden md:table-cell px-8 md:px-12 py-2 text-sm">
                      Address
                    </th>
                    <th className="hidden md:table-cell px-8 md:px-12 py-2 text-sm">
                      NFTs
                    </th>
                    <th className="px-8 md:px-12 py-2 text-sm">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {poolHistory.map((data, i) => (
                    <tr key={i} align="center" className="text-sm">
                      <td className="hidden md:table-cell">
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
                              : "https://sepolia.etherscan.io/tx/" +
                                data.transaction
                          }
                        ></LinkTo>
                      </td>
                      <td className="table-cell">
                        {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                      </td>
                      <td className="table-cell">
                        {timeago.format(data.timestamp * 1000)}
                      </td>
                      <td className="hidden md:table-cell">
                        <LinkTo
                          type="external"
                          iconLayout="none"
                          text={
                            <Box
                              sx={{
                                fontFamily: "Monospace",
                                margin: 1,
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
                              : "https://sepolia.etherscan.io/address/" +
                                data.address
                          }
                        ></LinkTo>
                      </td>
                      <td className="hidden md:table-cell">
                        {data.nftIds.join(",")}
                      </td>
                      <td className="table-cell pt-2">
                        {Number(formatUnits(data.price, 18)).toPrecision(3) +
                          " ETH"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col m-8 items-center justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                  }}
                >
                  {myHistory ? "You haven't made any trades" : "No trades yet"}
                </Box>
              </div>
            )
          ) : (
            <div className="flex flex-col m-8 items-center justify-center">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle2.fontSize",
                }}
              >
                {isConnected
                  ? " Select a collection to view trades"
                  : "Connect Wallet to view trades"}
              </Box>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
