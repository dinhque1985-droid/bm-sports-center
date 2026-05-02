/**
 * createBooking.js
 * 🎯 UI INTERACTION LAYER
 *
 * RULE:
 * ✅ UI chỉ xử lý kéo-thả
 * ✅ UI preview
 * ✅ UI build payload
 * ✅ Store xử lý business thật
 * ❌ Không validate business sâu tại UI
 * ❌ Không gọi API trực tiếp
 */

import {
    OPEN_MINUTE,
    PIXEL_PER_MINUTE,
    snapMinutes,
    clampMinutes,
    minutesToTime
} from "../core/time.js"

import { getCurrentDate } from "../timeline/timelineDate.js"
import { createBooking } from "../state/bookingStore.js"


// ===============================
// PUBLIC HELPER
// ===============================
export function getMinuteFromClick(
    e,
    timeline
){

    const rect =
        timeline.getBoundingClientRect()

    const pixel =
        e.clientX -
        rect.left +
        timeline.scrollLeft

    const minute =
        pixel / PIXEL_PER_MINUTE +
        OPEN_MINUTE

    return snapMinutes(
        clampMinutes(minute)
    )
}



// ===============================
// INIT
// ===============================
export function initCreateBooking(){

    console.log("✅ CREATE READY")

    const preview = createPreview()

    const state = {
        isDragging: false,

        startPixel: 0,

        currentTimeline: null,

        currentRow: null
    }


    // ================= MOUSEDOWN =================
    document.addEventListener(
        "mousedown",
        (e) => {

            const target =
                getValidTimelineTarget(e)

            if(!target){
                return
            }

            const {
                timeline,
                row
            } = target

            state.startPixel =
                getPixelFromEvent(
                    e,
                    timeline
                )

            state.isDragging = true

            state.currentTimeline =
                timeline

            state.currentRow =
                row

            preview.style.display =
                "block"
        }
    )


    // ================= MOUSEMOVE =================
    document.addEventListener(
        "mousemove",
        (e) => {

            if(
                !state.isDragging ||
                !state.currentTimeline
            ){
                return
            }

            renderPreview({
                e,
                preview,
                timeline:
                    state.currentTimeline,
                startPixel:
                    state.startPixel
            })
        }
    )


    // ================= MOUSEUP =================
    document.addEventListener(
        "mouseup",
        async (e) => {

            if(!state.isDragging){
                return
            }

            state.isDragging = false

            preview.style.display =
                "none"

            if(
                !state.currentTimeline ||
                !state.currentRow
            ){
                resetState(state)
                return
            }

            try{

                const payload =
                    buildBookingPayload({
                        e,
                        startPixel:
                            state.startPixel,
                        timeline:
                            state.currentTimeline,
                        row:
                            state.currentRow
                    })

                if(!payload){
                    resetState(state)
                    return
                }

                const ok =
                    await createBooking(
                        payload
                    )

                if(!ok){
                    alert(
                        "Booking không hợp lệ"
                    )
                }

            }catch(err){

                console.error(
                    "❌ CREATE ERROR:",
                    err
                )
            }

            resetState(state)
        }
    )
}



// ===============================
// TARGET DETECTOR
// ===============================
function getValidTimelineTarget(e){

    const realEl =
        document.elementFromPoint(
            e.clientX,
            e.clientY
        )

    if(
        realEl?.closest(
            ".booking-block"
        )
    ){
        return null
    }

    if(
        realEl?.closest(
            ".resize-handle"
        )
    ){
        return null
    }

    const timeline =
        e.target.closest(".timeline")

    const row =
        e.target.closest(".court-row")

    if(!timeline || !row){
        return null
    }

    if(
        row.classList.contains(
            "header-row"
        )
    ){
        return null
    }

    if(e.button !== 0){
        return null
    }

    return {
        timeline,
        row
    }
}



// ===============================
// BUILD PAYLOAD
// ===============================
function buildBookingPayload({
    e,
    startPixel,
    timeline,
    row
}){

    const endPixel =
        getPixelFromEvent(
            e,
            timeline
        )

    const range =
        getTimeRangeFromPixels({
            startPixel,
            endPixel
        })

    if(!range){
        return null
    }

    const {
        start,
        end
    } = range

    const court_id = Number(
        row.dataset.courtId
    )

    const date =
        getCurrentDate()

    if(!date){
        throw new Error(
            "Ngày hiện tại chưa sẵn sàng"
        )
    }

    if(
        isPastTime(date, start)
    ){
        alert(
            "Không thể đặt lịch trong quá khứ"
        )

        return null
    }

    return {
        court_id,
        date,

        start,
        end,

        customer: "Khách",
        phone: "",
        paid: false
    }
}



// ===============================
// PREVIEW
// ===============================
function renderPreview({
    e,
    preview,
    timeline,
    startPixel
}){

    const rect =
        timeline.getBoundingClientRect()

    const currentPixel =
        getPixelFromEvent(
            e,
            timeline
        )

    const left = Math.min(
        startPixel,
        currentPixel
    )

    const right = Math.max(
        startPixel,
        currentPixel
    )

    const width = right - left

    const range =
        getTimeRangeFromPixels({
            startPixel: left,
            endPixel: right
        })

    if(!range){
        return
    }

    preview.style.position =
        "fixed"

    preview.style.left =
        (
            rect.left +
            left -
            timeline.scrollLeft
        ) + "px"

    preview.style.top =
        rect.top + "px"

    preview.style.width =
        width + "px"

    preview.style.height =
        rect.height + "px"

    preview.style.background =
        "#4caf50"

    preview.innerText =
        `${minutesToTime(range.start)} - ${minutesToTime(range.end)}`
}



// ===============================
// TIME RANGE
// ===============================
function getTimeRangeFromPixels({
    startPixel,
    endPixel
}){

    let start =
        startPixel /
        PIXEL_PER_MINUTE +
        OPEN_MINUTE

    let end =
        endPixel /
        PIXEL_PER_MINUTE +
        OPEN_MINUTE

    start = snapMinutes(
        clampMinutes(start)
    )

    end = snapMinutes(
        clampMinutes(end)
    )

    if(end - start < 15){
        return null
    }

    return {
        start,
        end
    }
}



// ===============================
// HELPERS
// ===============================
function getPixelFromEvent(
    e,
    timeline
){

    const rect =
        timeline.getBoundingClientRect()

    return (
        e.clientX -
        rect.left +
        timeline.scrollLeft
    )
}


function createPreview(){

    const preview =
        document.createElement("div")

    preview.className =
        "booking-preview"

    preview.style.display =
        "none"

    document.body.appendChild(
        preview
    )

    return preview
}


function resetState(state){

    state.isDragging = false

    state.startPixel = 0

    state.currentTimeline = null

    state.currentRow = null
}


function isPastTime(
    date,
    start
){

    const now = new Date()

    const today =
        now.toISOString()
            .slice(0, 10)

    if(date !== today){
        return false
    }

    const nowMin =
        now.getHours() * 60 +
        now.getMinutes()

    return start < nowMin
}