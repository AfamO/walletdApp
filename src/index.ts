import { createApp } from "@deroll/app";
import { createWallet } from "@deroll/wallet";
import { getAddress, hexToString, stringToHex } from "viem";

const app = createApp({url: process.env.ROLLUP_HTTP_SERVER_URL || 'htttp://127.0.0.1:5004'});

const wallet = createWallet()
app.addAdvanceHandler(wallet.handler);

app.addAdvanceHandler( async({metadata, payload}) =>{
  console.log("Input::", metadata, payload)
  const sender = getAddress(metadata.msg_sender);

  try {
    const jsonPayload = JSON.parse(hexToString(payload));
    if(jsonPayload.method === 'either_withdraw') {
      console.log("withdrawing either");
      const amountToWithdraw : bigint = BigInt(jsonPayload.amount);
      const voucher = wallet.withdrawEther(sender, amountToWithdraw);
      await app.createVoucher(voucher);
      
      return "accept";

    }

  } catch(e) {
    app.createReport({payload: stringToHex(String(e))});
    
    return "reject";
  }
  return "accept";
});

app.addInspectHandler( async({payload})=>{
const url = hexToString(payload).split("/") //rollup/balance/address
console.log("Inspect call:", url);
const etherBalance = wallet.etherBalanceOf(<string>url[1]);
await app.createReport({payload : stringToHex(String(etherBalance))});
})

app.start().catch((e)=>{
  console.error(e);
  process.exit(1);
})