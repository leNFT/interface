import styles from "../styles/Home.module.css";
import { Button, Table, Skeleton, LinkTo } from "@web3uikit/core";
import { getTradingPools } from "../helpers/getTradingPools.js";
import { formatUnits } from "@ethersproject/units";
import StyledModal from "../components/StyledModal";
import CreateTradingPool from "../components/trading/CreateTradingPool";
import { useAccount, useNetwork } from "wagmi";
import { Tooltip } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { useState, useEffect } from "react";
import Image from "next/image";
import Router from "next/router";
import { ethers } from "ethers";
import { ExternalLink } from "@web3uikit/icons";
import { getNFTImage } from "../helpers/getNFTImage";
import Box from "@mui/material/Box";

export default function TradingPools() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [loadingTableData, setLoadingTableData] = useState(true);

  const EmptyRowsForSkeletonTable = () => (
    <div style={{ width: "100%", height: "100%" }}>
      {[...Array(6)].map((_el, i) => (
        <Skeleton key={i} theme="subtitle" width="30%" />
      ))}
    </div>
  );

  async function updateTableData() {
    setLoadingTableData(true);
    const tradingPools = await getTradingPools(isConnected ? chain.id : 1);
    console.log("TradingPools", tradingPools);
    var newTableData = [];

    for (const [key, value] of Object.entries(tradingPools)) {
      console.log("pushed: key", key);
      console.log("pushed: value", value);
      newTableData.push([
        value.nft.image && (
          <Image
            loader={() => value.nft.image}
            src={value.nft.image}
            height="80"
            width="80"
            className="rounded-xl"
            key={"image" + key}
          />
        ),
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          key={"nft" + key}
        >
          {value.nft.amount + " " + value.nft.name}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          key={"token" + key}
        >
          {Number(formatUnits(value.token.amount, 18)).toPrecision(2) + " ETH"}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          key={"volume" + key}
        >
          {Number(formatUnits(value.volume, 18)).toPrecision(2) + " ETH"}
        </Box>,
        <div key={"gauge" + key}>
          <Button
            customize={{
              backgroundColor: "black",
              textColor: "white",
            }}
            size="small"
            theme="custom"
            text={
              <Box
                sx={{
                  fontSize: {
                    xs: "caption.fontSize",
                    sm: "subtitle1.fontSize",
                  },
                }}
              >
                {value.gauge != ethers.constants.AddressZero ? "Yes" : "No"}
              </Box>
            }
            id={value.gauge}
            disabled={value.gauge == ethers.constants.AddressZero}
            onClick={async function () {
              Router.push({
                pathname: "/trading/gauge/[address]",
                query: {
                  address: value.gauge,
                },
              });
            }}
          />
        </div>,
        <div key={"details" + key}>
          <Button
            customize={{
              backgroundColor: "grey",
              fontSize: 18,
              textColor: "white",
            }}
            text="+"
            theme="custom"
            size="medium"
            id={key}
            radius="12"
            onClick={async function (event) {
              Router.push({
                pathname: "/trading/pool/[address]",
                query: {
                  address: event.target.id,
                },
              });
            }}
          />
        </div>,
      ]);
    }

    setTableData(newTableData);
    setLoadingTableData(false);
  }

  useEffect(() => {
    console.log("updateTableData()");
    updateTableData();
  }, [isConnected]);

  return (
    <div className="flex flex-col my-2">
      <Table
        columnsConfig="1fr 2fr 2fr 2fr 1fr 0fr"
        alignCellItems="center"
        tableBackgroundColor="rgba(255, 255, 255, 0.65)"
        customLoadingContent={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "80%",
              width: "80%",
            }}
          >
            <EmptyRowsForSkeletonTable />
            <EmptyRowsForSkeletonTable />
          </div>
        }
        customNoDataText="No trading pools found."
        data={tableData}
        header={[
          <div key="image"></div>,
          <div className="flex flex-row" key="nft">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
              key="4"
            >
              NFT
            </Box>
            <div className="flex flex-col ml-1">
              <Tooltip
                content="NFTs in this pool"
                position="bottom"
                minWidth={150}
              >
                <HelpCircle fontSize="14px" color="#000000" />
              </Tooltip>
            </div>
          </div>,
          <div className="flex flex-row" key="token">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
              key="4"
            >
              Token
            </Box>
            <div className="flex flex-col ml-1">
              <Tooltip
                content="Tokens in this pool."
                position="bottom"
                minWidth={170}
              >
                <HelpCircle fontSize="14px" color="#000000" />
              </Tooltip>
            </div>
          </div>,
          <div className="flex flex-row" key="volume">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
              key="4"
            >
              Volume
            </Box>
          </div>,
          <div className="flex flex-row" key="rates">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
              key="4"
            >
              Gauge
            </Box>
            <div className="flex flex-col ml-1">
              <Tooltip
                content="Gauge for this pool."
                position="bottom"
                minWidth={170}
              >
                <HelpCircle fontSize="14px" color="#000000" />
              </Tooltip>
            </div>
          </div>,
          "",
        ]}
        isLoading={loadingTableData}
        isColumnSortable={[false, true, true, true, false]}
        onPageNumberChanged={function noRefCheck() {}}
        onRowClick={function noRefCheck() {}}
        pageSize={20}
      />
    </div>
  );
}
