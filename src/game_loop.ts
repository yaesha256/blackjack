import * as consts from "./constants";
import * as query from "./queries";
import * as h from "./helpers";
import * as b from "neo-blessed";
import * as i from "./interfaces";
import * as tx from "./transactions";
import * as fs from "fs";
import updateDotenv from "update-dotenv";




/******************************************************************************
play_ace
******************************************************************************/
async function play_ace(value) : Promise<number> {

    while (true) {
  
      let c = await h.get_input(consts.BOX);
  
      if (c == 'c')
          return value
      else if (c == 'd')
          return value + 52 
      else if (c == 's')
          return value + (52 * 2)
      else if (c == 'h')
          return value + (52 * 3)
      else if (c == 'Q') {
        await h.exit(0, "you quit.");
      }
  
    }    
  }
  
  /******************************************************************************
  play_turn
  ******************************************************************************/
  
  async function play_turn(
    info,
    top_card_data,
    contractCodeHash, 
    header, 
    subheader, 
    table, 
    alloc : i.IAllocation) {
  
    let hand_result = await query.hand_info(contractCodeHash, alloc.instance_id);
  
    if (!hand_result[1]) {
      await h.exit(1, "failed to get hand data", hand_result[0])
    }
  
    let handInfo = hand_result[0] as i.IHandInfo;
    if( handInfo.msg !== "success") {
      await h.show_alert("Invalid viewing key. Generate a new one in the settings menu.");
      await consts.settings_menu();
      hand_result = await query.hand_info(contractCodeHash, alloc.instance_id);
      handInfo = hand_result[0] as i.IHandInfo;
      if (handInfo.msg !== "success") {
        h.exit(1, "error:\n", handInfo);
      }
    }

    const gameStatus = info.status;

    h.generate_header(info, top_card_data, "{green-fg}it's your turn!{/}", header, subheader);
    
    let hand = [...handInfo.hand]
    let chain :number[] = []
  
    let message = b.text({
      parent: consts.BOX,
      bottom: 0,
      left: 1,
      tags: true,
      content: "enter an index, or (d)one, (r)eset, (Q)uit, (+) settings."
    });
    
    while (true) {
    
      h.generate_table(info, alloc.index, chain, hand, table);
      consts.SCREEN.render();
  
      let c = await h.get_input(consts.BOX);

      if (c == '+') {
        await consts.settings_menu();
      }
  
      if (c == 'r') {
        hand = [...handInfo["hand"]]
        chain = []
        continue;
      }
  
      if (c == 'd') {

        message.setContent("sending...")
        consts.SCREEN.render();
        let play_tx = await tx.send_tx(contractCodeHash, { play_turn: {cards: chain, instance_id: alloc.instance_id} }, [], 55_000,0, false );

        if (typeof play_tx === "string" ) {
          await h.show_alert(play_tx);
          continue;
        }
      
        message.setContent("{green-fg}sent!{/}")
        consts.SCREEN.render();
        message.setContent('');
        break;
      }
  
      if (c == 'Q') {
        await h.exit(0, 'you quit.')
      }
  
      let idx = parseInt(c)
      if (isNaN(idx) || idx >= hand.length) {
        message.setContent("{red-fg}Please enter a valid index, or (d)one, (r)eset, (Q)uit, (+) settings.{/}");
        continue;
      }
  
        let top_card_data = [];
        let history_rev = [...info.history];
        history_rev.reverse();
      
        for (const datum of history_rev) {
          if (datum[0]<7 || datum[0] ==255) {
            top_card_data = datum;
            break;
          }
        }
    
       let validate_result = h.validate_card(hand[idx], chain, top_card_data[1], gameStatus)
  
      if (!validate_result[0]) {
        message.setContent("{red-fg}" + validate_result[1] + "{/}")
        continue;
      }
  
      // update chain
      let card_num = hand[idx]
      if (h.translate_card(card_num)[1] == 0){
        message.setContent("choose a suit to request: (c)lubs (d)iamonds (s)pades (h)earts, (Q)uit, (+) settings.")
        consts.SCREEN.render();
        let ace_value = await play_ace(card_num);
        chain.push( ace_value )
      }
      else
          chain.push( card_num )
        
      // update hand
      if ( hand.length != 0)
          hand.splice(idx,1)
  
      // restore the message
      message.setContent("enter an index, or (d)one, (r)eset, (Q)uit.")
    }

    message.destroy();
  }
  
  /******************************************************************************
  game_loop
  ******************************************************************************/
  
  export async function game_loop(contractCodeHash, pool_id) {

    consts.BOX.setContent('');
  
    let header = b.text({
      parent: consts.BOX,
      top: 0,
      left: 1,
      tags: true,
      content: ''
    });
  
    let subheader = b.text({
      parent: consts.BOX,
      top: 1,
      left: 1,
      tags: true,
      content: ''
    });
  
    let table = b.listtable({
      parent: consts.BOX,
      top: 3,
      left: 1,
      height: '70%',
      align: 'left',
      tags: true,
    });
  
    let alloc_result : [i.IAllocation, boolean] = await query.allocation(contractCodeHash);
  
    if (!alloc_result[1]) {
      await h.exit(1, `lost connection to game`, alloc_result[0]);
    }
  
    let alloc = alloc_result[0];
    let your_idx = alloc.index;
  
    updateDotenv({
      INSTANCE_ID: alloc.instance_id
    });
  
    let winner_alias = '';
    let winner = 255;
    
    let info : i.IGameInfo;
    let top_card_data : Number[] = [];

    let timer_text = b.text({
      parent: consts.BOX,
      top: 0,
      right: 4,
      tags: true,
      content: 'timer text here'
    });

    const timer = new h.Timer(contractCodeHash, alloc, timer_text);
    timer.begin();
  
    do {
  
      let info_result = await query.game_info(contractCodeHash, alloc.instance_id, pool_id);

      if (!info_result[1]) {
        await h.exit(1, `lost connection to game`, info_result[0]);
      }
    
      info = info_result[0] as i.IGameInfo;
  
      if ( info.over ) {
        winner_alias = info.players[info.winner].username;
        winner = info.winner;
        break;
      }

      top_card_data = [];
      for (var j = info.history.length - 1; j >= 0; j--) {
        let datum = info.history[j];
        if (datum[0]<7 || datum[0] ==255) {
          top_card_data = datum;
          break;
        }
      }
        
      let turn_alias = info.players[info.turn].username
      if ( info.turn == alloc.index ) {


        consts.BOX.style.border.fg = '#00FF00';
        consts.SCREEN.render();
        await h.sleep(0.1)
        consts.BOX.style.border.fg = '#F0F0F0';
        consts.SCREEN.render();
        await h.sleep(0.1)
        consts.BOX.style.border.fg = '#00FF00';
        consts.SCREEN.render();
        await h.sleep(0.1)
        consts.BOX.style.border.fg = '#F0F0F0';
        consts.SCREEN.render();

        await play_turn(info, top_card_data, contractCodeHash, header, subheader, table, alloc)
  
      } else {

        // spectating
        let hand_result: [i.IHandInfo, boolean] = await query.hand_info(contractCodeHash, alloc.instance_id)
        if (!hand_result[1]) {
          await h.exit(1, `failed to fetch hand`, hand_result[0]);
        }
        let hand = hand_result[0];
  
        h.generate_header(info, top_card_data, "it's " + turn_alias + "'s turn", header, subheader);
        h.generate_table(info, alloc.index, [], hand.hand, table);
        consts.SCREEN.render();
        
      }
  
      await h.sleep(3)
    } while (true) 

    timer.stop();
    consts.BOX.set('align', 'center');
  
    // handle game result
    if (winner == your_idx) {

      header.destroy();
      subheader.destroy();
      table.destroy();

      consts.BOX.setContent("{green-fg}you won!{/}\nclaim prize now? (Y/n)");
      consts.SCREEN.render()
      let c = await h.get_input(consts.BOX);
      
  
      if (c != 'n' && c != 'N') {
  
        consts.BOX.setContent("claiming prize...");
        consts.SCREEN.render();
        let claim_tx = await tx.send_tx(contractCodeHash, { claim_prize: { instance_id: alloc.instance_id}},[], 66_000, 0, false );
        
        if (typeof claim_tx === "string" ) {
          await h.show_alert(claim_tx);
          h.exit(1, "Could not perform claim tx, try again later, or await release.")
        }

        let date_str = new Date().toLocaleString('en-GB');
        date_str = date_str.replace(/\//g, '-');
        date_str = date_str.replace(/ /g, '-');
        date_str = date_str.replace(/,/g, '-');
        date_str = date_str.replace(/:/g, '-');
        
        let receipt_dir = "./receipts"
        if (!fs.existsSync(receipt_dir)) {    
          fs.mkdirSync(receipt_dir);
        }
  
        let file_path = receipt_dir+"/claim-prize-"+date_str;
        let claim_data = JSON.stringify(claim_tx);
  
        fs.writeFile(file_path, claim_data, async function(err) {
          if(err) {
            await h.exit(1, "failed to save receipt: ",err);
          }
        });
        
        consts.BOX.setContent("{green-fg}sent!{/}\n receipt saved in file:\n"+ file_path);
        consts.SCREEN.render();
  
      } else {
        consts.BOX.setContent("prize remains unclaimed.");
        consts.SCREEN.render();
      }
  
    } else {

      if (!i.isGameInfo(info)) {
        await h.exit(1, `lost connection to game`, info);
      }

      top_card_data = [];
      for (var j = info.history.length - 1; j >= 0; j--) {
        let datum = info.history[j];
        if (datum[0]<7 || datum[0] ==255) {
          top_card_data = datum;
          break;
        }
      }

      h.generate_header(info, top_card_data, "winner was " + winner_alias, header, subheader);
      h.generate_table(info, alloc.index, [], [], table);
      consts.SCREEN.render();

      
    }

    await h.sleep(5);

    header.destroy();
    subheader.destroy();
    table.destroy();
    timer_text.destroy();

    consts.BOX.setContent( "winner was " + winner_alias + '\n\nback to menu? (Y/n)')
    consts.SCREEN.render();
    let input = await h.get_input(consts.BOX);
    if (input == 'n' || input == 'N') {
      h.exit(0, 'game over');
    }
  }
  