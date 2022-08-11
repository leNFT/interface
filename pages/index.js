import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "@web3uikit/core";

export default function Home() {
  return (
    <div className={styles.main}>
      <div className={styles.headerCenter}>
        <div className={styles.headerLogo}>
          <a>
            <img src="symbol-no-bg.png" className={styles.headerLogoImg}></img>
          </a>
        </div>

        <nav>
          <ul id="main-nav" className={styles.nav}>
            <li>
              <a
                href="http://discord.gg/hWyBHrUDAk"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
            </li>
            <li>
              <a
                href="https://twitter.com/lenftapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
            </li>
            <li>
              <a
                href="https://github.com/leNFT"
                target="_blank"
                rel="noopener noreferrer"
              >
                Github
              </a>
            </li>
            <li>
              <a
                href="https://lenft.gitbook.io/lenft-docs/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </a>
            </li>
            <li>
              <Link href="/app">
                <a>
                  <Button color="blue" theme="colored" text="Launch App" />
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className={styles.main}>
        <div className={styles.indexDescribe}>
          <div className={styles.indexDescribeTitle}>
            leNFT is a Peer-To-Pool NFT Liquidity Protocol
          </div>
          <div className={styles.indexDescribeSubtitle}>
            <li>Borrow money using your NFTs</li>
            <li>Gain interest on your ETH</li>
          </div>
        </div>
      </div>
    </div>
  );
}
