import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Badge, Button } from "@nextui-org/react";
import Box from "@mui/material/Box";
import { Trending } from "@web3uikit/icons";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

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
                  href="https://mirror.xyz/0x7084faEe75719Be09f9fad92F3407B948527f54F"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Blog
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
            <div className={styles.indexDescribeTitle}>{"use your NFTs."}</div>
            <div className="flex flex-col md:flex-row justify-start items-center m-8">
              <Link href="/trade">
                <a>
                  <Button
                    color="gradient"
                    size="xl"
                    rounded
                    shadow
                    ghost
                    bordered
                    className="m-4"
                    icon={<Trending fontSize="25px" />}
                  >
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "h6.fontSize",
                        fontWeight: "bold",
                        letterSpacing: 6,
                      }}
                    >
                      TRADE
                    </Box>
                  </Button>
                </a>
              </Link>
              <Badge
                disableOutline
                enableShadow
                color="primary"
                content="soon™"
                variant="flat"
                size="lg"
                shape="circle"
              >
                <Button
                  icon={<AccountBalanceIcon />}
                  rounded
                  disabled
                  shadow
                  ghost
                  bordered
                  color="gradient"
                  size="xl"
                  className="m-4"
                >
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                      letterSpacing: 6,
                    }}
                  >
                    BORROW
                  </Box>
                </Button>
              </Badge>
            </div>
            <div className={styles.indexDescribeSubtitle}>
              <li>Trade your assets</li>
              <li>Earn yield</li>
              <li>Increase your project's liquidity</li>
              <li>Borrow ETH using your NFTs as collateral (soon)</li>
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
