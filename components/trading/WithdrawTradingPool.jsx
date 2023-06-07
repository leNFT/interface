import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { formatUnits } from "@ethersproject/units";
import { useNotification, Button, Typography } from "@web3uikit/core";

import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { BigNumber, ethers } from "ethers";
import tradingPoolContract from "../../contracts/TradingPool.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import erc721 from "../../contracts/erc721.json";

export default function WithdrawTradingPool(props) {
  const [lp, setLP] = useState();
  const [approvedLP, setApprovedLP] = useState(false);
  const [approvalLPLoading, setApprovalLPLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  var addresses = contractAddresses["11155111"];

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  async function getLP() {
    const pool = new ethers.Contract(
      props.pool,
      tradingPoolContract.abi,
      provider
    );

    // GEt LP
    console.log("props.lp", props.lp);
    const lpResponse = await pool.getLP(props.lp);
    console.log("lpResponse", lpResponse);
    setLP(lpResponse);

    // GEt allowance for LP token
    const approvedResponse = await pool.getApproved(props.lp);
    if (approvedResponse == addresses.WETHGateway) {
      setApprovedLP(true);
    } else {
      setApprovedLP(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.pool !== undefined && props.lp !== undefined) {
      console.log("props.lp", props.lp);
      console.log("pool", props.pool);
      getLP();
    }
  }, [props.pool, props.lp]);

  // Close window on address change
  useEffect(() => {
    props.setVisibility(false);
  }, [address]);

  const handleWithdrawSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was successfully removed from the pool.",
      title: "Removal Successful!",
      position: "bottomL",
    });
  };

  const handleLPApprovalSuccess = async function () {
    setApprovedLP(true);
    dispatch({
      type: "success",
      message: "Your LP was successfully approved.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row items-center justify-center m-8">
        <Typography variant="subtitle1">{"LP #" + props.lp}</Typography>
      </div>
      <div className="flex flex-col m-2 space-y-2 text-center">
        <Typography variant="subtitle1">{"LP Price:"}</Typography>
        <Typography variant="body16">
          {(lp ? formatUnits(lp.spotPrice, 18) : "0") + " ETH"}
        </Typography>
      </div>
      <div className="flex flex-col m-2 space-y-2 text-center">
        <Typography variant="subtitle1">{"Trade Fee:"}</Typography>
        <Typography variant="body16">
          {(lp ? lp.fee.toString() / 100 : "0") + "%"}
        </Typography>
      </div>
      <div className="flex flex-col m-2 space-y-2 text-center">
        <Typography variant="subtitle1">{"Curve:"}</Typography>
        <Typography variant="body16">{lp ? lp.curve : "_"}</Typography>
      </div>
      <div className="flex flex-col m-2 space-y-2 text-center mb-8">
        <Typography variant="subtitle1">{"Delta:"}</Typography>
        <Typography variant="body16">
          {(lp ? lp.delta / 100 : "0") + "%"}
        </Typography>
      </div>
      <div className="flex flex-col items-center justify-center border-4 rounded-xl p-4">
        <div className="flex flex-row items-center m-2">
          <Typography variant="subtitle2">
            {(lp
              ? Number(formatUnits(lp.tokenAmount, 18)).toPrecision(6)
              : "0") + " ETH"}
          </Typography>
        </div>
        <div className="flex flex-row items-center  m-2">
          <Typography variant="subtitle2">
            {lp && lp.nftIds.length > 0
              ? lp.nftIds.length + " NFTs: " + lp.nftIds.toString()
              : "No NFTs in LP"}
          </Typography>
        </div>
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
            text="Approve Removal"
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
                const pool = new ethers.Contract(
                  props.pool,
                  tradingPoolContract.abi,
                  signer
                );
                const tx = await pool.approve(addresses.WETHGateway, props.lp);
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
