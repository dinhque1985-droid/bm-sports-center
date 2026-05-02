/**
 * bookingDrag.js
 * 🎯 UI INTERACTION LAYER
 *
 * RULE:
 * ✅ UI xử lý drag / resize
 * ✅ UI preview
 * ✅ UI gọi store
 * ❌ Không gọi API trực tiếp
 * ❌ Không mutate store trực tiếp
 */

import {
    OPEN_MINUTE,
    PIXEL_PER_MINUTE,
    snapMinutes,
    clampMinutes
} from "../core/time.js"

import { getBookings, updateBookingAsync } from "../state/bookingStore.js"
import { getBlocks } from "../state/blockStore.js"

import { validateBookingCore } from "../rules/bookingRules.js"


// ===============================
// INIT
// ===============================
export function initBookingDrag(){

    console.log("🔥 BOOKING DRAG READY")

    const preview = createPreview()

    let dragging = null


    // ================= MOUSEDOWN =================
    document.addEventListener(
        "mousedown",
        (e) => {

            const dragData =
                buildDragState(e)

            if(!dragData){
                return
            }

            e.stopPropagation()

            dragging = dragData

            dragData.block = dragData.timeline
                .querySelector(
                    `.booking-block[data-id="${dragData.id}"]`
                )

            dragData.block?.classList.add(
                "dragging"
            )

            preview.style.display =
                "block"

            document.body.style.userSelect =
                "none"

            window.IS_DRAGGING = true
        }
    )


    // ================= MOUSEMOVE =================
    document.addEventListener(
        "mousemove",
        (e) => {

            if(!dragging){
                return
            }

            const result =
                calculateDragPreview({
                    e,
                    dragging
                })

            if(!result){
                return
            }

            const {
                start,
                end,
                row,
                valid
            } = result

            preview.style.background =
                valid
                    ? "rgba(76,175,80,0.35)"
                    : "rgba(244,67,54,0.35)"

            preview.style.border =
                valid
                    ? "2px dashed #4caf50"
                    : "2px dashed #f44336"
                        
            renderPreview({
                preview,
                timeline: dragging.timeline,
                row,
                start,
                end
            })

            dragging.row = row

            if(!valid){

                dragging.previewStart = null
                dragging.previewEnd = null

                return
            }

            dragging.previewStart = start
            dragging.previewEnd = end

            renderPreview({
                preview,
                timeline:
                    dragging.timeline,
                row,
                start,
                end
            })

            dragging.row = row

            dragging.previewStart =
                start

            dragging.previewEnd =
                end
        }
    )


    // ================= MOUSEUP =================
    document.addEventListener(
        "mouseup",
        async () => {

            if(!dragging){
                return
            }

            // ===== GIỮ REFERENCE TRƯỚC KHI RESET =====
            const currentDrag =
                dragging

            // ===== UI CLEANUP =====
            cleanupDrag(preview)

            // ===== REMOVE VISUAL DRAGGING =====
            currentDrag.block?.classList.remove(
                "dragging"
            )

            // ===== COMMIT STORE UPDATE =====
            const result =
                await commitDrag(
                    currentDrag
                )

            if(result){

                console.log(
                    "✅ DRAG UPDATE SUCCESS:",
                    result
                )

            }else{

                console.log(
                    "↩️ DRAG CANCEL / INVALID"
                )
            }

            // ===== RESET STATE =====
            dragging = null
        }
    )
}



// ===============================
// BUILD DRAG STATE
// ===============================
function buildDragState(e){

    const block =
        e.target.closest(
            ".booking-block"
        )

    if(!block || e.button === 2){
        return null
    }

    const timeline =
        block.closest(".timeline")

    const row =
        block.closest(".court-row")

    if(!timeline || !row){
        return null
    }

    const id = block.dataset.id

    const booking =
        getBookings().find(
            b => String(b.id) === String(id)
        )

    if(!booking){
        return null
    }

    let mode = "move"

    if(
        e.target.closest(
            ".resize-handle.left"
        )
    ){
        mode = "resize-left"
    }

    if(
        e.target.closest(
            ".resize-handle.right"
        )
    ){
        mode = "resize-right"
    }

    return {
        id,

        mode,

        timeline,

        row,

        booking,

        startX: e.clientX,

        originalStart:
            booking.start,

        originalEnd:
            booking.end,

        duration:
            booking.end -
            booking.start,

        previewStart: null,

        previewEnd: null
    }
}



