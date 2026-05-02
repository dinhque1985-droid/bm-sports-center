/**
 * bookingRequestStore.js
 * 🎯 BOOKING REQUEST STATE CONTRACT LAYER
 *
 * RULE:
 * ✅ Chỉ nhận normalized request từ bookingRequestService
 * ✅ Pending request là single source of truth
 * ✅ UI chỉ gọi store actions
 * ❌ UI không patch local tùy ý
 * ❌ Store không normalize API
 */

import {
    fetchBookingRequests,
    createBookingRequestAPI,
    approveBookingRequestAPI,
    rejectBookingRequestAPI
} from "../services/bookingRequestService.js"


// ===============================
// STATE
// ===============================
let requests = []

let requestListeners = []


// ===============================
// GET
// ===============================
export function getRequests(){

    return [...requests]
        .sort(sortRequests)
}


// ===============================
// SET
// ===============================
export function setRequests(data){

    if(!Array.isArray(data)){

        console.warn(
            "❌ INVALID REQUEST SET:",
            data
        )

        requests = []

        notify()

        return
    }

    requests = data.filter(
        isValidRequestShape
    )

    notify()
}


// ===============================
// LOAD
// ===============================
export async function loadRequests(
    status = "pending"
){

    try{

        const data =
            await fetchBookingRequests(
                status
            )

        setRequests(data)

        return data

    }catch(err){

        console.error(
            "❌ LOAD REQUEST FAIL:",
            err
        )

        return []
    }
}

// ===============================
// CREATE (GUEST)
// ===============================
export async function createRequest(
    payload
){

    try{

        const created =
            await createBookingRequestAPI(
                payload
            )

        addRequest(created)

        return created

    }catch(err){

        console.error(
            "❌ CREATE REQUEST FAIL:",
            err
        )

        return false
    }
}


// ===============================
// ADD
// ===============================
export function addRequest(request){

    if(!isValidRequestShape(request)){

        console.warn(
            "❌ INVALID REQUEST:",
            request
        )

        return false
    }

    const exists = requests.find(
        r =>
            String(r.id) ===
            String(request.id)
    )

    if(exists){

        console.warn(
            "⚠️ DUPLICATE REQUEST:",
            request.id
        )

        return false
    }

    requests.push(request)

    notify()

    return true
}


// ===============================
// REMOVE
// ===============================
export function removeRequest(id){

    const before = requests.length

    requests = requests.filter(
        r =>
            String(r.id) !==
            String(id)
    )

    const changed =
        before !== requests.length

    if(changed){
        notify()
    }

    return changed
}


// ===============================
// APPROVE (ADMIN)
// ===============================
export async function approveRequest(
    id
){

    if(!id){

        console.warn(
            "❌ APPROVE MISSING ID"
        )

        return false
    }

    try{

        const result =
            await approveBookingRequestAPI(
                id
            )

        if(
            result?.request
        ){
            replaceRequest(
                id,
                result.request
            )
        }

        return result

    }catch(err){

        console.error(
            "❌ APPROVE REQUEST FAIL:",
            err
        )

        throw err
    }
}


// ===============================
// REJECT (ADMIN)
// ===============================
export async function rejectRequest(
    id,
    admin_note = ""
){

    if(!id){

        console.warn(
            "❌ REJECT MISSING ID"
        )

        return false
    }

    try{

        const result =
            await rejectBookingRequestAPI(
                id,
                admin_note
            )

        if(
            result?.request
        ){
            replaceRequest(
                id,
                result.request
            )
        }

        return result

    }catch(err){

        console.error(
            "❌ REJECT REQUEST FAIL:",
            err
        )

        throw err
    }
}


// ===============================
// REPLACE
// future-safe
// ===============================
export function replaceRequest(
    id,
    updated
){

    const index =
        requests.findIndex(
            r =>
                String(r.id) ===
                String(id)
        )

    if(index === -1){
        return false
    }

    if(!isValidRequestShape(updated)){

        console.warn(
            "❌ INVALID REQUEST REPLACE:",
            updated
        )

        return false
    }

    requests[index] = updated

    notify()

    return true
}


// ===============================
// SUBSCRIBE
// ===============================
export function subscribeRequests(
    fn
){

    if(typeof fn !== "function"){
        return
    }

    requestListeners.push(fn)
}


// ===============================
// INTERNAL
// ===============================
function notify(){

    const snapshot = getRequests()

    console.log(
        "📦 REQUEST STORE STATE:",
        snapshot
    )

    requestListeners.forEach(
        fn => fn(snapshot)
    )
}


// ===============================
// SHAPE GUARD
// ===============================
function isValidRequestShape(r){

    if(!r) return false

    return (
        r.id != null &&
        r.court_id != null &&
        r.date &&
        r.start != null &&
        r.end != null &&
        r.status
    )
}


// ===============================
// SORT
// pending first by date/start
// ===============================
function sortRequests(a, b){

    const statusOrder = {
        pending: 0,
        approved: 1,
        rejected: 2
    }

    const aStatus =
        statusOrder[a.status] ?? 99

    const bStatus =
        statusOrder[b.status] ?? 99

    if(aStatus !== bStatus){
        return aStatus - bStatus
    }

    if(a.date !== b.date){
        return a.date.localeCompare(
            b.date
        )
    }

    if(a.start !== b.start){
        return a.start - b.start
    }

    return (
        Number(a.court_id) -
        Number(b.court_id)
    )
}

// ===============================
// DEBUG
// ===============================
window.getRequests = getRequests

window.setRequests = setRequests

window.loadRequests = loadRequests

window.createRequest = createRequest

window.approveRequest = approveRequest

window.rejectRequest = rejectRequest