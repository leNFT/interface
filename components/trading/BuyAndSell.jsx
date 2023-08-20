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
import { getOpenOrders } from "../../helpers/getOpenOrders";
import tradingPoolFactoryContract from "../../contracts/TradingPoolFactory.json";
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

export default function BuyAndSell(props) {
  const SELECTED_COLOR = "#d2c6d2";
  const UNSELECTED_COLOR = "#eae5ea";
  const { isConnected, address } = useAccount();
  const provider = useProvider();
  const { chain } = useNetwork();
  const [option, setOption] = useState("market");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [proMode, setProMode] = useState(false);
  const [pool, setPool] = useState("");
  const [orderbook, setOrderbook] = useState();
  const [loadingProMode, setLoadingProMode] = useState(false);
  const [poolHistory, setPoolHistory] = useState([]);
  const [nftName, setNFTName] = useState("");
  const [tradingCollections, setTradingCollections] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [nftAddress, setNFTAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");

  var addresses = contractAddresses[1];

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
    const updatedURL = await getNFTImage(
      collection,
      1,
      isConnected ? chain.id : 1
    );
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
    getNFTName(collection);
    setPoolAddress(updatedPool);
    setPool(updatedPool);
  }

  async function getNFTName(collection) {
    console.log("nftAddress", nftAddress);
    const nftContract = new ethers.Contract(collection, erc721, provider);
    const name = await nftContract.name();

    console.log("Got nft name:", name);

    if (name) {
      setNFTName(name);
    } else {
      setNFTName("");
    }
  }

  const handleNFTAddressChange = (_event, value) => {
    console.log("handleNFTAddressChange", value);
    if (ethers.utils.isAddress(value)) {
      setNFTAddress(value);
      getBackgroundImage(value);
      getTradingPoolAddress(value);
    } else if (
      tradingCollections.map((collection) => collection.name).includes(value)
    ) {
      const nftAddress = tradingCollections.find(
        (collection) => collection.name == value
      ).address;
      setNFTAddress(nftAddress);
      getBackgroundImage(nftAddress);
      getTradingPoolAddress(nftAddress);
    } else {
      console.log("Invalid NFT Address");
      if (value == "") {
        setNFTAddress("");
      } else {
        setNFTAddress("0x");
      }
      setPool("");
      setBackgroundImage("");
      setPoolAddress("");
      setNFTName("");
    }
  };

  // Runs once
  useEffect(() => {
    const chain = chain ? chain.id : 1;

    getTradingCollections(chain);

    console.log("useEffect called");
  }, [isConnected, chain]);

  useEffect(() => {
    if (nftAddress) {
      handleNFTAddressChange(null, nftAddress);
    }
  }, [isConnected]);

  useEffect(() => {
    if (pool && proMode) {
      const fetchProModeInfo = async () => {
        setLoadingProMode(true);
        const newOrderbook = await getTradingPoolOrderbook(
          chain ? chain.id : 1,
          pool
        );
        console.log("orderbook:", newOrderbook);
        setOrderbook(newOrderbook);
        setLoadingProMode(false);
        const newPoolHistory = await getTradingPoolHistory(
          chain ? chain.id : 1,
          pool
        );
        console.log("poolHistory:", newPoolHistory);
        setPoolHistory(newPoolHistory);
        const updatedOpenOrders = await getOpenOrders(
          chain ? chain.id : 1,
          pool,
          address
        );
        console.log("updatedOpenOrders", updatedOpenOrders);
        setOpenOrders(updatedOpenOrders);
      };
      fetchProModeInfo();
      console.log("pool:", pool);
    }
    console.log("pool:", pool);
  }, [pool, chain, proMode]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center justify-center md:flex-row p-4 space-y-8 md:space-y-0 md:space-x-8">
        <div
          className="flex flex-col items-center text-center w-full p-4 pt-0 md:w-fit md:p-8 md:pt-0 justify-center rounded-3xl bg-black/5 shadow-lg"
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
          <div className="flex flex-col mt-4 mb-8">
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
            {nftAddress && (
              <div className="flex flex-row mt-1 justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {poolAddress
                    ? "Pool: " +
                      poolAddress.slice(0, 5) +
                      ".." +
                      poolAddress.slice(-2)
                    : isConnected
                    ? "No pool found"
                    : "Connect Wallet"}
                </Box>
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
                  nftAddress={nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
              {option == "limit" && (
                <LimitBuy
                  nftAddress={nftAddress}
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
                  nftAddress={nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
              {option == "limit" && (
                <LimitSell
                  nftAddress={nftAddress}
                  nftName={nftName}
                  pool={pool}
                />
              )}
            </div>
          )}
        </div>

        {proMode && (
          <div className="flex flex-col items-center rounded-3xl bg-black/5 w-fit shadow-lg p-4">
            <Box
              className="mb-2"
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              Orderbook
            </Box>
            {pool ? (
              loadingProMode ? (
                <div className="m-32">
                  <Loading size={18} spinnerColor="#000000" />
                </div>
              ) : orderbook &&
                (orderbook.buy.length || orderbook.buy.length) ? (
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
                              {Number(
                                formatUnits(sellOrder.price, 18)
                              ).toPrecision(4)}
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
                            {Number(
                              formatUnits(buyOrder.price, 18)
                            ).toPrecision(4)}
                          </Box>
                        </td>
                        <td>{buyOrder.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
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
                      <a
                        style={{
                          textDecoration: "underline",
                        }}
                      >
                        add liquidity
                      </a>
                    </Link>
                    .
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
                    ? "Select a collection to view the orderbook"
                    : "Connect Wallet to view the orderbook"}
                </Box>
              </div>
            )}
          </div>
        )}
      </div>
      {proMode && (
        <div className="flex flex-col items-center rounded-3xl bg-black/5 min-w-[50%] m-4 shadow-lg py-4">
          <Box
            className="mb-2"
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle2.fontSize",
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            Open Orders
          </Box>
          {pool ? (
            loadingProMode ? (
              <div className="m-16">
                <Loading size={18} spinnerColor="#000000" />
              </div>
            ) : openOrders.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th className="px-4 md:px-12 py-2 text-sm">Type</th>
                    <th className="px-4 md:px-12 py-2 text-sm">Price</th>
                    <th className="px-4 md:px-12 py-2 text-sm">Token</th>
                    <th className="px-4 md:px-12 py-2 text-sm">NFTs</th>
                    <th className="px-4 md:px-12 py-2 text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order, index) => (
                    <tr
                      key={index}
                      align="center"
                      className="text-sm border-t-2 border-black/10"
                    >
                      <td>
                        {order.type.charAt(0).toUpperCase() +
                          order.type.slice(1)}
                      </td>
                      <td>{formatUnits(order.price, 18) + " ETH"}</td>
                      <td>{formatUnits(order.token, 18) + " ETH"}</td>
                      <td>
                        {order.nfts.length == 0
                          ? "None"
                          : order.nfts.join(", ")}
                      </td>
                      <td>
                        <ButtonNextUI
                          className="m-2"
                          size="xs"
                          auto
                          color="secondary"
                          onClick={() => {
                            console.log(
                              `Removing order with lpId: ${order.lpId}`
                            );
                          }}
                        >
                          Remove
                        </ButtonNextUI>
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
            <div className="flex flex-col m-8 items-center justify-center">
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
          )}
        </div>
      )}
      {proMode && (
        <div className="flex flex-col items-center min-w-[50%] justify-center py-4 rounded-3xl my-8 md:m-8 lg:mx-16 !mt-8 bg-black/5 shadow-lg">
          <Box
            className="mb-2"
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle2.fontSize",
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            Trade History
          </Box>
          {pool ? (
            loadingProMode ? (
              <div className="m-32">
                <Loading size={18} spinnerColor="#000000" />
              </div>
            ) : poolHistory.length ? (
              <div>
                <Table
                  shadow={false}
                  bordered={false}
                  className="hidden md:table"
                  aria-label="Trading Pool Activity"
                  css={{
                    height: "auto",
                    width: "50vw",
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
                                  ? "https://etherscan.io/tx/" +
                                    data.transaction
                                  : "https://sepolia.etherscan.io/tx/" +
                                    data.transaction
                                : "https://sepolia.etherscan.io/tx/" +
                                  data.transaction
                            }
                          ></LinkTo>
                        </Table.Cell>
                        <Table.Cell>
                          {data.type.charAt(0).toUpperCase() +
                            data.type.slice(1)}
                        </Table.Cell>
                        <Table.Cell>
                          {timeago.format(data.timestamp * 1000)}
                        </Table.Cell>
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
                                  ? "https://etherscan.io/address/" +
                                    data.address
                                  : "https://sepolia.etherscan.io/address/" +
                                    data.address
                                : "https://sepolia.etherscan.io/address/" +
                                  data.address
                            }
                          ></LinkTo>
                        </Table.Cell>
                        <Table.Cell>{data.nftIds.join(",")}</Table.Cell>
                        <Table.Cell>
                          {Number(formatUnits(data.price, 18)).toPrecision(6) +
                            " ETH"}
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
                                  ? "https://etherscan.io/tx/" +
                                    data.transaction
                                  : "https://sepolia.etherscan.io/tx/" +
                                    data.transaction
                                : "https://sepolia.etherscan.io/tx/" +
                                  data.transaction
                            }
                          ></LinkTo>
                        </Table.Cell>
                        <Table.Cell>
                          {data.type.charAt(0).toUpperCase() +
                            data.type.slice(1)}
                        </Table.Cell>
                        <Table.Cell>
                          {timeago.format(data.timestamp * 1000)}
                        </Table.Cell>
                        <Table.Cell>
                          {Number(formatUnits(data.price, 18)).toPrecision(3) +
                            " ETH"}
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
            ) : (
              <div className="flex flex-col m-8 items-center justify-center">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                  }}
                >
                  No trades yet
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
