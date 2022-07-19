import styles from "../styles/Home.module.css";
import { Box, Tab, Tabs } from "grommet";
import ReserveDetails from "../components/ReserveDetails";
import contractAddresses from "../contractAddresses.json";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Button, Modal, Typography, Tooltip, Icon } from "web3uikit";
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
          <Tab title="wETH" icon={<Icon fill="#68738D" size={20} svg="eth" />}>
            <Box margin="small" pad="small">
              <ReserveDetails asset={"wETH"} />
            </Box>
          </Tab>
          <Tab title="USDC" icon={<Icon fill="#68738D" size={20} svg="usdc" />}>
            <Box margin="small" pad="small">
              <ReserveDetails asset={"USDC"} />
            </Box>
          </Tab>
        </Tabs>
      </Box>
    </div>
  );
}
