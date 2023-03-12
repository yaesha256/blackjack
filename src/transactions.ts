
import { TxResponse, Coin } from "secretjs";
import * as consts from "./constants";
import * as  h from "./helpers";

const MAX_ATTEMPTS : number = 4;

export async function send_tx (
  contractCodeHash: string, 
  msg: object, 
  sent: Coin[] = [],
  gas: number = 50_000,
  attempt_no: number = 0,
  exit_on_fail: boolean = true,
  cli: number = 0): Promise<TxResponse | string> {

  let tx_resp = await consts.SECRETCLI[cli].tx.compute.executeContract(
    {
      sender: consts.WALLET.address,
      contract_address: consts.CONTRACT_ADDRESS,
      code_hash: contractCodeHash,
      msg: msg,
      sent_funds: sent,
    },

    {
      gasLimit: gas,
    }

  ).catch(e => {
    if (exit_on_fail) {
      h.exit(1, "send tx failed: ", e)
    } else {
      return `send tx failed: ${e}`
    }
  });

  // gas manangement
  if ((tx_resp as TxResponse).code != 0) {

    if (attempt_no > MAX_ATTEMPTS) {

      if (exit_on_fail)
      {
          h.exit(1, "too many failed attempts", tx_resp)
      } else {
          return `too many failed attempts ${(tx_resp as TxResponse).rawLog}`;
      }

    }

    let gas_used = (tx_resp as TxResponse).gasUsed;

    if (gas_used > Number(consts.GAS_LIMIT)) {

      let message = `cannot do tx: ${(tx_resp as TxResponse).rawLog}`;
      if (exit_on_fail) {
        h.exit(0, message);
      } else {
        return message;
      }
        
    }

    if (attempt_no == MAX_ATTEMPTS) {
      // final attempt
      return await send_tx(contractCodeHash, msg, sent, Number(consts.GAS_LIMIT), attempt_no+1, exit_on_fail);
    }

    return await send_tx(contractCodeHash, msg, sent, gas_used, attempt_no+1, exit_on_fail);
  }

  return tx_resp as TxResponse;
}
