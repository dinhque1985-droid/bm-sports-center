/**
 * bookingRequestService.js
 * 🎯 CONTRACT LAYER DUY NHẤT cho BookingRequest
 *
 * RULE:
 * ✅ Guest/Admin UI chỉ gọi file này
 * ✅ Chỉ file này transform API <-> App
 * ✅ Pending / Approved / Rejected chuẩn hóa 1 shape
 * ❌ UI không fetch trực tiếp
 * ❌ Store không đoán field
 */

import { assertBookingRequestModel } from "../models/bookingRequestModel.js"

const BASE = "/api/booking-requests"


// ===============================
// SHAPE GUARD
// ===============================
function assertValidRequestPayload(payload){

    if(!payload || typeof payload !== "object"){
        throw new Error("Invalid booking request payload")
    }

    const required = [
        "court_id",
        "date",
        "start",
        "end",
        "customer",
        "phone"
    ]

    for(const key of required){
        if(
            payload[key] == null ||
            payload[key] === ""
        ){
            throw new Error(
                `Missing request field: ${key}`
            )
        }
    }

    if(Number(payload.start) >= Number(payload.end)){
        throw new Error(
            "Invalid booking request time range"
        )
    }

    return true
}


// ===============================
// UI → API
// ===============================
export function toApiPayload(payload){

    assertValidRequestPayload(payload)

    return {
        court: String(payload.court_id),

        date: payload.date,

        start: Number(payload.start),
        end: Number(payload.end),

        customer: payload.customer || "Khách",

        phone: payload.phone || "",

        note: payload.note || ""
    }
}


// ===============================
// API → APP
// ===============================
export function normalizeBookingRequest(raw){

    const normalized = {
        id: String(raw.id),

        court: String(raw.court),

        court_id: Number(raw.court_id),

        date: raw.date,

        start: Number(raw.start),
        end: Number(raw.end),

        customer: raw.customer || "Khách",

        phone: raw.phone || "",

        note: raw.note || "",

        status: raw.status || "pending",

        estimated_price: Number(
            raw.estimated_price || 0
        ),

        admin_note: raw.admin_note || "",

        created_at: raw.created_at || null,

        reviewed_at: raw.reviewed_at || null
    }

    assertBookingRequestModel(normalized)

    return normalized
}


// ===============================
// FETCH
// ===============================
export async function fetchBookingRequests(
    status = null
){

    let url = BASE + "/"

    console.log(
    "🌐 REQUEST URL:",
    url

    )
    
    if(
        status &&
        status !== "all"
    ){
        url += `?status=${status}`
    }

    const res = await fetch(url)

    if(!res.ok){
        throw new Error(
            "BookingRequest fetch failed"
        )
    }

    const data = await res.json()

    if(!Array.isArray(data)){
        throw new Error(
            "Invalid booking request list response"
        )
    }

    console.log(
        "🧪 BOOKING REQUEST API RAW:",
        data
    )

    const normalized = data.map(
        normalizeBookingRequest
    )

    console.log(
        "🧠 BOOKING REQUEST CONTRACT:",
        normalized
    )

    return normalized
}


// ===============================
// CREATE (GUEST)
// ===============================
export async function createBookingRequestAPI(
    payload
){

    const apiPayload = toApiPayload(payload)

    console.log(
        "📦 BOOKING REQUEST PAYLOAD:",
        apiPayload
    )

    const res = await fetch(
        `${BASE}/`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(
                apiPayload
            )
        }
    )

    const json = await res
        .json()
        .catch(() => ({}))

    if(!res.ok){

        console.error(
            "❌ BOOKING REQUEST CREATE FAIL:",
            json
        )

        throw new Error(
            json.error ||
            "Create booking request failed"
        )
    }

    const normalized =
        normalizeBookingRequest(json)

    console.log(
        "✅ BOOKING REQUEST CREATED:",
        normalized
    )

    return normalized
}


// ===============================
// APPROVE (ADMIN)
// ===============================
export async function approveBookingRequestAPI(
    id
){

    if(!id){
        throw new Error(
            "Missing booking request id"
        )
    }

    const res = await fetch(
        `${BASE}/${id}/approve/`,
        {
            method: "POST"
        }
    )

    const json = await res
        .json()
        .catch(() => ({}))

    if(!res.ok){

        console.error(
            "❌ APPROVE REQUEST FAIL:",
            json
        )

        throw new Error(
            json.error ||
            "Approve booking request failed"
        )
    }

    return {
        success: true,

        request:
            normalizeBookingRequest(
                json.request
            ),

        booking: json.booking || null
    }
}


// ===============================
// REJECT (ADMIN)
// ===============================
export async function rejectBookingRequestAPI(
    id,
    admin_note
){

    if(
        !admin_note ||
        !String(admin_note).trim()
    ){
        throw new Error(
            "Vui lòng nhập lý do từ chối"
        )
    }

    if(!id){
        throw new Error(
            "Missing booking request id"
        )
    }

    const res = await fetch(
        `${BASE}/${id}/reject/`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                admin_note
            })
        }
    )

    const json = await res
        .json()
        .catch(() => ({}))

    if(!res.ok){

        console.error(
            "❌ REJECT REQUEST FAIL:",
            json
        )

        throw new Error(
            json.error ||
            "Reject booking request failed"
        )
    }

    return {
        success: true,

        request:
            normalizeBookingRequest(
                json.request
            )
    }
}

export async function fetchPendingRequests(){
    return fetchBookingRequests("pending")
}

export async function fetchApprovedRequests(){
    return fetchBookingRequests("approved")
}

export async function fetchRejectedRequests(){
    return fetchBookingRequests("rejected")
}

// ===============================
// DEBUG
// ===============================
window.fetchBookingRequests =
    fetchBookingRequests

window.createBookingRequestAPI =
    createBookingRequestAPI

window.approveBookingRequestAPI =
    approveBookingRequestAPI

window.rejectBookingRequestAPI =
    rejectBookingRequestAPI

window.fetchPendingRequests =
    fetchPendingRequests

window.fetchApprovedRequests =
    fetchApprovedRequests

window.fetchRejectedRequests =
    fetchRejectedRequests