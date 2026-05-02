import {
    minutesToPixel,
    OPEN_MINUTE,
    CLOSE_MINUTE
} from "../core/time.js"

// ===== HELPER =====
function getTodayLocal(){
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

export function initNowLine(getCurrentDate){

    function update(){

        const now = new Date()
        const today = getTodayLocal()

        const minutes = now.getHours() * 60 + now.getMinutes()

        const isToday = getCurrentDate() === today
        const inTime = minutes >= OPEN_MINUTE && minutes <= CLOSE_MINUTE

        // 🔥 query lại mỗi frame (safe)
        const timelines = document.querySelectorAll(".timeline")

        timelines.forEach(timeline => {

            let line = timeline.querySelector(".now-line")

            if(!line){
                line = document.createElement("div")
                line.className = "now-line"
                timeline.appendChild(line)
            }

            // ===== HIDE =====
            if(!isToday || !inTime){
                line.style.display = "none"
                return
            }

            line.style.display = "block"

            const x = minutesToPixel(minutes)

            // 🔥 FIX SCROLL (QUAN TRỌNG)
            line.style.left = (x - timeline.scrollLeft) + "px"
        })

        requestAnimationFrame(update)
    }

    update()
}