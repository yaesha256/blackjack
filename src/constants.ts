

/// BEGIN AUTOGEN METADATA 
export declare const BLACKJACK_VERSION : string;
export declare const CONTRACT_ADDRESS : string;
export declare const CODE_ID : number;
/// END AUTOGEN


/******************************************************************************
DOTENV Variables
******************************************************************************/

import * as dotenv from "dotenv"
dotenv.config({ override: true });

export const INSTANCE_ID         = process.env.INSTANCE_ID;
export const AS_HUMAN            = process.env.AS_HUMAN == 'true';
export const LUCKY_PHRASE        = process.env.LUCKY_PHRASE;
export const POOL_ID             = process.env.POOL_ID;
export const GAS_LIMIT           = process.env.GAS_LIMIT;

/******************************************************************************
REGEXES
******************************************************************************/ 

// common errors
export const ERR_GENERIC                 = new RegExp("Generic error:")
export const ERR_INSTANCE_IS_OFFLINE     = new RegExp("Instance is offline.");
export const ERR_ITEM_DOES_NOT_EXIST     = new RegExp("Item doesn't exist");
export const ERR_GAME_IS_OVER            = new RegExp("Game is over.")

// pool errors
export const ERR_POOL_NOT_FOUND          = new RegExp("Pool not found");

// join_game errors
export const ERR_PLAYER_ALREADY_JOINED   = new RegExp("Player has already joined as");
export const ERR_GAME_IS_AI_ONLY         = new RegExp("Game is AI only");
export const ERR_GAME_IS_HUMAN_ONLY      = new RegExp("Game is human only");
export const ERR_ALIAS_IS_IN_USE         = new RegExp("Alias is already in use.");
export const ERR_BANNED                  = new RegExp("Banned! \\:\\(");

// info in a queue
export const INFO_IN_A_QUEUE             = new RegExp("0{64}");

// tx errors
export const ERR_OUT_OF_GAS              = new RegExp("out of gas");

// patterns
export const PATTERN_GAS_USED            = new RegExp("gasUsed:[' ']+([0-9]+):");

/******************************************************************************
Secret
******************************************************************************/

import { Wallet, SecretNetworkClient, TxResponse } from "secretjs";

export const WALLET    = new Wallet(process.env.MNEMONIC);

/// BEGIN AUTOGEN CLIENT_ENDPOINTS
export declare const SECRETCLI : SecretNetworkClient[];
/// END AUTOGEN

/******************************************************************************
Terminal
******************************************************************************/

import * as BLESSED  from "neo-blessed";

export const SCREEN  = BLESSED.screen({
  smartCSR: true
});

SCREEN.title = "Blackjack "+ BLACKJACK_VERSION;

SCREEN.key(['escape', 'C-c'], function(ch, key) {
  SCREEN.destroy()
  return process.exit(0);
});


