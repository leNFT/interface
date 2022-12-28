import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "grommet";
import { useState, useEffect } from "react";

import Box from "@mui/material/Box";

export default function Home() {
  const imagesURLs = [
    "/lisbon-pixelated-bg.png",
    "/paris-pixelated-bg.png",
    "/pyramids-pixelated-bg.png",
  ];
  const [imageURL, setImageURL] = useState();

  useEffect(() => {
    // Show a random background image
    if (imagesURLs) {
      setImageURL(imagesURLs[Math.floor(Math.random() * imagesURLs.length)]);
      console.log(
        "Background image is: ",
        imagesURLs[Math.floor(Math.random() * imagesURLs.length)]
      );
    }
  }, []);
  return (
    <div className={"bg-[url('" + imageURL + "')] bg-cover min-h-[100vh]"}>
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
              <li className="px-8">
                <Link href="/swap">
                  <a>
                    <Button
                      primary
                      size="medium"
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
                          Launch App
                        </Box>
                      }
                    />
                  </a>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className={styles.main}>
          <div className={styles.indexDescribe}>
            <div className={styles.indexDescribeTitle}>
              swap and lend your NFTs.
            </div>
            <div className={styles.indexDescribeTitle}>
              (beta live on goerli)
            </div>
            <div className={styles.indexDescribeSubtitle}>
              <li>Borrow money using your NFTs</li>
              <li>Swap your NFTs</li>
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
