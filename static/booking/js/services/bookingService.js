/**
 * bookingService.js
 * 🎯 BOOKING CONTRACT LAYER
 *
 * RULE:
 * ✅ Chỉ file này transform Booking API <-> App
 * ✅ UI / Store chỉ dùng normalized booking
 * ❌ UI không đoán API field
 * ❌ Store không sửa shape
 */

import { assertBookingModel } from "../models/bookingModel.js"
const BASE = "/api/bookings"


// ===============================
// CONTRACT GUARD
// ===============================
function assertValidBookingPayload(payload){

    if(!payload || typeof payload !== "object"){
        throw new Error("Invalid booking payload")
    }

    const required = [
        "court_id",
        "date",
        "start",
        "end"
    ]

    for(const key of required){
        if(payload[key] == null || payload[key] === ""){
            throw new Error(`Missing booking field: ${key}`)
        }
    }

    if(Number(payload.start) >= Number(payload.end)){
        throw new Error("Invalid booking time range")
    }

    return true
}


// ===============================
// BUILD API PAYLOAD
// APP → API
// ===============================
export function toApiPayload(payload){

    assertValidBookingPayload(payload)

    const apiPayload = {
        // 🔥 Backend contract hiện tại dùng "court"
        court: String(payload.court_id),

        date: payload.date,

        start: Number(payload.start),
        end: Number(payload.end),

        customer: payload.customer || "Khách",

        phone: payload.phone || "",

        paid: payload.paid ?? false,

        // 🔥 business trace
        booked_by:
            payload.booked_by ||
            payload.customer ||
            "Khách"
    }

    console.log("📦 BOOKING API PAYLOAD:", apiPayload)

    return apiPayload
}


// ===============================
// NORMALIZE API RESPONSE
// API → APP
// ===============================
function normalizeBooking(raw){

    const normalized = {
        id: String(raw.id),

        court_id: Number(raw.court_id),

        date: raw.date,

        start: Number(raw.start),
        end: Number(raw.end),

        customer: raw.customer || "Khách",

        phone: raw.phone || "",

        // 🔥 trace
        booked_by: raw.booked_by || "",

        paid: Boolean(raw.paid),

        price: Number(raw.price || 0),
    }

    assertBookingModel(normalized)

    return normalized
}

// ===============================
// FETCH
// ===============================
export async function fetchBookings(date){

    if(!date){
        throw new Error("Missing date for fetchBookings")
    }

    const res = await fetch(`${BASE}/?date=${date}`)

    if(!res.ok){
        throw new Error("Booking fetch failed")
    }

    const data = await res.json()

    if(!Array.isArray(data)){
        throw new Error("Invalid booking list response")
    }

    console.log("🧪 BOOKING API RAW:", data)

    const normalized = data.map(normalizeBooking)

    console.log("🧠 BOOKING CONTRACT:", normalized)

    return normalized
}


// ===============================
// CREATE
// ===============================
export async function createBookingAPI(data){

    const res = await fetch("/api/bookings/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            toApiPayload(data)
        )
    })

    const json = await res.json().catch(
        () => ({})
    )

    console.log(
        "🧪 CREATE BOOKING RAW:",
        json
    )

    if(!res.ok){
        throw new Error(
            json.error ||
            "Create failed"
        )
    }

    const normalized = normalizeBooking(json)
    return normalized
}

// ===============================
// UPDATE
// ===============================
export async function updateBookingAPI(id, patch){

    if(!id){
        throw new Error("Missing booking id")
    }

    if(!patch || typeof patch !== "object"){
        throw new Error("Invalid booking patch")
    }

    // ⚠️ PATCH thường partial → không assert full required
    const apiPayload = {
        ...(patch.court_id != null && {
            court: String(patch.court_id)
        }),

        ...(patch.date != null && {
            date: patch.date
        }),

        ...(patch.start != null && {
            start: Number(patch.start)
        }),

        ...(patch.end != null && {
            end: Number(patch.end)
        }),

        ...(patch.customer != null && {
            customer: patch.customer || "Khách"
        }),

        ...(patch.phone != null && {
            phone: patch.phone || ""
        }),

        ...(patch.paid != null && {
            paid: patch.paid
        }),

        ...(patch.booked_by != null && {
            booked_by:
                patch.booked_by
        })
    }

    console.log("📦 BOOKING UPDATE PAYLOAD:", apiPayload)

    const res = await fetch(`${BASE}/${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(apiPayload)
    })

    const json = await res.json().catch(() => null)

    if(!json){
        throw new Error("Invalid server response")
    }

    console.log("🧪 BOOKING UPDATE RAW:", json)

    if(!res.ok){
        throw new Error(json.error || "Update failed")
    }

    const normalized = normalizeBooking(json)

    console.log("✅ BOOKING UPDATED NORMALIZED:", normalized)

    return normalized
}


// ===============================
// DELETE
// ===============================
export async function deleteBookingAPI(id){

    if(!id){
        throw new Error("Missing booking id")
    }

    const res = await fetch(`${BASE}/${id}/`, {
        method: "DELETE"
    })

    if(!res.ok){
        throw new Error("Delete booking failed")
    }

    console.log("✅ BOOKING DELETED:", id)

    return {
        success: true,
        id: String(id)
    }
}


// ===============================
// DEBUG
// ===============================
window.createBookingAPI = createBookingAPI
window.fetchBookings = fetchBookings