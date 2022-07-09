import styles from "../styles/Home.module.css";
import { Icon } from "web3uikit";
import Link from "next/link";

export default function Footer() {
  return (
    <div>
      <footer className={styles.footer}>
        <a
          href="http://discord.gg/hWyBHrUDAk"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon fill="#000000" size={32} svg="discord" />
        </a>
        <a
          href="https://twitter.com/lenftapp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon fill="#000000" size={32} svg="twitter" />
        </a>
        <a
          href="https://github.com/leNFT"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon fill="#000000" size={32} svg="github" />
        </a>
        <Link href="/testing">Testing Dashboard</Link>
      </footer>
    </div>
  );
}
