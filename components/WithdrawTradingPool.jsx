import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Box from "@mui/material/Box";
import { BigNumber } from "@ethersproject/bignumber";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { formatUnits, parseUnits } from "@ethersproject/units";
import {
  useNotification,
  Button,
  Input,
  Typography,
  Select,
} from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import tradingPoolContract from "../contracts/TradingPool.json";
import wethGatewayContract from "../contracts/WETHGateway.json";
import erc20 from "../contracts/erc20.json";
import erc721 from "../contracts/erc721.json";

export default function WithdrawTradingPool(props) {
  const [approvedLP, setApprovedLP] = useState(false);
  const [approvalLPLoading, setApprovalLPLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const poolNFTProvider = useContract({
    contractInterface: erc721,
    addressOrName: props.pool,
    signerOrProvider: provider,
  });

  async function getLPAllowance() {
    const allowed = await poolNFTProvider.getApproved(props.lp);

    console.log("Got pool getApproved:", allowed);

    if (allowed != "0x0000000000000000000000000000000000000000") {
      setApprovedLP(true);
    } else {
      setApprovedLP(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.pool && props.lp) {
      console.log("Got trading pool address, setting the rest...", props.pool);
      getLPAllowance();
    }
  }, [props.pool, props.lp]);

  const handleWithdrawSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was successfully removed from the pool.",
      title: "Removal Successful!",
      position: "topR",
    });
  };

  const handleLPApprovalSuccess = async function () {
    setApprovedLP(true);
    dispatch({
      type: "success",
      message: "You can now remove the LP.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        <Typography>{"LP #" + props.lp + " Removal"}</Typography>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        {approvedLP ? (
          <Button
            text={"Remove LP"}
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            disabled={!approvedLP}
            loadingText=""
            isLoading={withdrawLoading}
            onClick={async function () {
              try {
                setWithdrawLoading(true);
                console.log("signer.", signer);
                var tx;
                if (props.assetSymbol == "ETH") {
                  console.log("Depositing ETH");
                  tx = await wethGatewaySigner.depositETH(props.reserve, {
                    value: amount,
                  });
                } else {
                  const tradingPool = new ethers.Contract(
                    props.pool,
                    tradingPoolContract.abi,
                    signer
                  );
                  console.log("Removing LP");
                  tx = await tradingPool.removeLiquidity(props.lp);
                }
                await tx.wait(1);
                handleWithdrawSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setWithdrawLoading(false);
              }
            }}
          ></Button>
        ) : (
          <Button
            text="Approve LP Use"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalLPLoading}
            onClick={async function () {
              try {
                setApprovalLPLoading(true);
                console.log("signer.", signer);
                const poolContract = new ethers.Contract(
                  props.pool,
                  erc721,
                  signer
                );
                const tx = await poolContract.approve(props.pool, props.lp);
                await tx.wait(1);
                handleLPApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalLPLoading(false);
              }
            }}
          ></Button>
        )}
      </div>
    </div>
  );
}
