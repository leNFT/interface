import styles from "../styles/Home.module.css";
import { Button, Table, Skeleton, LinkTo } from "@web3uikit/core";
import { getLendingPools } from "../helpers/getLendingPools.js";
import { formatUnits } from "@ethersproject/units";
import StyledModal from "../components/StyledModal";
import { ethers } from "ethers";
import CreateLendingPool from "../components/lending/CreateLendingPool";
import { chainId, useAccount, useNetwork } from "wagmi";
import { Tooltip } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { useState, useEffect } from "react";
import Router from "next/router";
import { ExternalLink } from "@web3uikit/icons";
import Box from "@mui/material/Box";

export default function LendingPools() {
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
    const lendingPools = await getLendingPools(isConnected ? chain.id : 1);
    console.log("lendingPools", lendingPools);
    var newTableData = [];
    const underlyingSymbol = "WETH";

    for (const [key, value] of Object.entries(lendingPools)) {
      newTableData.push([
        <LinkTo
          key={"link" + key}
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
            isConnected
              ? chain.id == 1
                ? "https://etherscan.io/address/" + key
                : "https://sepolia.etherscan.io/address/" + key
              : "https://sepolia.etherscan.io/address/" + key
          }
        ></LinkTo>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          className="m-2 break-all"
          key={"noAssets" + key}
        >
          {value.assets.length == 0 ? (
            <span>No Assets</span>
          ) : (
            value.assets.map((asset) => (
              <div key={asset.name}>{asset.name}</div>
            ))
          )}
        </Box>,

        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          className="m-2"
          key={"supply" + key}
        >
          {value.borrowRate / 100 + "%" + " / " + value.supplyRate / 100 + "%"}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          className="m-2"
          key={"tvl" + key}
        >
          {Number(formatUnits(value.tvl, 18)).toPrecision(3) +
            " " +
            underlyingSymbol}
        </Box>,
        <div className="m-1" key={"gauge" + key}>
          <Button
            customize={{
              backgroundColor: "black",
              textColor: "white",
            }}
            theme="custom"
            text={
              <Box
                sx={{
                  fontSize: {
                    xs: "caption.fontSize",
                    sm: "h6.fontSize",
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
                pathname: "/lending/gauge/[address]",
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
            text="Deposit"
            theme="custom"
            size="large"
            id={key}
            radius="12"
            onClick={async function (event) {
              Router.push({
                pathname: "/lending/pool/[address]",
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
    console.log("chain", chain);
    updateTableData();
  }, [isConnected]);

  return (
    <div className="flex flex-col my-2">
      <Table
        columnsConfig="2fr 2fr 2fr 2fr 1fr 0fr"
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
        customNoDataText="No lending pools found."
        data={tableData}
        header={[
          <div key="address" className="flex flex-row m-2">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
              className=""
              key="1"
            >
              Address
            </Box>
          </div>,
          <div key="assets" className="flex flex-row m-2">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: {
                  xs: "caption.fontSize",
                  sm: "subtitle1.fontSize",
                },
              }}
              className=""
              key="1"
            >
              Assets
            </Box>
            <div className="flex flex-col ml-1">
              <Tooltip
                content="Assets that can be used with this lending pool."
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
              Borrow/Supply
            </Box>
            <div className="flex flex-col ml-1">
              <Tooltip
                content={
                  <div>
                    <div>
                      Borrow APR: interest rate at which new borrowers take out
                      loans.
                    </div>
                    <div className="mt-2">
                      Supply APR: interest rate at which lenders are increasing
                      their holdings.
                    </div>
                  </div>
                }
                position="bottom"
                minWidth={350}
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
              TVL
            </Box>
            <div className="flex flex-col ml-1">
              <Tooltip
                content="Total Value Locked."
                position="bottom"
                minWidth={170}
              >
                <HelpCircle fontSize="14px" color="#000000" />
              </Tooltip>
            </div>
          </div>,
          <div className="flex flex-row m-2" key="gauge">
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
                content="Whether this pool has a gauge."
                position="bottom"
                minWidth={250}
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
  );
}
