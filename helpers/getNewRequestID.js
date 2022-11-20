import crypto from "crypto";

export function getNewRequestID() {
  const requestID = crypto.randomBytes(32).toString("hex");
  return "0x" + requestID;
}
