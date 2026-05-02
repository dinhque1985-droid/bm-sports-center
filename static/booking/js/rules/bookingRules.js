//==== IMPORT ====//

import {
    OPEN_MINUTE,
    CLOSE_MINUTE,
    snapMinutes,
    clampMinutes
} from "../core/time.js"


// ===== HELPER: LOCAL DATE ===== //

function getTodayLocal(){
    const now = new Date()

    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")

    return `${y}-${m}-${d}`
}


// ===== PAST CHECK ===== //

export function isPastBooking(date, start){

    const now = new Date()
    const today = getTodayLocal()

    const nowMin = now.getHours() * 60 + now.getMinutes()

    if(date < today) return true

    if(date === today && start < nowMin){
        return true
    }

    return false
}


// ===== OVERLAP ===== //

export function isOverlapping(newStart, newEnd, court, bookings, ignoreId=null){

    return bookings.some(b => {

        if(ignoreId && b.id == ignoreId) return false

        if(b.court !== court) return false

        return !(newEnd <= b.start || newStart >= b.end)
    })
}


// ===== CLAMP (CHUẨN HÓA TỌA ĐỘ) ===== //

export function clampBookingTime(date, start, end){

    const now = new Date()
    const today = getTodayLocal()

    const nowMin = now.getHours() * 60 + now.getMinutes()

    // ===== SNAP TRƯỚC (QUAN TRỌNG) =====
    start = snapMinutes(start)
    end   = snapMinutes(end)

    // ===== PAST =====
    if(date === today){

        if(end <= nowMin) return null

        if(start < nowMin){
            start = nowMin
        }
    }

    // ===== OPEN / CLOSE =====
    start = Math.max(start, OPEN_MINUTE)
    end   = Math.min(end, CLOSE_MINUTE)

    // ===== INVALID =====
    if(start >= end) return null

    return { start, end }
}

// ===== CORE VALIDATION (DUY NHẤT) ===== //

export function validateBookingCore(
    b,
    {
        bookings = [],
        blocks = [],
        ignoreId = null
    } = {}
){

    // ===== BASIC =====
    if(!b.date) return "Missing date"
    if(!b.court_id) return "Missing court"

    if(b.start == null || b.end == null){
        return "Missing time"
    }

    if(b.start >= b.end){
        return "Invalid time range"
    }

    // ===== CLAMP + SNAP =====
    const clamped = clampBookingTime(b.date, b.start, b.end)
    if(!clamped){
        return "Time out of range or past"
    }

    const { start, end } = clamped

    // ===== OVERLAP BOOKING =====
    const overlapBooking = bookings.some(x => {

        if(ignoreId && String(x.id) === String(ignoreId)) return false

        if(Number(x.court_id) !== Number(b.court_id)) return false
        if(x.date !== b.date) return false

        return !(end <= x.start || start >= x.end)
    })

    if(overlapBooking){
        return "Overlap booking"
    }

    // ===== OVERLAP BLOCK =====
    const overlapBlock = blocks.some(block => {

        if(Number(block.court_id) !== Number(b.court_id)) return false

        if(b.date < block.date_from || b.date > block.date_to){
            return false
        }

        return !(end <= block.start || start >= block.end)
    })

    if(overlapBlock){
        return "Blocked time"
    }

    return null // ✅ hợp lệ
}

window.validateBookingCore = validateBookingCore