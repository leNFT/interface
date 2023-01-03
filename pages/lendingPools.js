import styles from "../styles/Home.module.css";
import { Button, Table, Skeleton } from "@web3uikit/core";
import { getLendingPools } from "../helpers/getLendingPools.js";
import { formatUnits } from "@ethersproject/units";
import StyledModal from "../components/StyledModal";
import CreateLendingPool from "../components/CreateLendingPool";
import { useAccount, useNetwork } from "wagmi";
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
  const [visibleCreateLendingPoolModal, setVisibleCreateLendingPoolModal] =
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
    const lendingPools = await getLendingPools(chain.id);
    console.log("lendingPools", lendingPools);
    var newTableData = [];
    const underlyingSymbol = "WETH";

    for (const [key, value] of Object.entries(lendingPools)) {
      newTableData.push([
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
          {Number(formatUnits(value.tvl, 18)).toFixed(2) +
            " " +
            underlyingSymbol}
        </Box>,
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: { xs: "caption.fontSize", sm: "subtitle1.fontSize" },
          }}
          className="m-2"
          key={"incentivized" + key}
        >
          {value.isIncentivized ? "Yes" : "No"}
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
        <div key={"externalLink" + key}>
          <Button
            size="small md:large"
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
        title="Create Lending Pool"
        isVisible={visibleCreateLendingPoolModal}
        onCloseButtonPressed={function () {
          setVisibleCreateLendingPoolModal(false);
        }}
      >
        <CreateLendingPool
          setVisibility={setVisibleCreateLendingPoolModal}
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
            text="Create Lending Pool"
            theme="custom"
            size="large"
            radius="12"
            onClick={async function () {
              setVisibleCreateLendingPoolModal(true);
            }}
          />
        </div>
        <Table
          columnsConfig="2fr 2fr 2fr 2fr 1fr 0fr"
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
          customNoDataText="No lending pools found."
          data={tableData}
          header={[
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
                APRs
              </Box>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content={
                    <div>
                      <div>
                        Borrow APR: interest rate at which new borrowers take
                        out loans.
                      </div>
                      <div className="mt-2">
                        Supply APR: interest rate at which lenders are
                        increasing their holdings.
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
            <div className="flex flex-row m-2" key="rewards">
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
            "",
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
