
import * as consts from "./constants";
import * as query from "./queries";
import * as h from "./helpers";
import * as b from "neo-blessed";
import * as i from "./interfaces";
import * as fs from "fs";
import * as tx from "./transactions";

/******************************************************************************
wait start 
******************************************************************************/

export async function wait_start(contractCodeHash) {

    consts.BOX.setContent('');
    let left = false;
    
    let header = b.text({
      parent: consts.BOX,
      top: 0,
      left: 1,
      tags: true,
      content: ' waiting... (\'l\' to leave game)'
    });
  
    let message = b.text({
      parent: consts.BOX,
      top: 3,
      left: 1,
      tags: true,
      content: ''
    });

    let alloc_result : [i.IAllocation, boolean ] = await query.allocation(contractCodeHash);
  
    if (!alloc_result[1]) {
      return !left;
    }

    let alloc = alloc_result[0];
    let pool_id = alloc.pool_id;

    let dialog = b.box({
      parent: consts.SCREEN,
      top: 'center',
      left: 'center',
      width: '40%',
      height: '40%',
      align: 'center',
      content:'leave game? y/N',
      tags: true,
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#f0f0f0'
        },
      },
      keys: true,
      vi: true,
      hidden: true,
    });
  
    consts.BOX.key('l', async function() {
      dialog.hidden = !dialog.hidden;
      if (!dialog.hidden) {
        let yesno = await h.get_input(dialog);
        if (yesno == 'y' || yesno == 'Y') {

          dialog.content = 'leaving game...';
          consts.SCREEN.render();

          let leave_tx = await tx.send_tx(contractCodeHash, { leave_game: {pool_id: pool_id} },[], 55_000, 0, false);
          if (typeof leave_tx === "string" ) {
            await h.show_alert(leave_tx);
            return;
          }

          let receipt_dir = "./receipts"
          if (!fs.existsSync(receipt_dir)) {    
              fs.mkdirSync(receipt_dir);
          }
  
          let date_str = new Date().toLocaleString('en-GB');
          date_str = date_str.replace(/\//g, '-');
          date_str = date_str.replace(/ /g, '-');
          date_str = date_str.replace(/,/g, '-');
          date_str = date_str.replace(/:/g, '-');
  
          let file_path = receipt_dir+"/refund-"+date_str;
          let refund_data = JSON.stringify(leave_tx, null, 4);
  
          fs.writeFile(file_path, refund_data, async function(err) {
          if(err) {
              await h.exit(1, "failed to save receipt: ",err);
            }
          });
  
          dialog.content = "receipt saved in file:\n"+ file_path;
          consts.SCREEN.render();
          left = true;
          await h.sleep(5);
        }
        dialog.hidden = true;
      }
      consts.SCREEN.render();
  
    })


    let n_more = 255;
  
    while (n_more !== 0 && !left) {

      let alloc_result : [i.IAllocation, boolean ] = await query.allocation(contractCodeHash);
  
      if (!alloc_result[1] && !left) {
        continue;
      }
  
      let alloc = alloc_result[0];
    
      if (consts.INFO_IN_A_QUEUE.test(alloc.instance_id)) {
  
        let message_str = 'you are in the queue...';
        message.content = message_str;
        pool_id = alloc.pool_id;
      
      
      } else {
  
        let gameInfo_result :  [i.IGameInfo, boolean ] = await query.game_info(contractCodeHash, alloc.instance_id, alloc.pool_id);
  
        if (!gameInfo_result[1]) {
          return !left;
        }
  
        let gameInfo = gameInfo_result[0];
  
        n_more = h.capacity_by_pool_id(gameInfo.pool_id) - gameInfo.players.length;
        let message_str ='players: '
        for (const [idx, player] of gameInfo.players.entries()) {
          let player_username = player.username;

          if (idx == alloc.index) {
            player_username = `{blue-fg}${player_username}{/}`
          }

          message_str += `\n\t${player_username}`;
        }
        message.content = 
          `\n\nwaiting for ${n_more} more player` + 
          (n_more == 1? '\n\n' : 's\n\n') + 
          message_str;
      }
      
      consts.SCREEN.render()
      await h.sleep(3);
  
    }

    header.destroy();
    message.destroy();
    dialog.destroy();

    consts.BOX.focus();
    consts.BOX.unkey('enter', ()=>{})
    consts.SCREEN.render();
    return !left;
  
  }
  
  