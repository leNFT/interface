import styles from "../styles/Home.module.css";
import { TabList, Tab } from "@web3uikit/core";
import ReserveDetails from "../components/ReserveInfo";
import contractAddresses from "../contractAddresses.json";
import { Eth, Usdc } from "@web3uikit/icons";
import { useMoralis } from "react-moralis";

export default function Supply() {
  const { chainId } = useMoralis();

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  return (
    <div className={styles.container}>
      <div className="flex justify-center m-4">
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
                <div className="flex flex-col mx-2">WETH</div>
              </div>
            }
          >
            <ReserveDetails asset={"WETH"} />
          </Tab>
          <Tab
            lineHeight={0}
            tabKey={2}
            tabName={
              <div className="flex flex-row items-center">
                <div className="flex flex-col">
                  <Usdc fontSize="32px" color="#000000" />
                </div>
                <div className="flex flex-col mx-2">USDC</div>
              </div>
            }
          >
            <ReserveDetails asset={"USDC"} />
          </Tab>
        </TabList>
      </div>
    </div>
  );
}
