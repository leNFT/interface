import styles from "../styles/Home.module.css";
import { Github, Discord, Twitter, Book } from "@web3uikit/icons";

export default function Footer() {
  return (
    <div>
      <footer className={styles.footer}>
        <a
          href="http://discord.gg/hWyBHrUDAk"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Discord fontSize="32px" color="#000000" title="Discord Icon" />
        </a>
        <a
          href="https://twitter.com/lenftapp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter fontSize="32px" color="#000000" title="Twitter Icon" />
        </a>
        <a
          href="https://github.com/leNFT"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github fontSize="32px" color="#000000" title="Github Icon" />
        </a>
        <a
          href="https://lenft.gitbook.io/lenft-docs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Book fontSize="32px" color="#000000" title="Book Icon" />
        </a>
      </footer>
    </div>
  );
}
