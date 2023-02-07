import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "grommet";
import Box from "@mui/material/Box";

export default function Home() {
  return (
    <div className={styles.mainIndex}>
      <div className={styles.opac}>
        <div className={styles.headerCenter}>
          <div className={styles.headerLogo}>
            <a>
              <img
                src="symbol-no-bg.png"
                className={styles.headerLogoImg}
              ></img>
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
            </ul>
          </nav>
        </div>
        <div className={styles.main}>
          <div className={styles.indexDescribe}>
            <div className={styles.indexDescribeTitle}>
              <a
                href="/trade"
                style={{
                  textDecoration: "underline",
                }}
              >
                swap
              </a>
              {", "}
              <a
                href="/buy"
                style={{
                  textDecoration: "underline",
                }}
              >
                buy
              </a>
              {", "}
              <a
                href="/sell"
                style={{
                  textDecoration: "underline",
                }}
              >
                sell
              </a>
              {" and "}
              <a
                href="/lend"
                style={{
                  textDecoration: "underline",
                }}
              >
                lend
              </a>{" "}
              your NFTs.
            </div>
            <div className={styles.indexDescribeSubtitle}>
              (beta live on goerli)
            </div>
            <div className="flex items-center m-16 space-x-8">
              <Link href="/trade">
                <a>
                  <Button
                    primary
                    size="large"
                    color="black"
                    label={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Launch Trade
                      </Box>
                    }
                  />
                </a>
              </Link>
              <Link href="/lend">
                <a>
                  <Button
                    primary
                    size="large"
                    color="black"
                    label={
                      <Box
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "subtitle2.fontSize",
                          fontWeight: "bold",
                          letterSpacing: 4,
                        }}
                      >
                        Launch Lend
                      </Box>
                    }
                  />
                </a>
              </Link>
            </div>
            <div className={styles.indexDescribeSubtitle}>
              <li>Trade your NFTs</li>
              <li>Borrow money using your NFTs</li>
              <li>Earn interest on your ETH</li>
              <li>Bring liquidity into your NFT&apos;s ecosystem</li>
            </div>
            <div className={styles.indexDescribeSubtitle}>
              <Link href="https://discord.gg/cDywBRGcmT">
                <a target="_blank" className="text-sky-600">
                  Join the Discord
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
