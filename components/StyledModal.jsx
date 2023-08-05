import { Modal } from "@web3uikit/core";
import styled from "styled-components";

const StyledModal = styled(Modal)`
  background: linear-gradient(
    30deg,
    rgba(240, 230, 245, 0.95),
    rgba(253, 241, 233, 0.95)
  );
  z-index: 10;

  span,
  h2 {
    font-family: Monospace;
  }
`;

export default StyledModal;
