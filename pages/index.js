import styles from "../styles/Home.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <Link href="/app">
          <a>
            <h1 className="py-4 px-4 font-bold text-3xl">go to app.</h1>
          </a>
        </Link>
      </div>
    </div>
  );
}
