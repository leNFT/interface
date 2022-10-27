import styles from "../styles/Home.module.css";
import { Button, Table, Skeleton } from "@web3uikit/core";
import { getReserves } from "../helpers/getReserves.js";
import { formatUnits } from "@ethersproject/units";
import StyledModal from "../components/StyledModal";
import CreateReserve from "../components/CreateReserve";
import { useAccount, useNetwork } from "wagmi";
import { Tooltip } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { useState, useEffect } from "react";
import Router from "next/router";
import { ExternalLink } from "@web3uikit/icons";
import Box from "@mui/material/Box";

export default function Reserves() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [loadingTableData, setLoadingTableData] = useState(true);
  const [visibleCreateReserveModal, setVisibleCreateReserveModal] =
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
    const reserves = await getReserves(chain.id);
    console.log("reserves", reserves);
    var newTableData = [];
    const underlyingSymbol = "WETH";

    for (const [key, value] of Object.entries(reserves)) {
      newTableData.push([
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle1.fontSize",
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
            fontSize: "subtitle1.fontSize",
          }}
          className="m-2"
          key={"incentivized" + key}
        >
          {value.isIncentivized ? "Yes" : "No"}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle1.fontSize",
          }}
          className="m-2"
          key={"borrow" + key}
        >
          {value.borrowRate / 100 + "%"}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle1.fontSize",
          }}
          className="m-2"
          key={"supply" + key}
        >
          {value.supplyRate / 100 + "%"}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle1.fontSize",
          }}
          className="m-2"
          key={"tvl" + key}
        >
          {Number(formatUnits(value.tvl, 18)).toFixed(2) +
            " " +
            underlyingSymbol}
        </Box>,
        <div key={"details" + key}>
          <Button
            customize={{
              backgroundColor: "blue",
              fontSize: 16,
              textColor: "white",
            }}
            text="Details"
            theme="custom"
            size="large"
            id={key}
            radius="12"
            onClick={async function (event) {
              Router.push({
                pathname: "/reserve/[address]",
                query: {
                  address: event.target.id,
                },
              });
            }}
          />
        </div>,
        <div key={"externalLink" + key}>
          <Button
            size="large"
            color="#eae5ea"
            iconLayout="icon-only"
            id={key}
            icon={<ExternalLink fontSize="30px" />}
            onClick={async function (event) {
              if (chain.id == 1) {
                window.open(
                  "https://etherscan.io/address/" + event.target.id,
                  "_blank"
                );
              } else if (chain.id == 5) {
                window.open(
                  "https://goerli.etherscan.io/address/" + event.target.id,
                  "_blank"
                );
              }
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
        title="Create Reserve"
        isVisible={visibleCreateReserveModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleCreateReserveModal(false);
        }}
      >
        <CreateReserve
          setVisibility={setVisibleCreateReserveModal}
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
            text="Create Reserve"
            theme="custom"
            size="large"
            radius="12"
            onClick={async function () {
              setVisibleCreateReserveModal(true);
            }}
          />
        </div>
        <Table
          columnsConfig="2fr 2fr 2fr 2fr 2fr 1fr 0fr"
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
          customNoDataText="No reserves found."
          data={tableData}
          header={[
            <div key="assets" className="flex flex-row m-2">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
                className=""
                key="1"
              >
                Assets
              </Box>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content="Assets that can be used with this reserve."
                  position="bottom"
                  minWidth={150}
                >
                  <HelpCircle fontSize="14px" color="#000000" />
                </Tooltip>
              </div>
            </div>,
            <div className="flex flex-row m-2" key="rewards">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
                key="4"
              >
                Liquidation Rewards
              </Box>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content="Whether liquidations are incentivized through LE tokens."
                  position="bottom"
                  minWidth={250}
                >
                  <HelpCircle fontSize="14px" color="#000000" />
                </Tooltip>
              </div>
            </div>,
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
              className="m-2"
              key="2"
            >
              Borrow Rate
            </Box>,
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
              className="m-2"
              key="4"
            >
              Supply Rate
            </Box>,
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle1.fontSize",
              }}
              className="m-2"
              key="4"
            >
              TVL
            </Box>,
            "",
            "",
          ]}
          isLoading={loadingTableData}
          isColumnSortable={[false, true, true, true, true, false, false]}
          onPageNumberChanged={function noRefCheck() {}}
          onRowClick={function noRefCheck() {}}
          pageSize={5}
        />
      </div>
    </div>
  );
}
