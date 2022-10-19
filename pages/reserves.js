import styles from "../styles/Home.module.css";
import { Button, Table, Avatar, Tag } from "@web3uikit/core";
import { getReserves } from "../helpers/getReserves.js";
import StyledModal from "../components/StyledModal";
import contractAddresses from "../contractAddresses.json";
import CreateReserve from "../components/CreateReserve";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { useState, useEffect } from "react";
import Router from "next/router";

export default function Reserves() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [visibleCreateReserveModal, setVisibleCreateReserveModal] =
    useState(false);

  async function updateTableData() {
    const reserves = await getReserves(chain.id);
    console.log("reserves", reserves);
    var newTableData = [];

    for (const [key, value] of Object.entries(reserves)) {
      console.log(key, value);
      newTableData.push([
        <div className="m-4 break-all">{key}</div>,
        <div className="m-4">{value.block}</div>,
        <div className="m-4">{0}</div>,
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
          columnsConfig="1fr 1fr 1fr 1fr"
          tableBackgroundColor="#2c2424"
          data={tableData}
          header={[
            <span key="0">Address</span>,
            <span key="1">Block</span>,
            <span key="2">TVL</span>,
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
