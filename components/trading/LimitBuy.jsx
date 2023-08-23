import { useNotification } from "@web3uikit/core";
import contractAddresses from "../../contractAddresses.json";
import {
  useAccount,
  useBalance,
  useContract,
  useSigner,
  useProvider,
} from "wagmi";
import { parseUnits } from "ethers/lib/utils";
import { Input } from "@nextui-org/react";
import { BigNumber } from "@ethersproject/bignumber";
import { useState } from "react";
import Box from "@mui/material/Box";
import { Button, Spinner } from "grommet";
import wethGateway from "../../contracts/WETHGateway.json";

export default function LimitBuy(props) {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });

  const { data: signer } = useSigner();
  const [amount, setAmount] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const dispatch = useNotification();

  var addresses = contractAddresses[1];

  const wethGatewaySigner = useContract({
    contractInterface: wethGateway.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const handleBuySuccess = () => {
    dispatch({
      type: "SUCCESS",
      title: "Success",
      message: "Your buy order has been placed!",
    });
  };

  const handleAmountInputChange = (event) => {
    console.log("handleAmountInputChange", event.target.value);
    setAmount(event.target.value);
  };

  const handlePriceInputChange = (event) => {
    console.log("handlePriceInputChange", event.target.value);
    setPrice(event.target.value);
  };

  return (
    <div className="flex flex-col items-center text-center w-full md:w-fit justify-center rounded-3xl">
      <div className="flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row justify-center items-center">
          <div className="flex flex-col w-[200px] justify-center m-2 backdrop-blur-md">
            <Input
              labelLeft={
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Buy
                </Box>
              }
              bordered
              size="xl"
              aria-label="NFTs"
              labelRight={
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  NFTs
                </Box>
              }
              placeholder="0"
              value={amount}
              onChange={handleAmountInputChange}
              css={{ textAlignLast: "center" }}
            />
          </div>
          <div className="flex flex-row">
            <div className="flex flex-col text-center justify-center m-2">
              @
            </div>
            <div className="flex flex-col w-[160px] justify-center m-2 backdrop-blur-md">
              <Input
                bordered
                size="xl"
                aria-label="NFTs"
                labelRight={
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    ETH
                  </Box>
                }
                placeholder="0"
                value={price}
                onChange={handlePriceInputChange}
                css={{ textAlignLast: "center" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row mt-6 mb-2 w-full md:w-8/12">
        <Button
          primary
          fill="horizontal"
          size="large"
          disabled={buyLoading || !isConnected}
          color="#063970"
          onClick={async function () {
            if (!isConnected) {
              dispatch({
                type: "info",
                message: "Connect your wallet first",
                title: "Connect",
                position: "bottomL",
              });
              return;
            }
            if (
              BigNumber.from(
                BigNumber.from(parseUnits(price, 18)).mul(amount)
              ).gt(ethBalance.value)
            ) {
              dispatch({
                type: "info",
                message: "You don't have enough ETH",
                title: "Insufficient ETH",
                position: "bottomL",
              });
            }
            setBuyLoading(true);
            try {
              const tx = await wethGatewaySigner.depositTradingPool(
                props.pool,
                3,
                [],
                parseUnits(Number(price).toString(), 18),
                addresses.ExponentialCurve,
                0,
                0,
                {
                  value: parseUnits((price * amount).toString(), 18),
                }
              );
              await tx.wait(1);
              handleBuySuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setBuyLoading(false);
            }
          }}
          label={
            <div className="flex justify-center">
              {buyLoading ? (
                <Spinner color={"black"} size="small" />
              ) : (
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                    letterSpacing: 2,
                  }}
                >
                  {isConnected ? "CREATE BUY ORDER" : "Connect Wallet"}
                </Box>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
