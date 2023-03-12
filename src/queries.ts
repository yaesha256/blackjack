import * as consts from "./constants"
import * as h from "./helpers"
import * as i from "./interfaces"

export async function game_info(contractCodeHash, inst_id, pool_id : number | any = null): Promise<[i.IGameInfo | any, boolean ]>  {

    let gameInfo : i.IGameInfo | any = await consts.SECRETCLI[0].query.compute.queryContract({
      contract_address: consts.CONTRACT_ADDRESS,
      code_hash: contractCodeHash,
      query: { game_info: { instance_id : inst_id, pool_id: pool_id }},
    }).catch(e => h.show_alert("query game info failed: ",e));

    return [gameInfo, i.isGameInfo(gameInfo)];
}
  
export async function hand_info(contractCodeHash, inst_id):  Promise<[i.IHandInfo | any, boolean ]>  {
    let handInfo : i.IHandInfo | any = await consts.SECRETCLI[0].query.compute.queryContract({
        contract_address: consts.CONTRACT_ADDRESS,
        code_hash: contractCodeHash,
        query: { hand: { 
        instance_id: inst_id ,
        addr : consts.WALLET.address, 
        key: process.env.VIEWING_KEY}},
    }).catch(e => h.show_alert("query hand failed: ",e));

    return [handInfo, i.isHandInfo(handInfo)];
}

export async function pool_info(contractCodeHash, pool_id): Promise<[ i.IPoolInfo | any, boolean ]> {

    let poolInfo : i.IPoolInfo | any = await consts.SECRETCLI[0].query.compute.queryContract({
        contract_address: consts.CONTRACT_ADDRESS,
        code_hash: contractCodeHash,
        query: { pool_info: { pool_id: pool_id } },
    }).catch(e => h.show_alert("query pool info failed: ",e));

    return [poolInfo, i.isPoolInfo(poolInfo)];
}

export async function allocation(contractCodeHash): Promise<[i.IAllocation | any, boolean ]> {
    
    let alloc : i.IAllocation | any = await consts.SECRETCLI[0].query.compute.queryContract({
        contract_address: consts.CONTRACT_ADDRESS,
        code_hash: contractCodeHash,
        query: { allocation: { addr: consts.WALLET.address } },
    }).catch(e => h.show_alert("query allocation failed: ",e));

    return [alloc, i.isAllocation(alloc)];
}

export async function name_of_addr(contractCodeHash): Promise<[i.IAllocation | any, boolean ]> {
    
    let alloc : i.IAllocation | any = await consts.SECRETCLI[0].query.compute.queryContract({
        contract_address: consts.CONTRACT_ADDRESS,
        code_hash: contractCodeHash,
        query: { name_of_address: { addr: consts.WALLET.address, key: process.env.VIEWING_KEY } },
    }).catch(e => h.show_alert("query : ",e));

    return [alloc, i.isNameByAddr(alloc)];
}

