import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "@web3uikit/core";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className="flex flex-row">
          <div className="flex m-4">
            <a
              href="http://discord.gg/hWyBHrUDAk"
              target="_blank"
              rel="noopener noreferrer"
            >
              [discord
            </a>
          </div>
          <div className="flex m-4">
            <a
              href="https://twitter.com/lenftapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              twitter
            </a>
          </div>
          <div className="flex m-4">
            <a
              href="https://github.com/leNFT"
              target="_blank"
              rel="noopener noreferrer"
            >
              github
            </a>
          </div>
          <div className="flex m-4">
            <a
              href="https://lenft.gitbook.io/lenft-docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs]
            </a>
          </div>
        </div>
        <div className="flex flex-row mt-48">
          <Link href="/app">
            <a>
              <Button
                onClick={function noRefCheck() {}}
                size="xl"
                color="blue"
                theme="colored"
                text="go to app"
              />
            </a>
          </Link>
        </div>
        <div className="flex flex-row m-16 max-w-lg text-center">
          leNFT is a peer-to-pool NFT lending market. it allows you to get
          instant liquidity using your NFTs as collateral
        </div>
      </div>
    </div>
  );
}
