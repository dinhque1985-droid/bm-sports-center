import { subscribeBlocks } from "../state/blockStore.js"

// ===== FORMAT TIME =====
function formatTime(min){
    if(min == null || isNaN(min)) return "--:--"

    const h = Math.floor(min / 60)
    const m = min % 60

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// ===== FORMAT COURT =====
function formatCourt(id){

    const num = Number(id)

    if (
        isNaN(num) ||
        num < 1
    ){
        console.warn("Invalid block court_id:", id)
        return "N/A"
    }

    return num <= 4
        ? `Cầu lông ${num}`
        : `Pickleball ${num - 4}`
}

// ===== SAFE =====
function safe(val, fallback = "-"){
    return (
        val == null ||
        val === ""
    )
        ? fallback
        : val
}

// ===== PRICE ====
function formatPrice(v){

    if(v == null || isNaN(v)) return "0đ"

    return Number(v).toLocaleString("vi-VN") + "đ"
}

function formatRuleType(type){

    switch(type){
        case "monthly":
            return `<span class="badge monthly">Tháng</span>`

        case "peak":
            return `<span class="badge peak">Cao điểm</span>`

        case "normal":
        default:
            return `<span class="badge normal">Thường</span>`
    }
}

function formatFactor(factor){

    if(
        Number(factor) === 1 ||
        !factor
    ){
        return ""
    }

    return `<small class="factor">×${factor}</small>`
}

function escapeHTML(str){
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

// ===== ROW =====
function formatBlockRow(b, i){

    if(window.DEBUG){
        console.log("BLOCK:", b)
    }

    const ruleTypeLabel = formatRuleType(b.rule_type || "normal")

    const price = formatPrice(
        b.total_price ?? b.price ?? 0
    )

    const factor = formatFactor(b.pricing_factor || 1)

    return `
        <tr 
            class="block-row"
            data-block-id="${b.id}"
            data-court-id="${b.court_id}"
            data-start="${b.start}"
            data-end="${b.end}"
        >
            <td>${i + 1}</td>

            <td>${formatCourt(b.court_id)}</td>

            <td>${safe(b.date_from)}</td>
            <td>${safe(b.date_to)}</td>

            <td>${formatTime(b.start)}</td>
            <td>${formatTime(b.end)}</td>

            <td>${ruleTypeLabel}</td>

            <td>
                ${price}
                ${factor}
            </td>

            <td>${escapeHTML(safe(b.reason))}</td>
        </tr>
    `
}

// ===== RENDER =====
function renderBlockList(blocks){

    const table =
        document.getElementById(
            "block-table"
        )

    if(!table){
        return
    }

    // ===== TARGET SAFE =====
    const tbody =
        table.querySelector(
            "tbody"
        ) || table

    // ===== VALIDATE =====
    if(
        !Array.isArray(
            blocks
        )
    ){

        console.warn(
            "❌ INVALID BLOCKS:",
            blocks
        )

        tbody.innerHTML = ""

        return
    }

    // ===== SORT =====
    blocks.sort(
        (a, b) =>
            (a.court_id || 0) -
                (b.court_id || 0) ||

            (a.start || 0) -
                (b.start || 0)
    )

    // ===== EMPTY =====
    if(
        blocks.length === 0
    ){

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding: 16px;
                        color: #777;
                    "
                >
                    Không có block trong ngày này
                </td>
            </tr>
        `

        return
    }

    // ===== RENDER =====
    tbody.innerHTML =
        blocks
            .map(
                (b, i) =>
                    formatBlockRow(
                        b,
                        i
                    )
            )
            .join("")
}

// ===== INIT =====
export function initBlockList(){
    subscribeBlocks(renderBlockList)
}