export const BOX = BLESSED.box({
  parent: SCREEN,
  top: 'center',
  left: 'center',
  width: 100,
  height: '90%',
  content:'',
  tags: true,
  padding: {
    left: 4,
    right: 4,
    top: 3,
    bottom: 3
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
    alwaysScroll:true,
    scrollable: true,
    scrollbar: {
      style: {
        bg: 'yellow'
      }
    }
});


export const ALERT = BLESSED.box({
  parent: SCREEN,
  top: 'center',
  left: 'center',
  width: '80%',
  height: '80%',
  align: 'center',
  content:'',
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


/******************************************************************************
settings
******************************************************************************/


import { get_input, show_alert, exit } from "./helpers";
import { pool_info, name_of_addr } from "./queries";
import * as fs from "fs";


import updateDotenv from "update-dotenv";

const SETTINGS = BLESSED.box(
  {
    parent: SCREEN,
    top: 'center',
    left: 'center',
    width: 90,
    height: '80%',
    align: 'center',
    content:'',
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

async function settings_data() {

  let username = 'none set'
  let username_info = await name_of_addr(process.env.CODE_HASH);
  if (!username_info[1]) {
    if (ERR_ITEM_DOES_NOT_EXIST.test(username_info[0])) {
      username = 'none set'
    } else {
      username = 'could not get'
      await show_alert("could not get username, is the viewing key correct?", username_info[0]);
    }

  } else {
    username = username_info[0].username;
  }

  return [
    ['','','Settings',],
    ['','','',],
    ['{bold}index{/}','{bold}action{/}','{bold}current value{/}',],
    ['','','',],
    ['0)','generate viewing key',process.env.VIEWING_KEY,],
    ['1)','set username', username],
    ['2)','toggle unicode symbols', process.env.SYMBOLIC_TERM,],
  ]
}

const SETTINGS_TABLE = BLESSED.listtable({
  parent: SETTINGS,
  top: 4,
  left: 1,
  height: '70%',
  align: 'left',
  tags: true,
  data: [],
});

let SETTINGS_MESSAGE = BLESSED.text({
  parent: SETTINGS,
  top: 1,
  left: 1,
  tags: true,
  content: 'enter an index'
});


async function generate_vk() : Promise<[any, boolean]> {

  let entropy = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < charactersLength) {
    entropy += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  let set_vk_result = await SECRETCLI[0].tx.compute.executeContract(
    {
      sender: WALLET.address,
      contract_address: CONTRACT_ADDRESS,
      code_hash: process.env.CODE_HASH,
      msg: {set_viewing_key: { key: entropy }},
    },
    {
      gasLimit: 50_000,
    }
  ).catch(e => show_alert("generate viewing key failed: ", e)) as TxResponse;


  if (set_vk_result.arrayLog) {

    const new_vk = set_vk_result.arrayLog[6].value;

    await updateDotenv({
      VIEWING_KEY : new_vk
    });

    return ['', true]

  }

  return [set_vk_result, false];
  
};

async function set_username() : Promise<[any, boolean]> {

  // cost of username is the same as pool 1 ticket price
  const p_info_result = (await pool_info(process.env.CODE_HASH, 1));
  if (!p_info_result[1]) {
    return ['could not fetch cost data', false];
  }
  const cost = p_info_result[0].entry;
  const denom = p_info_result[0].denom;

  let cost_str= String(cost);
  let denom_str= String(denom);

  if (denom == 'uscrt'){
    denom_str = 'scrt';
    cost_str = String(Number(cost) / 1e6);
  }

  SETTINGS_MESSAGE.setContent(`reserving a username costs ${cost_str}${denom_str}, proceed? (y/N)`);
  SCREEN.render();
  const should_proceed = await get_input(SETTINGS);

  if (should_proceed != "y" && should_proceed !="Y") {
    return ['action cancelled', false];
  }

  SETTINGS_MESSAGE.setContent("{blue-fg}enter a username{/}");
  SCREEN.render();

  const value = await get_input(SETTINGS);

  SETTINGS_MESSAGE.setContent("setting username...");
  SCREEN.render();


  let set_username_result = await SECRETCLI[0].tx.compute.executeContract(
    {
      sender: WALLET.address,
      contract_address: CONTRACT_ADDRESS,
      code_hash: process.env.CODE_HASH,
      msg: {set_username: { username: value }},
      sent_funds: [{ amount: cost, denom: denom }]
    },
    {
      gasLimit: 50_000,
    }
  ).catch(e => show_alert("set username failed: ", e)) as TxResponse;

  if (set_username_result && set_username_result.code == 0) {

    await updateDotenv({
      USERNAME : value
    });


    let receipt_dir = "./receipts"
          if (!fs.existsSync(receipt_dir)) {    
              fs.mkdirSync(receipt_dir);
          }
  
          let date_str = new Date().toLocaleString('en-GB');
          date_str = date_str.replace(/\//g, '-');
          date_str = date_str.replace(/ /g, '-');
          date_str = date_str.replace(/,/g, '-');
          date_str = date_str.replace(/:/g, '-');
  
          let file_path = receipt_dir+"/username-buy-"+date_str;
          let refund_data = JSON.stringify(set_username_result, null, 4);
  
          fs.writeFile(file_path, refund_data, async function(err) {
          if(err) {
              await exit(1, "failed to save receipt: ",err);
            }
          });
  
          await show_alert ("receipt saved in file:\n"+ file_path);

    return ['', true]

  }

  return [set_username_result, false];

}

async function toggle_symbolic(): Promise<[any, boolean]> {

  let new_val = 'true'
  if (process.env.SYMBOLIC_TERM == 'true') {
    new_val = 'false'
  }

  await updateDotenv({
      SYMBOLIC_TERM: new_val
  });

  SCREEN.render();
  return ['', true];

}

const SETTINGS_MAP = {};
SETTINGS_MAP["0"] = generate_vk;
SETTINGS_MAP["1"] = set_username;
SETTINGS_MAP["2"] = toggle_symbolic;


export async function settings_menu () {
  SETTINGS.hidden = !SETTINGS.hidden;

  if (!SETTINGS.hidden) {
    
    SETTINGS_TABLE.setData((await settings_data() as string[][]));

    SETTINGS.setFront();
    SCREEN.render();

    let ready_to_close = false;
    while (!ready_to_close) {

      let setting = await get_input(SETTINGS);

      if (setting === 'q') {
        break;
      }

      if (!(setting in SETTINGS_MAP)) {
        SETTINGS_MESSAGE.setContent('not a valid setting index (enter \'q\' to quit settings)');
        SCREEN.render();
        continue;
      }

      let func = SETTINGS_MAP[setting];

      SETTINGS_MESSAGE.setContent(`running '${SETTINGS_TABLE.rows[Number(setting)+4][1]}'...`);
      SCREEN.render();

      let result = (await func() as [any, boolean]);
      
      if (!result[1]) {
        if (result[0].rawLog) {
          SETTINGS_MESSAGE.setContent(result[0].rawLog);
        } else {
          SETTINGS_MESSAGE.setContent(`failed: ${result[0]}`);
        }
        SCREEN.render();
        continue;
      }

      SETTINGS_MESSAGE.setContent("{green-fg}done!{/} enter 'q' to quit settings.");
      SETTINGS_TABLE.setData((await settings_data() as string[][]));
      SCREEN.render();
    }

    SETTINGS.hidden = true;
    SETTINGS.setBack();

  }

  BOX.focus();
  SCREEN.render();
}


SCREEN.key(['+'], settings_menu);


