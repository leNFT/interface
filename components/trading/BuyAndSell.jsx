import { Button } from "grommet";
import { Button as ButtonNextUI } from "@nextui-org/react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Link from "next/link";
import LimitBuy from "./LimitBuy";
import MarketBuy from "./MarketBuy";
import LimitSell from "./LimitSell";
import MarketSell from "./MarketSell";
import Divider from "@mui/material/Divider";
import { Loading, LinkTo } from "@web3uikit/core";
import { Table } from "@nextui-org/react";
import { getTradingPoolOrderbook } from "../../helpers/getTradingPoolOrderbook";
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
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [option, setOption] = useState("market");
  const [backgroundImageURL, setBackgroundImageURL] = useState("");
  const [proMode, setProMode] = useState(false);
  const [pool, setPool] = useState("");
  const [orderbook, setOrderbook] = useState();
  const [loadingProMode, setLoadingProMode] = useState(false);
  const [poolHistory, setPoolHistory] = useState([]);

  useEffect(() => {
    if (pool && proMode) {
      const fetchProModeInfo = async () => {
        setLoadingProMode(true);
        const newOrderbook = await getTradingPoolOrderbook(chain.id, pool);
        console.log("orderbook:", newOrderbook);
        setOrderbook(newOrderbook);
        setLoadingProMode(false);
        const newPoolHistory = await getTradingPoolHistory(chain.id, pool);
        console.log("poolHistory:", newPoolHistory);
        setPoolHistory(newPoolHistory);
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
            ...(backgroundImageURL && {
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('${backgroundImageURL}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }),
          }}
        >
          <div className="flex items-center justify-end mt-4 w-full">
            <ButtonNextUI
              size="xs"
              auto
              color="secondary"
              onClick={() => {
                setProMode(!proMode);
              }}
            >
              {proMode ? "Simple Mode" : "Pro Mode"}
            </ButtonNextUI>
          </div>
          <div className="flex flex-row">
            <div className="flex flex-col m-2">
              <Button
                primary
                size="small"
                color={option == "market" ? SELECTED_COLOR : UNSELECTED_COLOR}
                onClick={() => {
                  setBackgroundImageURL("");
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
                  setBackgroundImageURL("");
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
          {props.option == "buy" && (
            <div className="flex flex-row items-center">
              {option == "market" && (
                <MarketBuy
                  setBackgroundImage={setBackgroundImageURL}
                  setPool={setPool}
                />
              )}
              {option == "limit" && (
                <LimitBuy
                  setBackgroundImage={setBackgroundImageURL}
                  setPool={setPool}
                />
              )}
            </div>
          )}
          {props.option == "sell" && (
            <div className="flex flex-row items-center">
              {option == "market" && (
                <MarketSell
                  setBackgroundImage={setBackgroundImageURL}
                  setPool={setPool}
                />
              )}
              {option == "limit" && (
                <LimitSell
                  setBackgroundImage={setBackgroundImageURL}
                  setPool={setPool}
                />
              )}
            </div>
          )}
        </div>
        {proMode && (
          <div className="flex flex-col items-center rounded-3xl bg-black/5 w-full shadow-lg p-4">
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
                  <tr>
                    <th className="px-8 py-2">Price (ETH)</th>
                    <th className="px-8 py-2">Amount</th>
                  </tr>
                  {orderbook.sell
                    .slice()
                    .reverse()
                    .map((sellOrder, i) => (
                      <tr key={i} align="center">
                        <td className="text-red-500">
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
                        <td className="text-red-500">{sellOrder.amount}</td>
                      </tr>
                    ))}
                  <tr>
                    <td colSpan="2">
                      <Divider
                        sx={{
                          marginY: 1,
                        }}
                        variant="middle"
                      />
                    </td>
                  </tr>
                  {orderbook.buy.map((buyOrder, i) => (
                    <tr key={i} align="center">
                      <td className="text-green-500">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle2.fontSize",
                          }}
                        >
                          {Number(formatUnits(buyOrder.price, 18)).toPrecision(
                            4
                          )}
                        </Box>
                      </td>
                      <td className="text-green-500">{buyOrder.amount}</td>
                    </tr>
                  ))}
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
                  Select a collection to view the orderbook
                </Box>
              </div>
            )}
          </div>
        )}
      </div>
      {proMode && (
        <div className="flex flex-col items-center justify-center md:w-8/12 py-4 rounded-3xl my-8 md:m-8 lg:mx-16 !mt-8 bg-black/5 shadow-lg">
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
                Select a collection to view trades
              </Box>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
