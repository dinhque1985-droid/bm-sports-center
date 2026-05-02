export function getTimelineX(e, timeline){

    const rect = timeline.getBoundingClientRect()

    const container = timeline.closest(".timeline-container")
    const scrollLeft = container ? container.scrollLeft : 0

    // 🔥 QUAN TRỌNG: CHỈ CÓ CÔNG THỨC NÀY
    const x = e.clientX - rect.left + scrollLeft

    return x
}

export function getBookingId(el){
    return Number(el?.dataset?.id)
}

export function getCourtId(el){
    return Number(el?.dataset?.courtId)
}

export function getCourtName(court_id){

    const id = Number(court_id)

    if(isNaN(id)) return "Không xác định"

    if(id <= 4){
        return `Cầu lông ${id}`
    }

    return `Pickleball ${id - 4}`
}