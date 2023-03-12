import * as consts from "./constants";
import * as query from "./queries";
import * as tx from "./transactions";
import * as  h from "./helpers";
import * as i from "./interfaces";
import updateDotenv from "update-dotenv";
import { game_loop } from "./game_loop";
import { QueryCodeHashResponse } from "secretjs/dist/grpc_gateway/secret/compute/v1beta1/query.pb";
import { show_menu } from "./menu";
import { wait_start } from "./waiting"


/******************************************************************************
entry_point
******************************************************************************/

const entry_point = async () => {

  const CODE_HASH = (await consts.SECRETCLI[0].query.compute.codeHashByCodeId({code_id: String(consts.CODE_ID)})
    .catch(async e => { await h.exit(1,"failed to get code hash: ", e)}) as QueryCodeHashResponse).code_hash as string;

  await updateDotenv(
    {
      CODE_HASH : CODE_HASH
    }
  )

  let alloc_result : [i.IAllocation, boolean] = await query.allocation(CODE_HASH);
  let is_allocated = alloc_result[1];
  let pool_id = 255;
  let gameInfo_result = (await query.game_info(CODE_HASH, alloc_result[0].instance_id));
  let in_queue = is_allocated && consts.INFO_IN_A_QUEUE.test(alloc_result[0].instance_id);
  let in_live = is_allocated && gameInfo_result[1];
  let in_completed = in_live && (gameInfo_result[0] as i.IGameInfo).winner!=255;
  let in_pending = is_allocated && !in_queue && !in_live;
  let due_to_claim = in_live && 
    (gameInfo_result[0] as i.IGameInfo).winner == alloc_result[0].index

  if ( !is_allocated || (in_completed && !due_to_claim)) {
    
    let ready = false;
    while (!ready) {    
      consts.BOX.setContent("loading...");
      consts.SCREEN.render();

      let result = await show_menu(CODE_HASH);

      pool_id = result[0];
      let entry = result[1];
      let denom = result[2];

      consts.BOX.setContent("joining game...");
      consts.SCREEN.render();

      let join_tx = await tx.send_tx(CODE_HASH, { join_game: {
        pool_id, 
        lucky_phrase: consts.LUCKY_PHRASE, 
        as_human: consts.AS_HUMAN} },
        [{ amount: String(entry), denom: denom }], 55_000, 0, false);


        if (typeof join_tx === "string" ) {
          await h.show_alert(join_tx);
          continue;
        }
      
      consts.BOX.content = '';
      updateDotenv({
        POOL_ID: String(pool_id)
      });

      ready = await wait_start(CODE_HASH);

    }
    
    await game_loop(CODE_HASH, pool_id)
    
  } else {
    pool_id = alloc_result[0].pool_id;
  }

  if (in_pending || in_queue) {
    await wait_start(CODE_HASH);
  }
  consts.SCREEN.render();
  await game_loop(CODE_HASH, pool_id)
  
}

const main_loop = async () => {
  while (true) {
    await entry_point();
  }
}

main_loop();



