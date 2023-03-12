
import * as consts from "./constants";
import * as query from "./queries";
import * as h from "./helpers";
import * as b from "neo-blessed";
import * as i from "./interfaces";


/******************************************************************************
show menu
******************************************************************************/

export async function show_menu(contractCodeHash): Promise<[number, number, string]> {


    consts.BOX.setContent('');

    let header = b.text({
      parent: consts.BOX,
      top: 0,
      left: 1,
      tags: true,
      content: 'Menu (scroll with up and down keys, enter to begin selection)'
    });
  
    let message = b.text({
      parent: consts.BOX,
      top: 2,
      left: 1,
      tags: true,
      content: 'select a game id'
    });
  
    let choice = 0;
    let choice_entry = 0;
    let choice_denom = '';
  
    let ready_to_join = false;

    let data = [ 
      ['{bold}game id{/}'.padEnd(15),'{bold}capacity{/}'.padEnd(22), '{bold}n-players{/}'.padEnd(15), 
      '{bold}ticket price{/}'.padEnd(15), '{bold}play mode{/}'  ],
      ['','','','',''],

      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
      ['-','-','-','-','-'],
    ]
  
    let dialog = b.box({
  
      parent: consts.SCREEN,
      top: 'center',
      left: 'center',
      width: '40%',
      height: '60%',
      align: 'left',
      content:'{green-fg}enter a game id{/}',
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
      // TODO focused: false,
    });
  
    consts.BOX.key('enter', async function() {
      dialog.hidden = !dialog.hidden;
      if (!dialog.hidden) {
        choice = parseInt(await h.get_input(dialog));
  
  
        if (isNaN(choice)) {
  
          message.content = `{red-fg}'${choice}' is not a valid game id{/}`
  
        } else if ( choice < 0 || choice > 26) {
  
          message.content = `{red-fg}${choice} is out of range{/}`
  
        } else {
  
          choice = choice;
  
          let pool_info_result : [i.IPoolInfo, boolean] = await query.pool_info(contractCodeHash, choice);        
          let p_info = pool_info_result[0];
          
  
          if (typeof(p_info) == "string") {
            message.content = `{red-fg}game ${choice} doesn't exist.{/}`
          } else if (!p_info.online) {
            message.content = `{red-fg}game ${choice} is offline.{/}`
          } else {
  
            let entry = parseInt(p_info.entry);
            let denom = p_info.denom;

            if (denom == "uscrt") {
              entry = Math.floor(entry/1e6)
              denom = "scrt"
            }
  
            let mode = ''
            switch (p_info.mode) {
              case 0:
                mode = "Human only"
                break;
              case 1:
                mode = "AI only"
                break;
              case 2:
                mode = "Mixed"
                break; 
            }
  
            dialog.set("align", "left");

            if (p_info.queue_len != 0) {

              dialog.content =
              `you will wait in queue sized ${p_info.queue_len}, game '${choice}'\ndetails:\n\n\tmode: {bold}${mode}{/}\n\tticket price: {bold}${entry}${denom}{/}\
              \n\t{bold}number of players: ${p_info.player_cap}{/}\n{green-fg}confirm?{/} (y/N) `

            } else {

              dialog.content =
              `you will join game '${choice}'\ndetails:\n\n\tmode: {bold}${mode}{/}\n\tticket price: {bold}${entry}${denom}{/}\
              \n\t{bold}number of players: ${p_info.player_cap}{/}\n{green-fg}confirm?{/} (y/N) `

            }

            consts.SCREEN.render()
            let confirm = await h.get_input(dialog);
            
            if (confirm == 'y') {
  
              choice_entry = Number(p_info.entry);
              choice_denom = p_info.denom;
  
              ready_to_join = true;
            } else {

              dialog.set("align", "center");
              dialog.content= '{green-fg}enter a game id{/}'
              
            }
  
          }
          
        }
        dialog.hidden = true;
      }
      consts.SCREEN.render();
    })
  
    let low_stakes_table_header = b.text({
      parent: consts.BOX,
      top: 4,
      left: 1,
      tags: true,
      content: ' low stakes games:'
    });
  
    let low_stakes_table = b.listtable({
      parent: consts.BOX,
      top: 5,
      left: 1,
      height: '70%',
      align: 'left',
      tags: true,
      data: [...data],
    });
  
  
    let standard_table_header= b.text({
      parent: consts.BOX,
      top: 17,
      left: 1,
      tags: true,
      content: ' standard stakes games:'
    });
  
    let standard_table = b.listtable({
      parent: consts.BOX,
      top: 18,
      left: 1,
      height: '70%',
      align: 'left',
      tags: true,
      data: [...data],
    });
  
    let high_stakes_table_header= b.text({
      parent: consts.BOX,
      top: 30,
      left: 1,
      tags: true,
      content: ' {white-fg}{red-bg}high stakes games:{/}'
    });
  
    let high_stakes_table = b.listtable({
      parent: consts.BOX,
      top: 31,
      left: 1,
      height: '70%',
      align: 'left',
      tags: true,
      data: [...data],
    });
  
    while (true) {

      if (ready_to_join) {
        break;
      }

      await Promise.all([
      h.generate_pool_table(contractCodeHash, 0, 9, low_stakes_table),
      h.generate_pool_table(contractCodeHash, 9, 18, standard_table),
      h.generate_pool_table(contractCodeHash, 18, 27, high_stakes_table),
      ]);

      consts.SCREEN.render();
      await h.sleep(3)
  
    }
  
    header.destroy();
  
    low_stakes_table_header.destroy();
    low_stakes_table.destroy();
  
    standard_table_header.destroy();
    standard_table.destroy();
  
    high_stakes_table_header.destroy();
    high_stakes_table.destroy();
  
    message.destroy();
    dialog.destroy();

    consts.BOX.focus();
    consts.BOX.unkey('enter', ()=>{})
    consts.SCREEN.render();
  
    return [choice, choice_entry, choice_denom]; 
  }
  