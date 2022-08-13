import styles from "../styles/Home.module.css";
import { TabList, Tab } from "@web3uikit/core";
import ReserveDetails from "../components/ReserveInfo";
import { Eth, Usdc } from "@web3uikit/icons";
export default function Supply() {
  return (
    <div className={styles.container}>
      <TabList
        isWidthAuto
        defaultActiveKey={1}
        onChange={function noRefCheck() {}}
        tabStyle="bulbSeperate"
      >
        <Tab
          lineHeight={0}
          tabKey={1}
          tabName={
            <div className="flex flex-row items-center">
              <div className="flex flex-col">
                <Eth fontSize="32px" color="#000000" />
              </div>
              <div className="flex flex-col mx-2">W E T H</div>
            </div>
          }
        >
          <ReserveDetails asset={"WETH"} />
        </Tab>
        <Tab
          lineHeight={0}
          isDisabled
          tabKey={2}
          tabName={
            <div className="flex flex-row items-center">
              <div className="flex flex-col">
                <Usdc fontSize="32px" color="#000000" />
              </div>
              <div className="flex flex-col mx-2">U S D C</div>
            </div>
          }
        >
          <ReserveDetails asset={"USDC"} />
        </Tab>
      </TabList>
    </div>
  );
}
