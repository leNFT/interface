import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "@web3uikit/core";

export default function Home() {
  return (
      <nav>
        <ul id="main-nav" class="nav" >
          <li>
            <a
              href="http://discord.gg/hWyBHrUDAk"
              target="_blank"
              rel="noopener noreferrer">
            Discord
          </a>
          </li>
          <li>
          <a
              href="https://twitter.com/lenftapp"
              target="_blank"
              rel="noopener noreferrer"
            >Twitter
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
          <ul>
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
          </ul>
        </ul>
        </nav>
  );
}
