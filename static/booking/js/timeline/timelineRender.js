// ===== IMPORT =====
import { getCurrentDate } from "./timelineDate.js"
import {
    minutesToTime,
    OPEN_MINUTE,
    CLOSE_MINUTE,
    TIMELINE_WIDTH,
    minutesToPixel,
    PIXEL_PER_MINUTE,
    HOUR_WIDTH
} from "../core/time.js"

import { getBookings, subscribe } from "../state/bookingStore.js"
import { getBlocks, subscribeBlocks } from "../state/blockStore.js"
import { isPastBooking } from "../rules/bookingRules.js"

import { getTimeline } from "../services/timelineService.js"

window.testTimeline = getTimeline
// ================= HELPERS =================

function buildRowMap(){
    const map = {}

    document.querySelectorAll(".court-row").forEach(row => {
        const id = Number(row.dataset.courtId)
        map[id] = row
    })

    return map
}

export function durationToPixel(duration){
    return duration * PIXEL_PER_MINUTE
}

function formatPrice(v){
    if(v == null) return ""
    return Number(v).toLocaleString("vi-VN") + "đ"
}

// ================= HEADER =================


export function renderHeader(){

    const header = document.getElementById("timeline-header")
    if(!header) return

    header.innerHTML = ""

    for(let m = OPEN_MINUTE; m <= CLOSE_MINUTE; m += 60){

        const slot = document.createElement("div")
        slot.className = "time-header"
        slot.innerText = minutesToTime(m)

        const left = minutesToPixel(m)
        slot.style.left = left + "px"

        if(m === OPEN_MINUTE){
            slot.style.transform = "translateX(0)"
        }
        else if(m === CLOSE_MINUTE){
            slot.style.transform = "translateX(-100%)"
        }
        else{
            slot.style.transform = "translateX(-50%)"
        }

        header.appendChild(slot)
    }
}


// ================= COURTS =================

export function renderCourts(){

    console.log("CURRENT DATE:", getCurrentDate())

    const width = TIMELINE_WIDTH + "px"

    // CSS var
    document.documentElement.style.setProperty("--timeline-width", width)
    document.documentElement.style.setProperty("--hour-width", HOUR_WIDTH + "px")

    // tất cả timeline
    document.querySelectorAll(".timeline")
        .forEach(t => t.style.width = width)

    // header
    const header = document.getElementById("timeline-header")
    if(header){
        header.style.width = width
    }

    // inner wrapper (QUAN TRỌNG)
    const inner = document.querySelector(".timeline-inner")
    if(inner){
        inner.style.width = width
    }
}


// ================= MAIN RENDER =================

function renderBooking(bookings){

    // ===== CLEAR OLD =====
    document.querySelectorAll(".booking-layer")
        .forEach(layer => layer.innerHTML = "")
        
    const rowMap = buildRowMap()

    bookings.forEach(b => {

        const row = rowMap[Number(b.court_id)]
        if(!row) return

        const rowDate = row.dataset.date || getCurrentDate()

        const layer = row.querySelector(".booking-layer")
        if(!layer) return

        const block = document.createElement("div")
        block.className = "booking-block"

        block.dataset.id = b.id
        block.dataset.courtId = b.court_id
        block.dataset.start = Number(b.start)
        block.dataset.end = Number(b.end)

        block.innerHTML = `
            <div class="resize-handle left"></div>
            <div class="booking-content">
                <div class="booking-name">${b.customer || "Khách"}</div>
                <div class="booking-price">${formatPrice(b.price)}</div>
            </div>
            <div class="resize-handle right"></div>
        `

        // ===== PAST =====
        if(isPastBooking(rowDate, b.start)){
            block.classList.add("past")
        }

        // ===== POSITION =====
        const left = minutesToPixel(b.start)
        const width = Math.max(5, minutesToPixel(b.end) - left)

        block.style.left = left + "px"
        block.style.width = width + "px"

        layer.appendChild(block)
    })
}

// ================= INIT =================

export function initTimelineRender(){

    renderBooking(getBookings())
    subscribe(renderBooking)

    renderBlocks(getBlocks())
    subscribeBlocks(renderBlocks)
}

// ============= RENDER_BLOCK ============

function isInRange(current, from, to){

    // đảm bảo format YYYY-MM-DD
    const c = String(current).slice(0, 10)
    const f = String(from).slice(0, 10)
    const t = String(to).slice(0, 10)

    return c >= f && c <= t
}

function renderBlocks(blocks){

    // ===== CLEAR =====
    document.querySelectorAll(".block-layer .block-item")
        .forEach(el => el.remove())

    const rowMap = buildRowMap()

    blocks.forEach(b => {

        const row = rowMap[Number(b.court_id)]
        if(!row) return

        const rowDate = row.dataset.date || getCurrentDate()

        if(!isInRange(rowDate, b.date_from, b.date_to)) return

        const layer = row.querySelector(".block-layer")
        if(!layer) return

        const el = document.createElement("div")

        el.classList.add("block-item", "timeline-block")

        el.dataset.blockId = b.id
        el.dataset.courtId = b.court_id
        el.dataset.start = b.start
        el.dataset.end = b.end

        const left = minutesToPixel(b.start)
        const width = Math.max(0, minutesToPixel(b.end) - left)

        el.style.left = left + "px"
        el.style.width = width + "px"
        el.style.zIndex = 2

        el.innerText = b.reason || "BLOCK"
        el.title = b.reason || "Block"

        layer.appendChild(el)
    })
}
