import styles from "../styles/Home.module.css";
import { Box, Tab, Tabs } from "grommet";
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
      <Box align="center" pad="medium">
        <Tabs height="medium" flex="grow" alignSelf="center">
          <Tab title="WETH" icon={<Eth fontSize="32px" color="#000000" />}>
            <Box margin="small" pad="small">
              <ReserveDetails asset={"WETH"} />
            </Box>
          </Tab>
          <Tab title="USDC" icon={<Usdc fontSize="32px" color="#000000" />}>
            <Box margin="small" pad="small">
              <ReserveDetails asset={"USDC"} />
            </Box>
          </Tab>
        </Tabs>
      </Box>
    </div>
  );
}
