
export const OPEN_MINUTE = 5 * 60
export const CLOSE_MINUTE = 23 * 60

export const SLOT_MINUTE = 15

export const HOUR_WIDTH = 120
export const PIXEL_PER_MINUTE = HOUR_WIDTH / 60

export const TOTAL_MINUTES = (CLOSE_MINUTE - OPEN_MINUTE)
export const TIMELINE_WIDTH = TOTAL_MINUTES * PIXEL_PER_MINUTE


console.log("TIMELINE_WIDTH:", TIMELINE_WIDTH)
console.log("HOUR_WIDTH:", HOUR_WIDTH)
console.log("TOTAL_MINUTES:", TOTAL_MINUTES)


// ==== TIME → PIXEL ==== //
export function minutesToPixel(min){
    return (min - OPEN_MINUTE) * PIXEL_PER_MINUTE
}

// ==== PIXEL → TIME ==== //
export function pixelToMinutes(px){
    return Math.round(px / PIXEL_PER_MINUTE) + OPEN_MINUTE
}

// ==== SNAP ==== //
export function snapMinutes(min){
    const relative = min - OPEN_MINUTE
    const snapped = Math.round(relative / SLOT_MINUTE) * SLOT_MINUTE
    return snapped + OPEN_MINUTE
}

// ==== FORMAT ==== //
export function minutesToTime(min){
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// ==== CLAMP ==== //
export function clampMinutes(min){
    return Math.max(OPEN_MINUTE, Math.min(min, CLOSE_MINUTE))
}

// ==== MINUTE <-> HH:MM ==== //
export function hhmmToMinutes(str){
    const [h, m] = str.split(":").map(Number)
    return h * 60 + m
}

export function minutesToHHMM(min){
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}