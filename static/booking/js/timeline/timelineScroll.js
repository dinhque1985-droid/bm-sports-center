export function initScroll(){

    const container = document.querySelector(".timeline-container")
    if(!container) return

    container.addEventListener("wheel", function(e){

        // 🔥 KHÔNG SCROLL KHI DRAG
        if(window.IS_DRAGGING) return

        // 🔥 CHỈ ÁP DỤNG TRONG TIMELINE
        if(!e.target.closest(".timeline")) return

        // 🔥 KHÔNG ĐỤNG BOOKING LIST
        if(e.target.closest(".booking-table-wrapper")) return

        // ===== VERTICAL → HORIZONTAL =====
        if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){
            e.preventDefault()

            // 🔥 scale cho mượt
            this.scrollLeft += e.deltaY * 0.8
        }

    }, { passive: false })
}