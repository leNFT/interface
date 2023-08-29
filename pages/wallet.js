import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
} from "@mui/material";
import { Loading } from "@web3uikit/core";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { Box } from "@mui/system";
import { Button } from "grommet";
import { getSellQuote } from "../helpers/getSellQuote.js";
import { ethers } from "ethers";
import Image from "next/image";
import { useAccount, useNetwork, useProvider, useSigner } from "wagmi";
import { getTradingPools } from "../helpers/getTradingPools.js";
import { getTradingPoolPrice } from "../helpers/getTradingPoolPrice.js";
import { formatUnits } from "@ethersproject/units";
import { useState, useEffect } from "react";
import Router from "next/router";
import { useAccountModal, useChainModal } from "@rainbow-me/rainbowkit";
import erc721 from "../contracts/erc721.json";
import tradingPoolContract from "../contracts/TradingPool.json";
import contractAddresses from "../contractAddresses.json";

export default function Wallet() {
  const { openAccountModal } = useAccountModal();
  const { isConnected, address } = useAccount();
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [tradingPools, setTradingPools] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellMessage, setSellMessage] = useState("");

  var addresses = contractAddresses[1];

  const selectAllRows = () => {
    if (!tableData) return;
    if (selectedRows.length === tableData.length) {
      setSelectedRows([]); // if all rows are selected, deselect them
    } else {
      setSelectedRows(tableData.map((row) => row.key)); // select all rows
    }
  };

  const toggleRowSelection = (rowKey) => {
    if (!rowKey) return;
    if (selectedRows.includes(rowKey)) {
      setSelectedRows((prev) => prev.filter((key) => key !== rowKey));
    } else {
      setSelectedRows((prev) => [...prev, rowKey]);
    }
  };

  const getUniqueCollectionsOfSelectedRows = () => {
    const selectedCollections = selectedRows.map((rowKey) => {
      const found = tableData.find((row) => row.key === rowKey);
      return found ? found.collection : null;
    });
    console.log("selectedCollections", [...new Set(selectedCollections)]);
    return [...new Set(selectedCollections)]; // Returns unique collections
  };

  async function sellNFTs() {
    console.log("Sell NFTs");
    if (selectedRows.length === 0) return;

    const collections = getUniqueCollectionsOfSelectedRows();

    // Sell each collection separately (need to check and approve first)
    for (var i = 0; i < collections.length; i++) {
      const collection = collections[i];

      // Get the trading pool address
      const pool = Object.keys(tradingPools).find(
        (key) => tradingPools[key].nft.name === collection
      );

      // Get the NFTs to sell
      const nftsToSell = tableData
        .filter(
          (row) =>
            selectedRows.includes(row.key) && row.collection === collection
        )
        .map((row) => row.tokenId);

      console.log("nftsToSell", nftsToSell);

      // Get the NFT collection contract
      const nftContractProvider = new ethers.Contract(
        tradingPools[pool].nft.address,
        erc721,
        provider
      );

      // Check if the user has approved the pool to sell the NFTs
      const approved = await nftContractProvider.isApprovedForAll(
        address,
        addresses.WETHGateway
      );

      // If not approved, approve the pool
      if (!approved) {
        setSellMessage("Approving " + collection + "...");
        const nftContractSigner = new ethers.Contract(
          tradingPools[pool].nft.address,
          erc721,
          signer
        );
        try {
          const tx = await nftContractSigner.setApprovalForAll(
            addresses.WETHGateway,
            true
          );
          await tx.wait();
        } catch (e) {
          console.log(e);
          setSellMessage("");
        }
      }

      // Sell the NFTs to the pool
      const wethGatewaySigner = new ethers.Contract(
        addresses.WETHGateway,
        tradingPoolContract.abi,
        signer
      );

      const quote = await getSellQuote(
        isConnected ? chain.id : 1,
        nftsToSell.length,
        pool
      );
      console.log("quote", quote);

      setSellMessage("Selling " + collection + "...");
      try {
        const tx = await wethGatewaySigner.sell(
          pool,
          nftsToSell,
          quote.lps,
          quote.price
        );
        await tx.wait();
      } catch (e) {
        console.log(e);
        setSellMessage("");
      }
    }

    setSellMessage("");
    setSelectedRows([]);
    updateTableData();
  }

  async function updateTableData() {
    setIsLoading(true);
    const tradingPools = await getTradingPools(chain ? chain.id : 1);
    console.log("TradingPools", tradingPools);

    const userNFTs = await getAddressNFTs(address, null, chain.id);
    console.log("userNFTs", userNFTs);

    var newTableData = [];

    for (var i = 0; i < userNFTs.length; i++) {
      // Get the trading pool address
      const pool = Object.keys(tradingPools).find(
        (key) =>
          tradingPools[key].nft.address.toLowerCase() ===
          userNFTs[i].contract.address
      );
      console.log("pool", pool);

      if (!pool) continue;

      console.log(" userNFTs[i]", userNFTs[i]);

      // Add the NFT to the table data
      newTableData.push({
        key: userNFTs[i].tokenId + userNFTs[i].contract.address,
        tokenId: userNFTs[i].tokenId,
        nftName: userNFTs[i].title,
        collection: userNFTs[i].contract.name,
        image: userNFTs[i].media[0].thumbnail,
        pool: pool,
      });

      // Get the price of the pool in case it's not already there
      if (!tradingPools[pool].price) {
        console.log("chain.id", chain.id);
        console.log("pool", pool);
        const price = await getTradingPoolPrice(chain.id, pool);
        tradingPools[pool].price = price;
      }
    }

    setTradingPools(tradingPools);
    setTableData(newTableData);
    setIsLoading(false);
  }

  useEffect(() => {
    if (isConnected && address && chain) updateTableData();
  }, [isConnected, address]);

  return (
    <div>
      {!isConnected ? (
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle1.fontSize",
            fontWeight: "bold",
            letterSpacing: 1,
            textAlign: "center",
            marginTop: "20vh",
          }}
        >
          Connect your wallet to view your NFTs
        </Box>
      ) : !isLoading ? (
        <div className="flex flex-col mx-1 md:mx-8">
          <div className="flex flex-row w-full justify-end md:justify-end space-x-2 items-center mb-2">
            <Button
              primary
              size="small"
              color={"#eae5ea"}
              onClick={openAccountModal}
              label={
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Disconnect
                </Box>
              }
            />
          </div>
          <TableContainer
            sx={{
              borderRadius: "18px",
            }}
          >
            <Table aria-label="User NFTs">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      padding: "2px",
                      width: {
                        xs: "50px",
                        md: "60px",
                      },
                    }}
                  >
                    <Checkbox
                      onChange={selectAllRows}
                      indeterminate={
                        selectedRows.length > 0 &&
                        selectedRows.length < tableData.length
                      }
                      checked={
                        selectedRows.length === tableData.length &&
                        tableData.length !== 0
                      }
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: "2px",
                      width: {
                        xs: "90px",
                        md: "100px",
                      },
                    }}
                  ></TableCell>
                  <TableCell
                    sx={{
                      padding: "2px",
                      width: {
                        xs: "190px",
                        md: "280px",
                      },
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: "4px",
                      width: "250px",
                    }}
                  >
                    Sell Price
                  </TableCell>
                  <TableCell
                    className="hidden md:table-cell"
                    sx={{ padding: "4px" }}
                  >
                    Buy Price
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow
                    key={row.key}
                    sx={{
                      height: "50px",
                      backgroundColor: row.isSelected
                        ? "rgba(0, 0, 0, 0.05)"
                        : "inherit",
                    }}
                  >
                    <TableCell sx={{ padding: "2px" }}>
                      <Checkbox
                        checked={selectedRows.includes(row.key)}
                        onChange={() => toggleRowSelection(row.key)}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: "2px" }}>
                      <Image
                        src={row.image}
                        loader={() => row.image}
                        alt={row.nftName}
                        width={55}
                        height={55}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: "2px" }}>
                      <div className="flex flex-col">
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "subtitle2.fontSize",
                            fontWeight: "bold",
                          }}
                        >
                          {row.nftName}
                        </Box>
                        <Box
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "12px",
                          }}
                        >
                          {row.collection}
                        </Box>
                      </div>
                    </TableCell>
                    <TableCell sx={{ padding: "4px" }}>
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        {(tradingPools[row.pool].price === "0"
                          ? "━"
                          : formatUnits(
                              tradingPools[row.pool].price.sellPrice,
                              18
                            )) + " ETH"}
                      </Box>
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      sx={{ padding: "4px" }}
                    >
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                        }}
                      >
                        {(tradingPools[row.pool].price === "0"
                          ? "━"
                          : formatUnits(
                              tradingPools[row.pool].price.buyPrice,
                              18
                            )) + " ETH"}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="flex flex-row w-full space-x-2 justify-start mt-2">
            <Button
              primary
              disabled={selectedRows.length === 0}
              className="w-6/12 md:w-5/12"
              size="medium"
              color="#063970"
              onClick={sellNFTs}
              label={
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 1,
                  }}
                >
                  {selectedRows.length === 0
                    ? "Sell"
                    : sellMessage
                    ? sellMessage
                    : "Sell " + selectedRows.length + " NFTs"}
                </Box>
              }
            />
            <Button
              primary
              disabled={
                selectedRows.length === 0 ||
                getUniqueCollectionsOfSelectedRows().length > 1
              }
              className="w-6/12 md:w-5/12 h-14"
              size="medium"
              color="#063970"
              onClick={() => {
                console.log(
                  "traing poools",

                  Object.keys(tradingPools).find(
                    (key) =>
                      tradingPools[key].nft.name ===
                      getUniqueCollectionsOfSelectedRows()[0]
                  )
                );
                Router.push({
                  pathname: "/trading/pool/[address]",
                  query: {
                    address: Object.keys(tradingPools).find(
                      (key) =>
                        tradingPools[key].nft.name ===
                        getUniqueCollectionsOfSelectedRows()[0]
                    ),
                  },
                });
              }}
              label={
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "caption.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 1,
                  }}
                >
                  {selectedRows.length === 0
                    ? "Deposit in Pool"
                    : getUniqueCollectionsOfSelectedRows().length === 1
                    ? "Deposit " + getUniqueCollectionsOfSelectedRows()
                    : "Different Collections"}
                </Box>
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center mt-16">
          <Loading size={36} spinnerColor="#000000" />
        </div>
      )}
    </div>
  );
}
