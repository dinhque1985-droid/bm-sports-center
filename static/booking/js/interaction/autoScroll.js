const EDGE_SIZE = 120
const SCROLL_SPEED = 25

export function handleAutoScroll(e, container){

    const rect = container.getBoundingClientRect()

    let scrolled = false

    if(e.clientX > rect.right - EDGE_SIZE){
        container.scrollLeft += SCROLL_SPEED
        scrolled = true
    }
    else if(e.clientX < rect.left + EDGE_SIZE){
        container.scrollLeft -= SCROLL_SPEED
        scrolled = true
    }

    return scrolled   // 🔥 QUAN TRỌNG
}