// ===============================
// CALCULATE
// ===============================
function calculateDragPreview({
    e,
    dragging
}){

    const {
        timeline,
        mode,
        originalStart,
        originalEnd,
        duration,
        booking
    } = dragging

    const rect =
        timeline.getBoundingClientRect()

    const pixel =
        (
            e.clientX -
            rect.left
        ) +
        timeline.scrollLeft

    let start
    let end


    // ===== MOVE =====
    if(mode === "move"){

        const deltaPx =
            e.clientX -
            dragging.startX

        const deltaMin =
            deltaPx /
            PIXEL_PER_MINUTE

        start =
            originalStart +
            deltaMin

        end =
            start +
            duration
    }


    // ===== RESIZE LEFT =====
    if(mode === "resize-left"){

        start =
            pixel /
            PIXEL_PER_MINUTE +
            OPEN_MINUTE

        end = originalEnd
    }


    // ===== RESIZE RIGHT =====
    if(mode === "resize-right"){

        start = originalStart

        end =
            pixel /
            PIXEL_PER_MINUTE +
            OPEN_MINUTE
    }


    start = snapMinutes(
        clampMinutes(start)
    )

    end = snapMinutes(
        clampMinutes(end)
    )

    if(end - start < 15){
        return null
    }


    // ===== CHANGE COURT =====
    const el =
        document.elementFromPoint(
            e.clientX,
            e.clientY
        )

    const newRow =
        el?.closest(".court-row")

    const row =
        newRow || dragging.row

    const court_id = Number(
        row.dataset.courtId
    )

    const date =
        booking.date


    // ===== VALIDATE =====
    const error =
        validateBookingCore(
            {
                court_id,
                date,
                start,
                end
            },
            {
                bookings:
                    getBookings(),

                blocks:
                    getBlocks(),

                ignoreId:
                    dragging.id
            }
        )

    return {
        start,
        end,
        row,

        valid: !error
    }
}



// ===============================
// PREVIEW RENDER
// ===============================
function renderPreview({
    preview,
    timeline,
    row,
    start,
    end
}){

    const timelineRect =
        timeline.getBoundingClientRect()

    const rowRect =
        row.getBoundingClientRect()

    const leftPx =
        (
            start -
            OPEN_MINUTE
        ) *
        PIXEL_PER_MINUTE

    const widthPx =
        (
            end -
            start
        ) *
        PIXEL_PER_MINUTE

    preview.style.left =
        (
            timelineRect.left +
            leftPx -
            timeline.scrollLeft
        ) + "px"

    preview.style.top =
        rowRect.top + "px"

    preview.style.width =
        widthPx + "px"

    preview.style.height =
        rowRect.height + "px"
}



// ===============================
// COMMIT
// ===============================
async function commitDrag(
    dragging
){

    const {
        id,
        previewStart,
        previewEnd,
        row,
        booking
    } = dragging

    if(
        previewStart == null ||
        previewEnd == null
    ){
        return false
    }

    const court_id = Number(
        row.dataset.courtId
    )

    // ===== NO CHANGE =====
    if(
        previewStart ===
            booking.start &&

        previewEnd ===
            booking.end &&

        court_id ===
            booking.court_id
    ){
        return false
    }

    const patch = {
        start: previewStart,

        end: previewEnd,

        court_id
    }

    console.log(
        "🚀 DRAG PATCH:",
        patch
    )

    try{

        return await updateBookingAsync(
            id,
            patch
        )

    }catch(err){

        console.error(
            "❌ DRAG UPDATE FAIL:",
            err
        )

        return false
    }
}



// ===============================
// HELPERS
// ===============================
function createPreview(){

    const preview =
        document.createElement("div")

    preview.className =
        "booking-preview"

    preview.style.display =
        "none"

    preview.style.pointerEvents =
        "none"

    document.body.appendChild(
        preview
    )

    return preview
}


function cleanupDrag(preview){

    document.body.style.userSelect =
        ""

    preview.style.display =
        "none"

    window.IS_DRAGGING = false
}