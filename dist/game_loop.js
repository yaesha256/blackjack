"use strict";
/******************************************************************************

BLACKJACK FRONTEND v0.0.0-alpha.rc.7
AUTOGENERATED GAME_LOOP.TS FILE

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
exports.game_loop = void 0;
const consts = __importStar(require("./constants"));
const query = __importStar(require("./queries"));
const h = __importStar(require("./helpers"));
const b = __importStar(require("neo-blessed"));
const i = __importStar(require("./interfaces"));
const tx = __importStar(require("./transactions"));
const fs = __importStar(require("fs"));
const update_dotenv_1 = __importDefault(require("update-dotenv"));
/******************************************************************************
play_ace
******************************************************************************/
function play_ace(value) {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            let c = yield h.get_input(consts.BOX);
            if (c == 'c')
                return value;
            else if (c == 'd')
                return value + 52;
            else if (c == 's')
                return value + (52 * 2);
            else if (c == 'h')
                return value + (52 * 3);
            else if (c == 'Q') {
                yield h.exit(0, "you quit.");
            }
        }
    });
}
/******************************************************************************
play_turn
******************************************************************************/
function play_turn(info, top_card_data, contractCodeHash, header, subheader, table, alloc) {
    return __awaiter(this, void 0, void 0, function* () {
        let hand_result = yield query.hand_info(contractCodeHash, alloc.instance_id);
        if (!hand_result[1]) {
            yield h.exit(1, "failed to get hand data", hand_result[0]);
        }
        let handInfo = hand_result[0];
        if (handInfo.msg !== "success") {
            yield h.show_alert("Invalid viewing key. Generate a new one in the settings menu.");
            yield consts.settings_menu();
            hand_result = yield query.hand_info(contractCodeHash, alloc.instance_id);
            handInfo = hand_result[0];
            if (handInfo.msg !== "success") {
                h.exit(1, "error:\n", handInfo);
            }
        }
        const gameStatus = info.status;
        h.generate_header(info, top_card_data, "{green-fg}it's your turn!{/}", header, subheader);
        let hand = [...handInfo.hand];
        let chain = [];
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
            let c = yield h.get_input(consts.BOX);
            if (c == '+') {
                yield consts.settings_menu();
            }
            if (c == 'r') {
                hand = [...handInfo["hand"]];
                chain = [];
                continue;
            }
            if (c == 'd') {
                message.setContent("sending...");
                consts.SCREEN.render();
                let play_tx = yield tx.send_tx(contractCodeHash, { play_turn: { cards: chain, instance_id: alloc.instance_id } }, [], 55000, 0, false);
                if (typeof play_tx === "string") {
                    yield h.show_alert(play_tx);
                    continue;
                }
                message.setContent("{green-fg}sent!{/}");
                consts.SCREEN.render();
                message.setContent('');
                break;
            }
            if (c == 'Q') {
                yield h.exit(0, 'you quit.');
            }
            let idx = parseInt(c);
            if (isNaN(idx) || idx >= hand.length) {
                message.setContent("{red-fg}Please enter a valid index, or (d)one, (r)eset, (Q)uit, (+) settings.{/}");
                continue;
            }
            let top_card_data = [];
            let history_rev = [...info.history];
            history_rev.reverse();
            for (const datum of history_rev) {
                if (datum[0] < 7 || datum[0] == 255) {
                    top_card_data = datum;
                    break;
                }
            }
            let validate_result = h.validate_card(hand[idx], chain, top_card_data[1], gameStatus);
            if (!validate_result[0]) {
                message.setContent("{red-fg}" + validate_result[1] + "{/}");
                continue;
            }
            // update chain
            let card_num = hand[idx];
            if (h.translate_card(card_num)[1] == 0) {
                message.setContent("choose a suit to request: (c)lubs (d)iamonds (s)pades (h)earts, (Q)uit, (+) settings.");
                consts.SCREEN.render();
                let ace_value = yield play_ace(card_num);
                chain.push(ace_value);
            }
            else
                chain.push(card_num);
            // update hand
            if (hand.length != 0)
                hand.splice(idx, 1);
            // restore the message
            message.setContent("enter an index, or (d)one, (r)eset, (Q)uit.");
        }
        message.destroy();
    });
}
/******************************************************************************
game_loop
******************************************************************************/
function game_loop(contractCodeHash, pool_id) {
    return __awaiter(this, void 0, void 0, function* () {
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
        let alloc_result = yield query.allocation(contractCodeHash);
        if (!alloc_result[1]) {
            yield h.exit(1, `lost connection to game`, alloc_result[0]);
        }
        let alloc = alloc_result[0];
        let your_idx = alloc.index;
        (0, update_dotenv_1.default)({
            INSTANCE_ID: alloc.instance_id
        });
        let winner_alias = '';
        let winner = 255;
        let info;
        let top_card_data = [];
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
            let info_result = yield query.game_info(contractCodeHash, alloc.instance_id, pool_id);
            if (!info_result[1]) {
                yield h.exit(1, `lost connection to game`, info_result[0]);
            }
            info = info_result[0];
            if (info.over) {
                winner_alias = info.players[info.winner].username;
                winner = info.winner;
                break;
            }
            top_card_data = [];
            for (var j = info.history.length - 1; j >= 0; j--) {
                let datum = info.history[j];
                if (datum[0] < 7 || datum[0] == 255) {
                    top_card_data = datum;
                    break;
                }
            }
            let turn_alias = info.players[info.turn].username;
            if (info.turn == alloc.index) {
                consts.BOX.style.border.fg = '#00FF00';
                consts.SCREEN.render();
                yield h.sleep(0.1);
                consts.BOX.style.border.fg = '#F0F0F0';
                consts.SCREEN.render();
                yield h.sleep(0.1);
                consts.BOX.style.border.fg = '#00FF00';
                consts.SCREEN.render();
                yield h.sleep(0.1);
                consts.BOX.style.border.fg = '#F0F0F0';
                consts.SCREEN.render();
                yield play_turn(info, top_card_data, contractCodeHash, header, subheader, table, alloc);
            }
            else {
                // spectating
                let hand_result = yield query.hand_info(contractCodeHash, alloc.instance_id);
                if (!hand_result[1]) {
                    yield h.exit(1, `failed to fetch hand`, hand_result[0]);
                }
                let hand = hand_result[0];
                h.generate_header(info, top_card_data, "it's " + turn_alias + "'s turn", header, subheader);
                h.generate_table(info, alloc.index, [], hand.hand, table);
                consts.SCREEN.render();
            }
            yield h.sleep(3);
        } while (true);
        timer.stop();
        consts.BOX.set('align', 'center');
        // handle game result
        if (winner == your_idx) {
            header.destroy();
            subheader.destroy();
            table.destroy();
            consts.BOX.setContent("{green-fg}you won!{/}\nclaim prize now? (Y/n)");
            consts.SCREEN.render();
            let c = yield h.get_input(consts.BOX);
            if (c != 'n' && c != 'N') {
                consts.BOX.setContent("claiming prize...");
                consts.SCREEN.render();
                let claim_tx = yield tx.send_tx(contractCodeHash, { claim_prize: { instance_id: alloc.instance_id } }, [], 66000, 0, false);
                if (typeof claim_tx === "string") {
                    yield h.show_alert(claim_tx);
                    h.exit(1, "Could not perform claim tx, try again later, or await release.");
                }
                let date_str = new Date().toLocaleString('en-GB');
                date_str = date_str.replace(/\//g, '-');
                date_str = date_str.replace(/ /g, '-');
                date_str = date_str.replace(/,/g, '-');
                date_str = date_str.replace(/:/g, '-');
                let receipt_dir = "./receipts";
                if (!fs.existsSync(receipt_dir)) {
                    fs.mkdirSync(receipt_dir);
                }
                let file_path = receipt_dir + "/claim-prize-" + date_str;
                let claim_data = JSON.stringify(claim_tx);
                fs.writeFile(file_path, claim_data, function (err) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            yield h.exit(1, "failed to save receipt: ", err);
                        }
                    });
                });
                consts.BOX.setContent("{green-fg}sent!{/}\n receipt saved in file:\n" + file_path);
                consts.SCREEN.render();
            }
            else {
                consts.BOX.setContent("prize remains unclaimed.");
                consts.SCREEN.render();
            }
        }
        else {
            if (!i.isGameInfo(info)) {
                yield h.exit(1, `lost connection to game`, info);
            }
            top_card_data = [];
            for (var j = info.history.length - 1; j >= 0; j--) {
                let datum = info.history[j];
                if (datum[0] < 7 || datum[0] == 255) {
                    top_card_data = datum;
                    break;
                }
            }
            h.generate_header(info, top_card_data, "winner was " + winner_alias, header, subheader);
            h.generate_table(info, alloc.index, [], [], table);
            consts.SCREEN.render();
        }
        yield h.sleep(5);
        header.destroy();
        subheader.destroy();
        table.destroy();
        timer_text.destroy();
        consts.BOX.setContent("winner was " + winner_alias + '\n\nback to menu? (Y/n)');
        consts.SCREEN.render();
        let input = yield h.get_input(consts.BOX);
        if (input == 'n' || input == 'N') {
            h.exit(0, 'game over');
        }
    });
}
exports.game_loop = game_loop;
