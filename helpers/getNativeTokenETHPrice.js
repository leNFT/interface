import contractAddresses from "../contractAddresses.json";
import curvePoolContract from "../contracts/CurvePool.json";
import {
  useAccount,
  useProvider,
  useNetwork,
  useContract,
  useSigner,
} from "wagmi";

export async function getNativeTokenETHPrice(chainId) {
  const provider = useProvider();
  var price = "0";

  const curvePoolProvider = useContract({
    contractInterface: curvePoolContract.abi,
    addressOrName: contractAddresses[chainId].CurvePool,
    signerOrProvider: provider,
  });

  const nativeTokenPrice = await curvePoolProvider.callStatic.get_dy(
    0,
    1,
    10 ** 18
  );

  return nativeTokenPrice.toString();
}
