
/******************************************************************************
Game Info Interface
******************************************************************************/

export interface IPlayerInfo {
    username: string,
    is_human: boolean,
    n_cards: number
}

export interface IGameInfo {
    pool_id : number,
    instance_id: String,
    players: IPlayerInfo[],
    started: boolean,
    over: boolean,
    winner: number,
    turn: number,
    online: boolean,
    turn_ends_at: string,
    mode: number,
    history: number[][],
    status: string,
    reverse: boolean
}

export function isGameInfo(object: any): boolean {
    return !(object instanceof String) &&
    typeof(object) !== "string" &&
    'pool_id' in object &&
    'instance_id' in object &&
    'players' in object &&
    'started' in object &&
    'over' in object  &&
    'winner' in object  &&
    'turn' in object  &&
    'online' in object  &&
    'turn_ends_at' in object  &&
    'mode' in object &&
    'history' in object  &&
    'status' in object &&
    'reverse' in object;
}

/******************************************************************************
Hand Info Interface
******************************************************************************/

export interface IHandInfo {
    hand : number[],
    msg: string
}

export function isHandInfo(object: any): object is IHandInfo {
    return !(object instanceof String) &&
    'hand' in object &&
    'msg' in object
}

/******************************************************************************
Pool Info Interface
******************************************************************************/

export interface IPoolInfo {
    live_insts : string[],
    inactive_insts: string[],
    queue_len: number,
    entry: string,
    denom: string,
    player_cap: number,
    n_players: number,
    online: boolean,
    mode: number
}

export function isPoolInfo(object: any): object is IPoolInfo {
    return !(object instanceof String) &&
    typeof(object) !== "string" &&
    'live_insts' in object && 
    'inactive_insts' in object &&
    'queue_len' in object &&
    'entry' in object &&
    'denom' in object &&
    'player_cap' in object &&
    'n_players' in object &&
    'mode' in object
}

/******************************************************************************
Allocation Interface
******************************************************************************/

export interface IAllocation {
    instance_id : string,
    pool_id: number,
    index: number,
} 

export function isAllocation(object: any): object is IAllocation {
    return !(object instanceof String) &&
    typeof(object) !== "string" &&
    'instance_id' in object &&
    'pool_id' in object &&
    'index' in object 
}

/******************************************************************************
Name by Address Interface
******************************************************************************/

export interface INameBYAddr {
    instance_id : string,
    pool_id: number,
    index: number,
} 

export function isNameByAddr(object: any): object is IAllocation {
    return !(object instanceof String) &&
    typeof(object) !== "string" &&
    'username' in object
}