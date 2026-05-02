// ================= META DETECTOR =================
export function getContextMeta(target){

    if(!target) return null

    // ==================================================
    // SAFETY:
    // Nếu right-click trúng text node / icon / child span
    // normalize lên element gần nhất
    // ==================================================
    const safeTarget =
        target.nodeType === 3
            ? target.parentElement
            : target

    if(!safeTarget) return null

    // ==================================================
    // BOOKING (timeline)
    // ==================================================
    const bookingEl =
        safeTarget.closest(
            ".booking-block"
        )

    if(bookingEl){

        return {
            type: "booking",
            id:
                String(
                    bookingEl.dataset.id || ""
                ) || null,

            courtId:
                Number(
                    bookingEl.dataset.courtId
                ) || null
        }
    }

    // ==================================================
    // BLOCK (timeline)
    // ==================================================
    const blockEl =
        safeTarget.closest(
            ".block-item"
        )

    if(blockEl){

        return {
            type: "block",

            id:
                String(
                    blockEl.dataset.blockId ||
                    blockEl.dataset.id ||
                    ""
                ) || null,

            courtId:
                Number(
                    blockEl.dataset.courtId
                ) || null
        }
    }

    // ==================================================
    // BOOKING ROW (table)
    // ==================================================
    const bookingRow =
        safeTarget.closest(
            "#booking-table tr"
        )

    if(
        bookingRow &&
        bookingRow.dataset.id
    ){

        return {
            type: "booking-row",

            id:
                String(
                    bookingRow.dataset.id
                ),

            courtId:
                Number(
                    bookingRow.dataset.courtId
                ) || null
        }
    }

    // ==================================================
    // BLOCK ROW (table)
    // ==================================================
    const blockRow =
        safeTarget.closest(
            "#block-table tr"
        )

    if(
        blockRow &&
        (
            blockRow.dataset.blockId ||
            blockRow.dataset.id
        )
    ){

        return {
            type: "block-row",

            id:
                String(
                    blockRow.dataset.blockId ||
                    blockRow.dataset.id
                ),

            courtId:
                Number(
                    blockRow.dataset.courtId
                ) || null
        }
    }

    // ==================================================
    // TIMELINE EMPTY
    // QUAN TRỌNG:
    // Hỗ trợ nhiều cấu trúc sau refactor:
    // - .timeline
    // - .timeline-slot
    // - .timeline-cell
    // - .court-row
    // ==================================================
    const timelineSlot =
        safeTarget.closest(
            ".timeline-slot, .timeline-cell, .timeline"
        )

    if(timelineSlot){

        const row =
            timelineSlot.closest(
                ".court-row"
            )

        if(!row){
            return null
        }

        // ===== ưu tiên dataset trực tiếp =====
        let courtId =
            Number(
                timelineSlot.dataset.courtId ||
                row.dataset.courtId
            ) || null

        // ===== fallback sâu hơn =====
        if(!courtId){

            const rowWithCourt =
                safeTarget.closest(
                    "[data-court-id]"
                )

            courtId =
                Number(
                    rowWithCourt?.dataset.courtId
                ) || null
        }

        // ===== minute slot nếu có =====
        const minute =
            Number(
                timelineSlot.dataset.minute ||
                timelineSlot.dataset.start ||
                timelineSlot.dataset.time
            )

        return {
            type: "timeline-empty",
            id: null,

            courtId,

            date:
                timelineSlot.dataset.date ||
                row.dataset.date ||
                null,

            minute:
                isNaN(minute)
                    ? null
                    : minute
        }
    }

    return null
}


// ================= META KEY =================
export function buildMetaKey(meta){

    if(!meta) return null

    return [
        meta.type || "",
        meta.id || "",
        meta.courtId || "",
        meta.date || "",
        meta.minute || ""
    ].join("-")
}