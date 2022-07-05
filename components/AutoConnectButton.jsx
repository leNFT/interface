import { ConnectButton } from "web3uikit";

export default function AutoConnectButton() {
  return (
    <div>
      <ConnectButton moralisAuth={false} />
    </div>
  );
}
