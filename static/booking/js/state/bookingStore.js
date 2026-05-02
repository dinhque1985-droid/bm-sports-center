/**
 * bookingStore.js
 * 🎯 BOOKING STATE CONTRACT LAYER
 *
 * RULE:
 * ✅ Chỉ nhận normalized booking từ bookingService
 * ✅ Store là single source of truth
 * ✅ UI chỉ gọi store actions
 * ❌ Store không normalize API
 * ❌ Store không patch raw đoán mò
 */

import { getBlocks } from "./blockStore.js"

import {
    createBookingAPI,
    updateBookingAPI,
    deleteBookingAPI
} from "../services/bookingService.js"

import { getCurrentDate } from "../timeline/timelineDate.js"

import { validateBookingCore } from "../rules/bookingRules.js"


// ===============================
// STATE
// ===============================
let bookings = []

let listeners = []


// ===============================
// PUBLIC: GET
// ===============================
export function getBookings(){

    return [...bookings]
        .sort(sortBookings)
}


// ===============================
// PUBLIC: SET
// ===============================
export function setBookings(data){

    if(!Array.isArray(data) || data.some(x => !isValidBookingShape(x))){
        console.warn("❌ INVALID BOOKING SET:", data)
        bookings = []
        notify()
        return
    }

    bookings = data

    notify()
}


// ===============================
// PUBLIC: ADD
// ===============================
export function addBooking(booking){

    if(!isValidBookingShape(booking)){
        console.warn("❌ STORE REJECT INVALID BOOKING:", booking)
        return false
    }

    if(!validateBooking(booking)){
        return false
    }

    bookings.push(booking)

    notify()

    return true
}


// ===============================
// PUBLIC: UPDATE LOCAL
// ===============================
export function updateBooking(id, updatedBooking){

    const index = bookings.findIndex(
        b => String(b.id) === String(id)
    )

    if(index === -1){
        return false
    }

    if(!isValidBookingShape(updatedBooking)){
        console.warn("❌ INVALID UPDATE SHAPE:", updatedBooking)
        return false
    }

    if(!validateBooking(updatedBooking, id)){
        return false
    }

    bookings[index] = updatedBooking

    console.log("✅ STORE UPDATED:", updatedBooking)

    notify()

    return true
}


// ===============================
// PUBLIC: REMOVE
// ===============================
export function removeBooking(id){

    bookings = bookings.filter(
        b => String(b.id) !== String(id)
    )

    notify()

    return true
}


// ===============================
// CREATE (STORE → SERVICE)
// ===============================
export async function createBooking(payload){

    console.log("📦 STORE CREATE INPUT:", payload)

    try{

        // ===== SHAPE =====
        if(!isValidBookingInput(payload)){
            return false
        }

        // ===== BUSINESS VALIDATE =====
        if(!validateBooking(payload)){
            return false
        }

        // ===== PAST CHECK =====
        if(isPastBooking(payload)){
            console.warn("❌ BOOKING IN PAST")
            return false
        }

        // ===== SERVICE =====
        const createdBooking = await createBookingAPI(payload)

        // 🔥 SERVICE đã normalize
        addBooking(createdBooking)

        return createdBooking

    }catch(err){

        console.error("❌ STORE CREATE FAIL:", err)

        return false
    }
}


// ===============================
// UPDATE ASYNC
// ===============================
export async function updateBookingAsync(id, patch){

    const index = bookings.findIndex(
        b => String(b.id) === String(id)
    )

    if(index === -1){
        console.warn("❌ BOOKING NOT FOUND:", id)
        return false
    }

    const current = bookings[index]

    const candidate = {
        ...current,
        ...patch
    }

    console.log("🧪 STORE UPDATE INPUT:", candidate)

    // ===== VALIDATE =====
    if(!validateBooking(candidate, id)){
        console.warn("❌ STORE UPDATE VALIDATE FAIL")
        return false
    }

    try{

        // 🔥 SERVICE RETURN NORMALIZED
        const updatedBooking = await updateBookingAPI(
            id,
            candidate
        )

        bookings[index] = updatedBooking

        console.log("✅ STORE UPDATE SUCCESS:", updatedBooking)

        notify()

        return updatedBooking

    }catch(err){

        console.error("❌ STORE UPDATE API FAIL:", err)

        return false
    }
}


// ===============================
// DELETE
// ===============================
export async function deleteBooking(id){

    try{

        await deleteBookingAPI(id)

        removeBooking(id)

        return true

    }catch(err){

        console.error("❌ STORE DELETE FAIL:", err)

        return false
    }
}


// ===============================
// SUBSCRIBE
// ===============================
export function subscribe(fn){

    if(typeof fn !== "function"){
        return
    }

    listeners.push(fn)
}


// ===============================
// INTERNAL: NOTIFY
// ===============================
function notify(){

    const state = getBookings()

    console.log("📦 BOOKING STORE STATE:", state)

    listeners.forEach(fn => fn(state))
}


// ===============================
// INTERNAL: VALIDATE
// ===============================
function validateBooking(booking, ignoreId = null){

    const error = validateBookingCore(booking, {
        bookings,
        blocks: getBlocks(),
        ignoreId
    })

    if(error){

        console.warn(
            "❌ BOOKING VALIDATE FAIL:",
            error,
            booking
        )

        return false
    }

    return true
}


// ===============================
// SHAPE GUARD
// ===============================
function isValidBookingShape(b){

    if(!b) return false

    return (
        b.id != null &&
        b.court_id != null &&
        b.date &&
        b.start != null &&
        b.end != null
    )
}


// ===============================
// INPUT GUARD
// ===============================
function isValidBookingInput(b){

    if(!b) return false

    return (
        b.court_id != null &&
        b.date &&
        b.start != null &&
        b.end != null
    )
}


// ===============================
// PAST CHECK
// ===============================
function isPastBooking(booking){

    if(!booking?.date) return false

    const now = new Date()

    const nowDate = now.toISOString().slice(0, 10)

    const nowMinutes =
        now.getHours() * 60 +
        now.getMinutes()

    return (
        booking.date < nowDate ||
        (
            booking.date === nowDate &&
            booking.start < nowMinutes
        )
    )
}

// ===============================
// SORT
// ===============================
function sortBookings(a, b){

    if(a.court_id !== b.court_id){
        return a.court_id - b.court_id
    }

    return a.start - b.start
}


// ===============================
// PUBLIC VALIDATION API
// ===============================
export function canCreateBooking(data){
    return validateBooking(data)
}

export function canUpdateBooking(data, id){
    return validateBooking(data, id)
}


// ===============================
// DEBUG
// ===============================
window.canCreateBooking = canCreateBooking
window.canUpdateBooking = canUpdateBooking
window.createBooking = createBooking