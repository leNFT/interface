import styles from "../styles/Home.module.css";
import { Button, Table, Avatar, Tag } from "@web3uikit/core";
import { getReserves } from "../helpers/getReserves.js";
import StyledModal from "../components/StyledModal";
import contractAddresses from "../contractAddresses.json";
import CreateReserve from "../components/CreateReserve";
import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { useState, useEffect } from "react";

export default function Supply() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [visibleCreateReserveModal, setVisibleCreateReserveModal] =
    useState(false);

  async function updateTableData() {
    const reserves = await getReserves(chain.id);
    console.log("reserves", reserves);
    var newTableData = [];

    reserves.forEach((reserve) => {
      newTableData.push([
        reserve.name,
        "Moralis Magi",
        <Tag color="blue" text="Nft Collection" />,
      ]);
    });

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
        <div className="flex flex-row justify-ends">
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
        <div className="flex flex-row">
          <Table
            columnsConfig="2fr 2fr 2fr"
            tableBackgroundColor="lightblue"
            data={tableData}
            header={[<span>Name</span>, <span>Age</span>, <span>TVL</span>]}
            isColumnSortable={[false, true, true]}
            onPageNumberChanged={function noRefCheck() {}}
            onRowClick={function noRefCheck() {}}
            pageSize={5}
          />
        </div>
      </div>
    </div>
  );
}
