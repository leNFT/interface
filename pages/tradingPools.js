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
import Router from "next/router";
import { ethers } from "ethers";
import { ExternalLink } from "@web3uikit/icons";
import Box from "@mui/material/Box";

export default function TradingPools() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [loadingTableData, setLoadingTableData] = useState(true);
  const [visibleCreateTradingPoolModal, setVisibleCreateTradingPoolModal] =
    useState(false);
  const EmptyRowsForSkeletonTable = () => (
    <div style={{ width: "100%", height: "100%" }}>
      {[...Array(6)].map((_el, i) => (
        <Skeleton key={i} theme="subtitle" width="30%" />
      ))}
    </div>
  );

  async function updateTableData() {
    setLoadingTableData(true);
    const tradingPools = await getTradingPools(chain.id);
    console.log("TradingPools", tradingPools);
    var newTableData = [];

    for (const [key, value] of Object.entries(tradingPools)) {
      newTableData.push([
        <LinkTo
          type="external"
          iconLayout="none"
          text={
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
              }}
              className="m-2"
            >
              {key.slice(0, 4) + ".." + key.slice(-3)}
            </Box>
          }
          address={
            chain.id == 1
              ? "https://etherscan.io/address/" + key
              : "https://goerli.etherscan.io/address/" + key
          }
        ></LinkTo>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          className="m-2"
          key={"nft" + key}
        >
          {value.nft.name}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          className="m-2"
          key={"token" + key}
        >
          {value.token.name}
        </Box>,
        <div className="m-1">
          <Button
            text={value.gauge != ethers.constants.AddressZero ? "Yes" : "No"}
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
              backgroundColor: "blue",
              fontSize: 16,
              textColor: "white",
            }}
            text="Options"
            theme="custom"
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
    if (isConnected) {
      updateTableData();
    }
  }, [isConnected]);

  return (
    <div className={styles.container}>
      <StyledModal
        hasFooter={false}
        title="Create Trading Pool"
        isVisible={visibleCreateTradingPoolModal}
        onCloseButtonPressed={function () {
          setVisibleCreateTradingPoolModal(false);
        }}
      >
        <CreateTradingPool
          setVisibility={setVisibleCreateTradingPoolModal}
          updateUI={updateTableData}
        />
      </StyledModal>
      <div className="flex flex-col">
        <div className="flex flex-row justify-end m-2 mb-4">
          <Button
            customize={{
              backgroundColor: "grey",
              fontSize: 20,
              textColor: "white",
            }}
            text="Create Trading Pool"
            theme="custom"
            size="large"
            radius="12"
            onClick={async function () {
              setVisibleCreateTradingPoolModal(true);
            }}
          />
        </div>
        <Table
          columnsConfig="2fr 2fr 2fr 2fr 0fr"
          tableBackgroundColor="white"
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
            <div className="flex flex-row m-2" key="nft">
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
                Address
              </Box>
              <div className="flex flex-col ml-1">
                <Tooltip content="Address of this pool" position="bottom">
                  <HelpCircle fontSize="14px" color="#000000" />
                </Tooltip>
              </div>
            </div>,
            <div className="flex flex-row m-2" key="nft">
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
            <div className="flex flex-row m-2" key="rates">
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
                  content="Token in this pool."
                  position="bottom"
                  minWidth={170}
                >
                  <HelpCircle fontSize="14px" color="#000000" />
                </Tooltip>
              </div>
            </div>,
            <div className="flex flex-row m-2" key="rates">
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
          isColumnSortable={[false, true, false, true, false, false]}
          onPageNumberChanged={function noRefCheck() {}}
          onRowClick={function noRefCheck() {}}
          pageSize={5}
        />
      </div>
    </div>
  );
}
