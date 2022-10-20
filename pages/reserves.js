import styles from "../styles/Home.module.css";
import { Button, Table, Avatar, Tag } from "@web3uikit/core";
import { getReserves } from "../helpers/getReserves.js";
import { formatUnits, parseUnits } from "@ethersproject/units";

import StyledModal from "../components/StyledModal";
import { ethers } from "ethers";
import contractAddresses from "../contractAddresses.json";
import CreateReserve from "../components/CreateReserve";
import reserveContract from "../contracts/Reserve.json";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import erc721 from "../contracts/erc721.json";
import erc20 from "../contracts/erc20.json";
import { useState, useEffect } from "react";
import Router from "next/router";

export default function Reserves() {
  const SECONDS_IN_DAY = 86400;
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const provider = useProvider();
  const [visibleCreateReserveModal, setVisibleCreateReserveModal] =
    useState(false);

  async function updateTableData() {
    const reserves = await getReserves(chain.id);
    console.log("reserves", reserves);
    var newTableData = [];
    var reserve;

    for (const [key, value] of Object.entries(reserves)) {
      var assetNames = [];
      var daysSinceCreation = 0;
      var tvl = 0;
      var underlyingTokenAddress;
      var underlyingToken;
      var underlyingSymbol;
      var reserve;

      // Get asset names
      for (let i = 0; i < value.assets.length; i++) {
        console.log("value.assets[i]", value.assets[i]);
        const nft = new ethers.Contract(value.assets[i], erc721, provider);
        const name = await nft.name();
        assetNames.push(name);
      }
      // Get reserve time since creation
      daysSinceCreation = Math.floor(
        (Date.now() / 1000 - (await provider.getBlock(value.block)).timestamp) /
          SECONDS_IN_DAY
      );

      // Get reserve contract to get the TVL and then get underlying ERC20 token to get token symbol
      reserve = new ethers.Contract(key, reserveContract.abi, provider);
      tvl = await reserve.getUnderlyingBalance();
      underlyingTokenAddress = await reserve.getAsset();
      underlyingToken = new ethers.Contract(
        underlyingTokenAddress,
        erc20,
        provider
      );
      underlyingSymbol = await underlyingToken.symbol();

      newTableData.push([
        <div className="m-2 break-all">{assetNames}</div>,
        <div className="m-2">{daysSinceCreation + " days ago"}</div>,
        <div className="m-2">
          {formatUnits(tvl, 18) + " " + underlyingSymbol}
        </div>,
        <Button
          customize={{
            backgroundColor: "blue",
            fontSize: 16,
            textColor: "white",
          }}
          text="Details"
          theme="custom"
          size="large"
          radius="12"
          onClick={async function () {
            console.log(key);
            Router.push({
              pathname: "/reserve/[address]",
              query: { address: key },
            });
          }}
        />,
      ]);
    }

    setTableData(newTableData);
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
        <div className="flex flex-row justify-end m-2">
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
          columnsConfig="3fr 2fr 2fr 1fr"
          tableBackgroundColor="#2c2424"
          data={tableData}
          header={[
            <span className="m-2" key="0">
              Assets
            </span>,
            <span className="m-2" key="1">
              Created
            </span>,
            <span className="m-2" key="2">
              TVL
            </span>,
            "",
          ]}
          isColumnSortable={[false, true, true]}
          onPageNumberChanged={function noRefCheck() {}}
          onRowClick={function noRefCheck() {}}
          pageSize={5}
        />
      </div>
    </div>
  );
}
