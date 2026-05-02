/**
 * timelineService.js
 * 🎯 TIMELINE CONTRACT LAYER DUY NHẤT
 *
 * RULE:
 * ✅ Timeline chỉ lấy dữ liệu từ bookingService + blockService
 * ✅ Timeline chỉ trả về 1 shape chuẩn duy nhất cho UI
 * ✅ UI render timeline không cần biết booking/block API riêng
 * ❌ UI không tự merge
 * ❌ Store không tự expand block
 */
import { assertTimelineItem } from "../models/timelineModel.js"
import { fetchBookings } from "./bookingService.js"
import { fetchBlocks } from "./blockService.js"

console.log("🔥 timelineService loaded")


// ===============================
// PUBLIC API
// ===============================
export async function getTimeline(date){

    if(!date){
        throw new Error("Missing date for getTimeline")
    }

    const [bookings, blocks] = await Promise.all([
        fetchBookings(date),
        fetchBlocks(date)
    ])

    const items = normalizeTimeline(bookings, blocks, date)

    console.log("🧠 TIMELINE CONTRACT:", items)

    return items
}


// ===============================
// MAIN NORMALIZER
// ===============================
function normalizeTimeline(bookings, blocks, targetDate){

    if(!Array.isArray(bookings)){
        throw new Error("Invalid bookings input")
    }

    if(!Array.isArray(blocks)){
        throw new Error("Invalid blocks input")
    }

    if(!targetDate){
        throw new Error("Missing targetDate")
    }

    const bookingItems = bookings.map(normalizeBookingItem)

    const blockItems = expandBlocks(blocks, targetDate)

    // 🔥 SORT DUY NHẤT TOÀN HỆ
    return [...bookingItems, ...blockItems]
        .sort(sortTimelineItems)
}


// ===============================
// BOOKING → TIMELINE ITEM
// ===============================
function normalizeBookingItem(b){

    const item = {
        id: String(b.id),

        source_id: String(b.id),

        type: "booking",

        court_id: Number(b.court_id),

        date: b.date,

        start: Number(b.start),
        end: Number(b.end),

        price: Number(b.price || 0),

        meta: {
            customer: b.customer || "Khách",
            phone: b.phone || "",
            paid: Boolean(b.paid)
        }
    }

    assertTimelineItem(item)

    return item
}

// ===============================
// BLOCK → TIMELINE ITEM(S)
// ===============================
function expandBlocks(blocks, targetDate){

    const items = []

    for(const b of blocks){

        if(!isBlockActiveOnDate(b, targetDate)){
            continue
        }

        items.push(
            normalizeBlockItem(b, targetDate)
        )
    }

    return items
}


// ===============================
// BLOCK ACTIVE CHECK
// ===============================
function isBlockActiveOnDate(block, targetDate){

    if(
        !block ||
        !targetDate ||
        !block.date_from ||
        !block.date_to
    ){
        return false
    }

    return !(
        targetDate < block.date_from ||
        targetDate > block.date_to
    )
}

// ===============================
// SINGLE BLOCK ITEM
// ===============================
function normalizeBlockItem(block, targetDate){

    const item = {
        id: `block-${block.id}-${targetDate}`,

        source_id: String(block.id),

        type: "block",

        court_id: Number(block.court_id),

        date: targetDate,

        start: Number(block.start),
        end: Number(block.end),

        price: Number(block.price || 0),

        meta: {
            rule_type: block.rule_type || "normal",

            pricing_factor: Number(
                block.pricing_factor || 1
            ),

            reason: block.reason || ""
        }
    }

    assertTimelineItem(item)

    return item
}

// ===============================
// GLOBAL SORT
// court → time → type
// ===============================
function sortTimelineItems(a, b){

    // ===== COURT =====
    if(a.court_id !== b.court_id){
        return a.court_id - b.court_id
    }

    // ===== START =====
    if(a.start !== b.start){
        return a.start - b.start
    }

    // ===== BLOCK ƯU TIÊN TRƯỚC BOOKING nếu trùng giờ =====
    if(a.type !== b.type){
        if(a.type === "block") return -1
        if(b.type === "block") return 1
    }

    return 0
}


// ===============================
// DEBUG
// ===============================
window.getTimeline = getTimeline