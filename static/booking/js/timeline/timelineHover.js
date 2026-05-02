import {
    OPEN_MINUTE,
    SLOT_MINUTE,
    PIXEL_PER_MINUTE,
    minutesToTime,
    snapMinutes,
    clampMinutes
} from "../core/time.js"

export function initHover(){

    console.log("✅ HOVER READY")

    const hoverDisplay = document.getElementById("hover-time-display")

    if(!hoverDisplay){
        console.warn("❌ hover-time-display not found")
        return
    }

    // ===== STATE =====
    let lastMinute = null
    let currentRow = null
    let isScrolling = false

    // ===== HOVER COLUMN =====
    const hoverCol = document.createElement("div")
    hoverCol.className = "hover-col"
    hoverCol.style.pointerEvents = "none"
    document.body.appendChild(hoverCol)

    // ===== SCROLL DETECT (CHUẨN HƠN) =====
    const scrollContainer = document.querySelector(".timeline-container")

    scrollContainer?.addEventListener("scroll", () => {
        isScrolling = true
        setTimeout(() => isScrolling = false, 60)
    })

    // ===== MAIN HOVER =====
    document.addEventListener("pointermove", (e) => {

        if(isScrolling) return

        const timeline = e.target.closest(".timeline")
        const row = e.target.closest(".court-row")

        // ===== OUTSIDE =====
        if(!timeline){
            hideAll()
            return
        }

        const rect = timeline.getBoundingClientRect()

        // ===== PIXEL → TIME =====
        const pixel = e.clientX - rect.left + timeline.scrollLeft

        let minute = pixel / PIXEL_PER_MINUTE + OPEN_MINUTE

        // 🔥 chuẩn thứ tự
        minute = clampMinutes(minute)
        const snapped = snapMinutes(minute)

        // ===== CACHE =====
        if(snapped === lastMinute && currentRow === row){
            return
        }

        lastMinute = snapped

        // ===== SNAP → PIXEL =====
        const snapPixel = (snapped - OPEN_MINUTE) * PIXEL_PER_MINUTE
        const slotWidth = SLOT_MINUTE * PIXEL_PER_MINUTE

        const colLeft = rect.left + snapPixel - timeline.scrollLeft

        // ===== HOVER COLUMN =====
        const container = timeline.closest(".timeline-container")
        const containerRect = container.getBoundingClientRect()

        hoverCol.style.display = "block"
        hoverCol.style.position = "fixed"
        hoverCol.style.top = containerRect.top + "px"
        hoverCol.style.left = colLeft + "px"
        hoverCol.style.width = slotWidth + "px"
        hoverCol.style.height = containerRect.height + "px"


        // ===== TIME DISPLAY =====
        hoverDisplay.style.display = "block"
        hoverDisplay.style.position = "fixed"
        hoverDisplay.innerText = minutesToTime(snapped)

        hoverDisplay.style.left = (e.clientX + 12) + "px"
        hoverDisplay.style.top = (e.clientY + 12) + "px"

        // ===== DEBUG (OPTIONAL) =====
        // console.log({
        //     court: row.dataset.courtId,
        //     date: row.dataset.date,
        //     minute: snapped
        // })
    })

    // ===== CLEANUP =====
    function hideAll(){
        hoverCol.style.display = "none"
        // hoverRow.style.display = "none"
        hoverDisplay.style.display = "none"

        lastMinute = null
        // currentRow = null
    }
}