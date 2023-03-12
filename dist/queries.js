"use strict";
/******************************************************************************

BLACKJACK FRONTEND v0.0.0-alpha.rc.7
AUTOGENERATED QUERIES.TS FILE

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.name_of_addr = exports.allocation = exports.pool_info = exports.hand_info = exports.game_info = void 0;
const consts = __importStar(require("./constants"));
const h = __importStar(require("./helpers"));
const i = __importStar(require("./interfaces"));
function game_info(contractCodeHash, inst_id, pool_id = null) {
    return __awaiter(this, void 0, void 0, function* () {
        let gameInfo = yield consts.SECRETCLI[0].query.compute.queryContract({
            contract_address: consts.CONTRACT_ADDRESS,
            code_hash: contractCodeHash,
            query: { game_info: { instance_id: inst_id, pool_id: pool_id } },
        }).catch(e => h.show_alert("query game info failed: ", e));
        return [gameInfo, i.isGameInfo(gameInfo)];
    });
}
exports.game_info = game_info;
function hand_info(contractCodeHash, inst_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let handInfo = yield consts.SECRETCLI[0].query.compute.queryContract({
            contract_address: consts.CONTRACT_ADDRESS,
            code_hash: contractCodeHash,
            query: { hand: {
                    instance_id: inst_id,
                    addr: consts.WALLET.address,
                    key: process.env.VIEWING_KEY
                } },
        }).catch(e => h.show_alert("query hand failed: ", e));
        return [handInfo, i.isHandInfo(handInfo)];
    });
}
exports.hand_info = hand_info;
function pool_info(contractCodeHash, pool_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let poolInfo = yield consts.SECRETCLI[0].query.compute.queryContract({
            contract_address: consts.CONTRACT_ADDRESS,
            code_hash: contractCodeHash,
            query: { pool_info: { pool_id: pool_id } },
        }).catch(e => h.show_alert("query pool info failed: ", e));
        return [poolInfo, i.isPoolInfo(poolInfo)];
    });
}
exports.pool_info = pool_info;
function allocation(contractCodeHash) {
    return __awaiter(this, void 0, void 0, function* () {
        let alloc = yield consts.SECRETCLI[0].query.compute.queryContract({
            contract_address: consts.CONTRACT_ADDRESS,
            code_hash: contractCodeHash,
            query: { allocation: { addr: consts.WALLET.address } },
        }).catch(e => h.show_alert("query allocation failed: ", e));
        return [alloc, i.isAllocation(alloc)];
    });
}
exports.allocation = allocation;
function name_of_addr(contractCodeHash) {
    return __awaiter(this, void 0, void 0, function* () {
        let alloc = yield consts.SECRETCLI[0].query.compute.queryContract({
            contract_address: consts.CONTRACT_ADDRESS,
            code_hash: contractCodeHash,
            query: { name_of_address: { addr: consts.WALLET.address, key: process.env.VIEWING_KEY } },
        }).catch(e => h.show_alert("query : ", e));
        return [alloc, i.isNameByAddr(alloc)];
    });
}
exports.name_of_addr = name_of_addr;
