/**
 * models/blockModel.js
 * 🎯 BLOCK DOMAIN MODEL
 */

const REQUIRED_FIELDS = [
    "id",
    "court_id",
    "date_from",
    "date_to",
    "start",
    "end"
]


export function isBlockShape(block){

    if(!block || typeof block !== "object"){
        return false
    }

    return REQUIRED_FIELDS.every(
        key => block[key] != null
    )
}


export function validateBlockModel(block){

    if(!isBlockShape(block)){
        return {
            valid: false,
            error: "Invalid block shape"
        }
    }

    if(block.date_from > block.date_to){
        return {
            valid: false,
            error: "Invalid block date range"
        }
    }

    if(Number(block.start) >= Number(block.end)){
        return {
            valid: false,
            error: "Invalid block time range"
        }
    }

    return {
        valid: true,
        error: null
    }
}


export function assertBlockModel(block){

    const result = validateBlockModel(block)

    if(!result.valid){
        throw new Error(result.error)
    }

    return true
}