import styles from "../styles/Home.module.css";
import { Modal } from "web3uikit";
import ReserveDetails from "../components/ReserveDetails";
import Deposit from "../components/Deposit";
import Withdraw from "../components/Withdraw";
import { useState } from "react";

export default function Supply() {
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  return (
    <div className={styles.container}>
      <Modal
        hasFooter={false}
        title="Deposit WETH"
        isVisible={visibleDepositModal}
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <Deposit />
      </Modal>
      <Modal
        hasFooter={false}
        title="Withdraw WETH"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <Withdraw />
      </Modal>
      <div className="flex flex-col items-center mt-20">
        <button
          className="m-4 bor bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={async function () {
            setVisibleDepositModal(true);
          }}
        >
          Deposit
        </button>
      </div>
      <div className="flex flex-col items-center">
        <button
          className="m-4 bor bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={async function () {
            setVisibleWithdrawalModal(true);
          }}
        >
          Withdrawal
        </button>
      </div>
      <div className={styles.container}>
        <ReserveDetails />
      </div>
    </div>
  );
}
