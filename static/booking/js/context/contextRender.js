// ================= HELPERS =================
function minutesToHHMM(min){

    if(
        min == null ||
        isNaN(min)
    ){
        return ""
    }

    const h =
        Math.floor(min / 60)

    const m =
        min % 60

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}


function escapeHTML(str){

    if(
        str == null ||
        str === ""
    ){
        return ""
    }

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}


function formatPrice(v){

    if(
        v == null ||
        isNaN(v)
    ){
        return ""
    }

    return (
        Number(v)
            .toLocaleString("vi-VN") + "đ"
    )
}


// ==================================================
// PURE UI ONLY:
// chỉ đọc DOM label hiện có
// không business logic
// ==================================================
function getCourtNameFromDOM(courtId){

    if(!courtId){
        return "Chưa rõ sân"
    }

    const row =
        document.querySelector(
            `.court-row[data-court-id="${courtId}"]`
        )

    const courtName =
        row?.querySelector(
            ".court-name"
        )?.innerText

    return (
        courtName ||
        `Sân ${courtId}`
    )
}


// ==================================================
// UI HELPER
// ==================================================
function renderField(
    label,
    content
){

    return `
        <div class="form-row">
            <label>${label}</label>
            ${content}
        </div>
    `
}


function renderActionButton(
    action,
    text,
    extraClass = ""
){

    return `
        <button
            type="button"
            data-action="${action}"
            class="${extraClass}"
        >
            ${text}
        </button>
    `
}


function renderActions(
    buttons = []
){

    return `
        <div class="form-actions">
            ${buttons.join("")}
        </div>
    `
}


// ==================================================
// EMPTY / CREATE
// ==================================================
function renderEmptyMenu(meta = {}){

    const courtName =
        getCourtNameFromDOM(
            meta.courtId
        )

    return `
        <div class="context-form context-empty">

            ${renderField(
                "Sân",
                `<input value="${escapeHTML(courtName)}" disabled>`
            )}

            ${
                meta.date
                    ? renderField(
                        "Ngày",
                        `<input value="${escapeHTML(meta.date)}" disabled>`
                    )
                    : ""
            }

            ${
                meta.minute != null
                    ? renderField(
                        "Giờ",
                        `<input value="${minutesToHHMM(meta.minute)}" disabled>`
                    )
                    : ""
            }

            ${renderActions([
                renderActionButton(
                    "create-booking",
                    "➕ Đặt sân"
                ),

                renderActionButton(
                    "cancel",
                    "❌ Hủy"
                )
            ])}

        </div>
    `
}


// ==================================================
// BOOKING
// ==================================================
function renderBookingMenu(
    booking,
    meta = {}
){

    if(!booking){
        return renderEmptyMenu(meta)
    }

    return `
        <div class="context-form context-booking">

            ${renderField(
                "Sân",
                `<input value="${escapeHTML(
                    getCourtNameFromDOM(
                        booking.court_id ||
                        meta.courtId
                    )
                )}" disabled>`
            )}

            ${renderField(
                "Khách",
                `
                <input
                    id="cm-customer"
                    value="${escapeHTML(
                        booking.customer
                    )}"
                >
                `
            )}

            ${renderField(
                "SĐT",
                `
                <input
                    id="cm-phone"
                    value="${escapeHTML(
                        booking.phone
                    )}"
                >
                `
            )}

            ${renderField(
                "Bắt đầu",
                `
                <input
                    id="cm-start"
                    type="time"
                    value="${minutesToHHMM(
                        booking.start
                    )}"
                >
                `
            )}

            ${renderField(
                "Kết thúc",
                `
                <input
                    id="cm-end"
                    type="time"
                    value="${minutesToHHMM(
                        booking.end
                    )}"
                >
                `
            )}

            ${renderField(
                "Giá",
                `
                <input
                    value="${formatPrice(
                        booking.total_price ??
                        booking.price
                    )}"
                    disabled
                >
                `
            )}

            ${renderField(
                "Thanh toán",
                `
                <input
                    id="cm-paid"
                    type="checkbox"
                    ${
                        booking.paid
                            ? "checked"
                            : ""
                    }
                >
                `
            )}

            ${renderActions([
                renderActionButton(
                    "save",
                    "💾 Lưu"
                ),

                renderActionButton(
                    "delete",
                    "🗑️ Xóa"
                ),

                renderActionButton(
                    "cancel",
                    "❌ Hủy"
                )
            ])}

        </div>
    `
}


// ==================================================
// BLOCK
// ==================================================
function renderBlockMenu(
    block,
    meta = {}
){

    if(!block){
        return renderEmptyMenu(meta)
    }

    return `
        <div class="context-form context-block">

            ${renderField(
                "Sân",
                `<input value="${escapeHTML(
                    getCourtNameFromDOM(
                        block.court_id ||
                        meta.courtId
                    )
                )}" disabled>`
            )}

            ${renderField(
                "Từ ngày",
                `
                <input
                    value="${escapeHTML(
                        block.date_from
                    )}"
                    disabled
                >
                `
            )}

            ${renderField(
                "Đến ngày",
                `
                <input
                    value="${escapeHTML(
                        block.date_to
                    )}"
                    disabled
                >
                `
            )}

            ${renderField(
                "Bắt đầu",
                `
                <input
                    value="${minutesToHHMM(
                        block.start
                    )}"
                    disabled
                >
                `
            )}

            ${renderField(
                "Kết thúc",
                `
                <input
                    value="${minutesToHHMM(
                        block.end
                    )}"
                    disabled
                >
                `
            )}

            ${renderField(
                "Lý do",
                `
                <input
                    value="${escapeHTML(
                        block.reason
                    )}"
                    disabled
                >
                `
            )}

            ${renderActions([
                renderActionButton(
                    "delete",
                    "🗑️ Xóa block"
                ),

                renderActionButton(
                    "cancel",
                    "❌ Hủy"
                )
            ])}

        </div>
    `
}


// ==================================================
// MAIN PURE RENDER
// ==================================================
export function renderMenu(
    meta,
    data
){

    if(
        !meta ||
        !meta.type
    ){
        return ""
    }

    // ===== BOOKING =====
    if(
        meta.type === "booking" ||
        meta.type === "booking-row"
    ){

        return renderBookingMenu(
            data,
            meta
        )
    }

    // ===== BLOCK =====
    if(
        meta.type === "block" ||
        meta.type === "block-row"
    ){

        return renderBlockMenu(
            data,
            meta
        )
    }

    // ===== EMPTY =====
    if(
        meta.type === "timeline-empty" ||
        meta.type === "timeline" ||
        meta.type === "empty"
    ){

        return renderEmptyMenu(
            meta
        )
    }

    return ""
}