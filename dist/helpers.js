"use strict";
/******************************************************************************

BLACKJACK FRONTEND v0.0.0-alpha.rc.7
AUTOGENERATED HELPERS.TS FILE

CREATED:        12 March 2023
AUTHOR:         YAESHA256
AFFILIATIONS:   AART
                                                                               
******************************************************************************/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_pool_table = exports.validate_card = exports.generate_table = exports.generate_header = exports.translate_card = exports.exit = exports.sleep = exports.capacity_by_pool_id = exports.get_input = exports.show_alert = exports.Timer = void 0;
const consts = __importStar(require("./constants"));
const update_dotenv_1 = __importDefault(require("update-dotenv"));
const b = __importStar(require("neo-blessed"));
const query = __importStar(require("./queries"));
/******************************************************************************
timer
******************************************************************************/
class Timer {
    constructor(contractCodeHash, alloc, text_area) {
        this.contractCodeHash = contractCodeHash;
        this.alloc = alloc;
        this.text_area = text_area;
        this.running = true;
    }
    begin() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.running) {
                const info_result = yield query.game_info(this.contractCodeHash, this.alloc.instance_id, this.alloc.pool_id);
                if (!info_result[1]) {
                    yield exit(1, `lost connection to game`, info_result[0]);
                }
                const info = info_result[0];
                const expiration = Number(info.turn_ends_at) - (Date.now() / 1000);
                if (expiration < 0) {
                    this.text_area.setContent(`{red-fg}out of time{/}`);
                    consts.SCREEN.render();
                    return;
                }
                let mins = Math.floor(expiration / 60);
                let secs = Math.floor(expiration % 60);
                let text = mins == 0 ? `{red-fg}${mins}m ${secs}s{/}`.padEnd(7)
                    : `${mins}m ${secs}s`.padEnd(7);
                if (mins == secs && secs == 0) {
                    text = `{red-fg}out of time{/}`;
                }
                this.text_area.setContent('time left: ' + text);
                consts.SCREEN.render();
                yield sleep(0.5);
            }
        });
    }
    stop() {
        this.running = false;
    }
}
exports.Timer = Timer;
/******************************************************************************
shutdown
******************************************************************************/
function shutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, update_dotenv_1.default)({
            POOL_ID: ''
        });
        yield (0, update_dotenv_1.default)({
            INSTANCE_ID: ''
        });
        consts.BOX.destroy();
        consts.SCREEN.destroy();
    });
}
/******************************************************************************
show error
******************************************************************************/
function show_alert(message, obj = null) {
    return __awaiter(this, void 0, void 0, function* () {
        if (obj !== null) {
            message += "\n\n" + JSON.stringify(obj);
        }
        consts.ALERT.content = message + "\n\nPress enter to continue";
        consts.ALERT.hidden = false;
        consts.ALERT.setFront();
        consts.ALERT.focus();
        consts.SCREEN.render();
        yield get_input(consts.ALERT);
        consts.ALERT.content = "";
        consts.ALERT.setBack();
        consts.ALERT.hide();
        consts.SCREEN.render();
    });
}
exports.show_alert = show_alert;
/******************************************************************************
get input
******************************************************************************/
function get_input(parent) {
    // add prompt to consts.SCREEN
    //@ts-ignore
    var prompt = b.prompt({
        parent: parent,
        height: 1,
        width: 40,
        bottom: 5,
        left: 0,
        tags: true,
        keys: true,
        vi: true,
    });
    // remove text colour and hide buttons
    // @ts-ignore
    prompt.children[0].style.bg = '';
    // @ts-ignore
    prompt.children[1].hidden = true;
    // @ts-ignore
    prompt.children[2].hidden = true;
    prompt.key(['escape', 'C-c'], function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield exit(0, "exited");
        });
    });
    return new Promise(resolve => prompt.input('', '', (err, ans) => {
        prompt.destroy();
        consts.SCREEN.render();
        if (!err && ans) {
            resolve(ans);
        }
        else {
            resolve('');
        }
    }));
}
exports.get_input = get_input;
/******************************************************************************
capacity_by_pool_id
******************************************************************************/
function capacity_by_pool_id(pool_id) {
    let remainder = pool_id % 3;
    let capacity = 0;
    switch (remainder) {
        case 0:
            capacity = 2;
            break;
        case 1:
            capacity = 4;
            break;
        case 2:
            capacity = 7;
            break;
    }
    return capacity;
}
exports.capacity_by_pool_id = capacity_by_pool_id;
/******************************************************************************
sleep
******************************************************************************/
function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}
exports.sleep = sleep;
/******************************************************************************
exit
******************************************************************************/
function exit(code, msg, err = null) {
    return __awaiter(this, void 0, void 0, function* () {
        process.on('exit', function () {
            consts.SCREEN.destroy();
            console.error(msg);
            if (err !== null)
                console.error(err);
        });
        yield shutdown();
        process.exit(code);
    });
}
exports.exit = exit;
/******************************************************************************
translate_card convert card number to suit and num
******************************************************************************/
function translate_card(value) {
    let quot = Math.floor(value / 13);
    let rem = value % 13;
    let suit = 0;
    if (quot == 0 || quot == 4 || quot == 8 || quot == 12) {
        suit = 0;
    }
    else if (quot == 1 || quot == 5 || quot == 9 || quot == 13) {
        suit = 1;
    }
    else if (quot == 2 || quot == 6 || quot == 10 || quot == 14) {
        suit = 2;
    }
    else if (quot == 3 || quot == 7 || quot == 11 || quot == 15) {
        suit = 3;
    }
    return [suit, rem];
}
exports.translate_card = translate_card;
/******************************************************************************
translate_card_print convert card number to display friendly card
******************************************************************************/
function translate_card_print(card) {
    const SYMBOLIC_TERM = process.env.SYMBOLIC_TERM == 'true';
    let suit_num = translate_card(card);
    let suit = suit_num[0];
    let num = suit_num[1];
    let suit_str = "";
    if (suit == 0)
        suit_str = (SYMBOLIC_TERM ? "\u2667" : "cl".padEnd(2));
    else if (suit == 1)
        suit_str = '{red-fg}' + (SYMBOLIC_TERM ? "\u2662" : "di".padEnd(2)) + '{/}';
    else if (suit == 2)
        suit_str = (SYMBOLIC_TERM ? "\u2664" : "sp".padEnd(2));
    else
        suit_str = '{red-fg}' + (SYMBOLIC_TERM ? "\u2661" : "he".padEnd(2)) + '{/}';
    let num_str = "";
    if (num == 0)
        num_str = "ace";
    else if (num == 10)
        num_str = (suit == 0 || suit == 2) ? "{bold}jack{/}" : "jack";
    else if (num == 11)
        num_str = "queen";
    else if (num == 12)
        num_str = "king";
    else
        num_str = String(num + 1);
    return [suit_str, num_str];
}
/******************************************************************************
generate_header
******************************************************************************/
function generate_header(info, top_card_data, cornerMsg, header, subheader) {
    const SYMBOLIC_TERM = process.env.SYMBOLIC_TERM == 'true';
    let game_status = info.status;
    header.setContent(cornerMsg);
    let next_line_str = '';
    if (game_status[0] == 'p') {
        let n_pickup = parseInt(game_status.slice(2));
        next_line_str = "status: {red-bg}{white-fg}pickup " + n_pickup + "{/}" + (info.reverse ? " R" : "  ");
    }
    else if (game_status[0] == 's') {
        let req = game_status[2];
        if (req == '0') {
            req = (SYMBOLIC_TERM ? "\u2667" : "cl");
        }
        else if (req == '1') {
            req = '{red-fg}' + (SYMBOLIC_TERM ? "\u2662" : "di") + '{/}';
        }
        else if (req == '2') {
            req = (SYMBOLIC_TERM ? "\u2664" : "sp");
        }
        else {
            req = '{red-fg}' + (SYMBOLIC_TERM ? "\u2661" : "he") + '{/}';
        }
        next_line_str = "status: {blue-bg}{white-fg}suit " + req + "{/}" + (info.reverse ? " R" : "  ");
    }
    else {
        next_line_str = "status: normal" + (info.reverse ? " R" : "  ");
    }
    let last_player = (top_card_data[0] != 255) ? info.players[top_card_data[0]].username : "game";
    let suit_num = translate_card_print(top_card_data[1]);
    let suit = suit_num[0];
    let num = suit_num[1];
    next_line_str =
        next_line_str.padEnd(28)
            + " top card:{bold} '"
            + suit.padEnd(SYMBOLIC_TERM ? 1 : 2)
            + ' ' + num
            + "'" + "{/} by " + last_player;
    subheader.setContent(next_line_str);
}
exports.generate_header = generate_header;
/******************************************************************************
generate_table
******************************************************************************/
function generate_table(info, index, chain, hand, table) {
    const BOX_HEIGHT = consts.BOX.height;
    const SYMBOLIC_TERM = process.env.SYMBOLIC_TERM == 'true';
    let data = [['{blue-fg}your hand{/}'.padEnd(25), '{green-fg}chain{/}'.padEnd(25), '  player'.padEnd(15), 'n-cards', 'H/B', 'card history'.padEnd(25)], ['', '', '', '', '', '']];
    for (let i = 0; i < BOX_HEIGHT; i++) {
        let row = [];
        if (i < hand.length) {
            let card = translate_card_print(hand[i]);
            let hand_str = '' + i + '\) ' + card[0].padEnd(SYMBOLIC_TERM ? 1 : 2)
                + ' ' + card[1];
            row.push(hand_str);
        }
        else {
            row.push('');
        }
        if (i < chain.length) {
            let card = translate_card_print(chain[i]);
            let suit_req = '';
            if (card[1] == 'ace') {
                let value = chain[i];
                switch (Math.floor(value / 52)) {
                    case 0:
                        suit_req = 'c';
                        break;
                    case 1:
                        suit_req = 'd';
                        break;
                    case 2:
                        suit_req = 's';
                        break;
                    case 3:
                        suit_req = 'h';
                        break;
                }
            }
            let chain_str = '' + card[0].padEnd(SYMBOLIC_TERM ? 1 : 2)
                + ' ' + card[1]
                + (suit_req ? ' (' + suit_req + ')' : '');
            row.push(chain_str);
        }
        else {
            row.push('');
        }
        if (i < info.players.length) {
            let player = info.players[i];
            let n_cards = player.n_cards;
            let n_cards_str = n_cards < 3 ? '{red-fg}' + String(n_cards) + '{/}' : String(n_cards);
            let selector = (i == info.turn) ? (info.reverse ? "^ " : "⌄ ") : "  ";
            // push selector and player alias
            row.push(selector + player.username);
            row.push(n_cards_str);
            row.push((player.is_human ? 'H' : 'B'));
        }
        else {
            row.push('');
            row.push('');
            row.push('');
        }
        if (i < info.history.length) {
            let hist_data = info.history[info.history.length - (1 + i)];
            let owner_idx = hist_data[0];
            let data = hist_data[1];
            let history_str = '';
            if (owner_idx != 255 && owner_idx > 6) {
                // is pickup
                owner_idx = owner_idx - 7;
                let card_owner = (owner_idx === index ?
                    '{blue-fg}you{/}' :
                    info.players[owner_idx].username);
                history_str =
                    'pickup ' + data + ' by ' + card_owner;
            }
            else {
                let card_owner = (owner_idx == 255) ?
                    "game" :
                    (owner_idx === index ?
                        '{blue-fg}you{/}' :
                        info.players[owner_idx].username);
                let card = translate_card_print(data);
                history_str =
                    ('play ' + card[0].padEnd(SYMBOLIC_TERM ? 1 : 2)
                        + ' ' + card[1]) + ' by ' + card_owner;
            }
            row.push(history_str);
        }
        else {
            row.push('');
        }
        data.push(row);
    }
    table.setData(data);
}
exports.generate_table = generate_table;
/******************************************************************************
validate_card
******************************************************************************/
function validate_card(candidate, chain, top_card, game_status) {
    if (chain.length == 0) {
        if (game_status[0] == 'p') {
            let n = parseInt(game_status[2]);
            let search_for = 1 + (9 * (Number(n == 14) || Number(n == 7) * 1));
            let cand = translate_card(candidate);
            if (cand[1] != search_for)
                return [false, "invalid card with  pickup status"];
        }
        else if (game_status[0] == 's') {
            let req = parseInt(game_status[2]);
            let cand = translate_card(candidate);
            if (cand[1] != 0 && cand[0] != req) {
                return [false, "invalid card with suit status"];
            }
        }
        else {
            let top = translate_card(top_card);
            let cand = translate_card(candidate);
            if (top[0] != cand[0] && top[1] != cand[1])
                return [false, "not a suitable card"];
        }
    }
    else {
        let last_num = chain[chain.length - 1];
        let last = translate_card(last_num);
        let cand = translate_card(candidate);
        if (!((cand[0] == last[0] && Math.abs(cand[1] - last[1]) < 2) ||
            (cand[1] == last[1]) || (last[1] == 11 && last[0] == cand[0])))
            return [false, "not a valid chainable card"];
    }
    return [true, ""];
}
exports.validate_card = validate_card;
/******************************************************************************
generate_pool_table
******************************************************************************/
function generate_pool_table(contractCodeHash, start, end, table) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = start; i < end; i++) {
            let row = [`${i})`];
            let pool_query = yield query.pool_info(contractCodeHash, i);
            if (!pool_query[1]) {
                continue;
            }
            let p_info = pool_query[0];
            let cap_str = '';
            if (!p_info.online) {
                cap_str = '{red-fg}offline{/}';
            }
            else {
                let n_live = p_info.live_insts.length;
                let n_inactive = p_info.inactive_insts.length;
                let n_queue = p_info.queue_len;
                let capacity = Math.floor((n_live / (n_inactive + n_live)) * 100);
                let colour_str = '{red-fg}';
                if (capacity < 50) {
                    colour_str = '{green-fg}';
                }
                else if (capacity < 75) {
                    colour_str = '{yellow-fg}';
                }
                ;
                let extra_info = n_queue == 0 ? '{green-fg}no queue{/}' : `in queue: ${n_queue}`;
                cap_str = `${colour_str}${(String(capacity) + '%').padEnd(5)}{/}${extra_info}`;
            }
            row.push(cap_str.padEnd(5));
            if (p_info.n_players != 255) {
                row.push(`${p_info.n_players}/${p_info.player_cap}`);
            }
            else {
                row.push(`-`);
            }
            let entry = parseInt(p_info.entry);
            let denom = p_info.denom;
            if (denom == "uscrt") {
                entry = Math.floor(entry / 1e6);
                denom = "scrt";
            }
            row.push(`${entry}${denom}`);
            let mode = '';
            switch (p_info.mode) {
                case 0:
                    mode = "Human only";
                    break;
                case 1:
                    mode = "AI only";
                    break;
                case 2:
                    mode = "Mixed";
                    break;
            }
            row.push(`${mode}`);
            //exit(1, "",table.rows)// = row;
            let new_data = table.rows;
            new_data[i + 2 - start] = row;
            table.setData(new_data);
        }
    });
}
exports.generate_pool_table = generate_pool_table;
