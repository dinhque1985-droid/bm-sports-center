/**
 * blockStore.js
 * 🎯 BLOCK STATE CONTRACT LAYER
 *
 * RULE:
 * ✅ Chỉ nhận normalized block từ blockService
 * ✅ Store là single source of truth cho block
 * ✅ UI chỉ gọi store actions
 * ❌ Store không normalize API lung tung
 * ❌ UI không tự patch block state
 */

import { deleteBlockAPI } from "../services/blockService.js"
import { getCurrentDate } from "../timeline/timelineDate.js"

// ===============================
// STATE
// ===============================
let blocks = []

let blockListeners = []


// ===============================
// PUBLIC: GET
// ===============================
export function getBlocks(){

    return [...blocks]
        .sort(sortBlocks)
}


// ===============================
// PUBLIC: SET
// ===============================
export function setBlocks(data){

    if(!Array.isArray(data)){

        console.warn("❌ INVALID BLOCK SET:", data)
        blocks = []
        notify()
        return
    }

    if(data.some(x => !isValidBlockShape(x))){
        console.warn("❌ INVALID BLOCK CONTRACT:", data)
    }
    blocks = data

    notify()
}


// ===============================
// PUBLIC: ADD
// ===============================
export function addBlock(block){

    if(!isValidBlockShape(block)){

        console.warn("❌ STORE REJECT INVALID BLOCK:", block)

        return false
    }

    // ===== DUPLICATE GUARD =====
    const exists = blocks.find(
        b => String(b.id) === String(block.id)
    )

    if(exists){

        console.warn("⚠️ BLOCK DUPLICATE IGNORED:", block.id)

        return false
    }

    blocks.push(block)

    notify()

    return true
}


// ===============================
// PUBLIC: REMOVE
// ===============================
export function removeBlock(id){

    const before = blocks.length

    blocks = blocks.filter(
        b => String(b.id) !== String(id)
    )

    const changed = blocks.length !== before

    if(changed){
        notify()
    }

    return changed
}


// ===============================
// PUBLIC: REPLACE
// (future-safe cho partial update / edit)
// ===============================
export function replaceBlock(id, updatedBlock){

    const index = blocks.findIndex(
        b => String(b.id) === String(id)
    )

    if(index === -1){
        return false
    }

    if(!isValidBlockShape(updatedBlock)){

        console.warn(
            "❌ INVALID BLOCK REPLACE:",
            updatedBlock
        )

        return false
    }

    blocks[index] = updatedBlock

    notify()

    return true
}


// ===============================
// DELETE
// ===============================
export async function deleteBlock(id, date){

    if(!id){

        console.warn("❌ DELETE BLOCK MISSING ID")

        return false
    }

    try{

        const currentDate = getCurrentDate()

        const result = await deleteBlockAPI(
            id,
            currentDate
        )

        if(result?.type === "partial"){
            return "reload"
        }

        if(result?.type === "full"){
            removeBlock(id)
            return true
        }

        throw new Error("Unknown delete response")

    }catch(err){

        console.error("❌ STORE DELETE BLOCK FAIL:", err)

        return false
    }
}


// ===============================
// SUBSCRIBE
// ===============================
export function subscribeBlocks(fn){

    if(typeof fn !== "function"){
    throw new Error("Subscriber must be function")
    }

    blockListeners.push(fn)
}


// ===============================
// INTERNAL: NOTIFY
// ===============================
function notify(){

    const snapshot = getBlocks()

    console.log("📦 BLOCK STORE STATE:", snapshot)

    blockListeners.forEach(
        fn => fn(snapshot)
    )
}


// ===============================
// SHAPE GUARD
// ===============================
function isValidBlockShape(block){

    if(!block) return false

    return (
        block.id != null &&
        block.court_id != null &&
        block.date_from &&
        block.date_to &&
        block.start != null &&
        block.end != null
    )
}


// ===============================
// SORT
// court → date_from → start
// ===============================
function sortBlocks(a, b){

    if(a.court_id !== b.court_id){
        return a.court_id - b.court_id
    }

    if(a.date_from !== b.date_from){
        return a.date_from.localeCompare(
            b.date_from
        )
    }

    return a.start - b.start
}