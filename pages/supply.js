import styles from "../styles/Home.module.css";
import { Button, Modal } from "web3uikit";
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
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center m-16">
          <div className="m-4">
            <Button
              text="Deposit"
              theme="colored"
              type="button"
              size="large"
              color="blue"
              onClick={async function () {
                setVisibleDepositModal(true);
              }}
            ></Button>
          </div>
          <div className="m-4">
            <Button
              text="Withdraw"
              theme="colored"
              type="button"
              size="large"
              color="blue"
              onClick={async function () {
                setVisibleWithdrawalModal(true);
              }}
            ></Button>
          </div>
        </div>
        <div className="flex flex-col items-center m-16">
          <ReserveDetails />
        </div>
      </div>
    </div>
  );
}
