/**
 * bookingRequestList.js
 * 🎯 ROLE-AWARE BOOKING REQUEST PANEL
 * Guest: gửi + theo dõi
 * Staff/Admin: full approve/reject
 */

import {
    getRequests,
    loadRequests,
    approveRequest,
    rejectRequest,
    subscribeRequests
} from "../state/bookingRequestStore.js"

import {
    fetchBookings
} from "../services/bookingService.js"

import {
    fetchBlocks
} from "../services/blockService.js"

import {
    setBookings
} from "../state/bookingStore.js"

import {
    setBlocks
} from "../state/blockStore.js"

import {
    getCurrentDate
} from "../timeline/timelineDate.js"

import {
    showToast
} from "./toast.js"


// ===============================
// ROLE
// ===============================
const ROLE =
    document.body.dataset.role || "guest"

const isGuest =
    ROLE === "guest"

const isAdmin =
    ROLE === "admin" ||
    ROLE === "staff"


// ===============================
// INIT
// ===============================
export async function initBookingRequestList(){

    bindFilter()

    subscribeRequests(
        renderRequestList
    )

    await loadRequests(
        getCurrentRequestFilter()
    )

    updatePanelTitle()
}

// ===============================
// FILTER
// ===============================
function bindFilter(){
    
    if(isGuest){
        return
    }

    const filter =
        document.getElementById(
            "request-status-filter"
        )

    if(!filter) return

    filter.onchange =
        async () => {

            await loadRequests(
                getCurrentRequestFilter()
            )
        }
}


// ===============================
// PANEL TITLE
// ===============================
function updatePanelTitle(){

    const title =
        document.querySelector(
            "#booking-request-panel h2"
        )

    if(!title) return

    title.innerText =
        isGuest
            ? "📨 THEO DÕI YÊU CẦU ĐẶT SÂN"
            : "📨 YÊU CẦU CHỜ DUYỆT"
}


// ===============================
// RENDER
// ===============================
function renderRequestList(){

    const table =
        document.getElementById(
            "booking-request-table"
        )

    if(!table){
        return
    }

    // ===== SUPPORT BOTH TABLE + TBODY =====
    const tbody =
        table.querySelector("tbody") ||
        table

    const requests =
        getRequests()

    // ===== INVALID =====
    if(
        !Array.isArray(
            requests
        )
    ){

        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;">
                    Không có dữ liệu
                </td>
            </tr>
        `

        return
    }

    // ===== EMPTY =====
    if(
        requests.length === 0
    ){

        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;">
                    Không có yêu cầu
                </td>
            </tr>
        `

        return
    }

    // ===== RENDER =====
    tbody.innerHTML =
        requests.map(
            renderRow
        ).join("")

    bindActions()
}

// ===============================
// ROW
// ===============================
function renderRow(r){

    return `
        <tr data-id="${r.id}">
            ${isGuest ? "" : `<td>${r.id}</td>`}

            <td>${safe(r.court_id)}</td>

            <td>${safe(r.date)}</td>

            <td>
                ${toHHMM(r.start)}
                -
                ${toHHMM(r.end)}
            </td>

            <td>
                ${escapeHTML(r.customer)}
            </td>

            <td>
                ${escapeHTML(r.phone)}
            </td>

            <td>
                ${formatPrice(
                    r.estimated_price
                )}
            </td>

            <td class="${getStatusClass(r.status)}">
                ${safeStatus(r.status)}
            </td>

            <td>
                ${formatAdminNote(
                    r.admin_note
                )}
            </td>

            <td class="request-actions">
                ${formatRequestActions(r)}
            </td>
        </tr>
    `
}


// ===============================
// ACTIONS
// ===============================
function bindActions(){

    if(isGuest) return

    document.querySelectorAll(
        "#booking-request-table button"
    ).forEach(btn => {

        btn.onclick = async () => {

            // ===== DOUBLE CLICK GUARD =====
            if(btn.disabled){
                return
            }

            btn.disabled = true

            try{

                const row =
                    btn.closest("tr")

                if(!row){

                    showToast(
                        "Không tìm thấy dữ liệu yêu cầu",
                        "error"
                    )

                    return
                }

                const id =
                    row.dataset.id

                const action =
                    btn.dataset.action

                if(
                    !id ||
                    !action
                ){

                    showToast(
                        "Thiếu thông tin thao tác",
                        "error"
                    )

                    return
                }

                // ===============================
                // APPROVE
                // ===============================
                if(
                    action === "approve"
                ){

                    const ok =
                        confirm(
                            "Duyệt yêu cầu này?"
                        )

                    if(!ok){
                        return
                    }

                    const result =
                        await approveRequest(
                            id
                        )

                    if(result){

                        showToast(
                            "Đã duyệt yêu cầu"
                        )

                        await reloadCoreData()

                    }else{

                        showToast(
                            "Không thể duyệt. Có thể bị block hoặc trùng booking.",
                            "error"
                        )
                    }

                    return
                }


                // ===============================
                // REJECT
                // ===============================
                if(
                    action === "reject"
                ){

                    const reason =
                        prompt(
                            "Lý do từ chối:",
                            "Khung giờ kín"
                        )

                    // ===== CANCEL =====
                    if(
                        reason == null
                    ){
                        return
                    }

                    const cleanReason =
                        reason.trim()

                    // ===== EMPTY =====
                    if(
                        !cleanReason
                    ){

                        showToast(
                            "Vui lòng nhập lý do từ chối",
                            "warning"
                        )

                        return
                    }

                    const result =
                        await rejectRequest(
                            id,
                            cleanReason
                        )

                    if(result){

                        showToast(
                            "Đã từ chối yêu cầu",
                            "warning"
                        )

                        await reloadCoreData()

                    }else{

                        showToast(
                            "Không thể từ chối yêu cầu",
                            "error"
                        )
                    }

                    return
                }


                // ===============================
                // UNKNOWN
                // ===============================
                showToast(
                    "Hành động không hợp lệ",
                    "error"
                )

            }catch(err){

                console.error(
                    "❌ REQUEST ACTION FAIL:",
                    err
                )

                showToast(
                    err.message ||
                    "Thao tác thất bại",
                    "error"
                )

            }finally{

                btn.disabled = false
            }
        }
    })
}

// ===============================
// ACTION HTML
// ===============================
function formatRequestActions(r){

    if(isGuest){

        if(r.status === "pending"){
            return `
                <span class="readonly-status">
                    Đang chờ
                </span>
            `
        }

        if(r.status === "approved"){
        return `
            <span class="readonly-status approved">
                ✓
            </span>
        `
        }

        return `
            <span class="readonly-status rejected">
                x
            </span>
        `
    }

    if(r.status === "approved"){
        return "✓"
    }

    if(r.status === "rejected"){
        return "x"
    }

    return `
        <button data-action="approve">
            ✔
        </button>

        <button data-action="reject">
            ✖
        </button>
    `
}


// ===============================
// GUEST CLEANUP
// ===============================
function cleanupGuestUI(){

    if(!isGuest) return

    document
        .querySelectorAll(
            '[data-role-required="staff"]'
        )
        .forEach(
            el => el.remove()
        )
}


// ===============================
// RELOAD CORE
// ===============================
async function reloadCoreData(){

    const date =
        getCurrentDate()

    if(
        !date
    ){

        showToast(
            "Không xác định được ngày hiện tại",
            "error"
        )

        return false
    }

    try{

        const [
            bookings,
            blocks
        ] = await Promise.all([

            fetchBookings(
                date
            ),

            fetchBlocks(
                date
            )
        ])


        // ===== VALIDATE BOOKINGS =====
        if(
            !Array.isArray(
                bookings
            )
        ){

            throw new Error(
                "Dữ liệu booking không hợp lệ"
            )
        }


        // ===== VALIDATE BLOCKS =====
        if(
            !Array.isArray(
                blocks
            )
        ){

            throw new Error(
                "Dữ liệu block không hợp lệ"
            )
        }


        // ===== UPDATE STORE =====
        setBookings(
            bookings
        )

        setBlocks(
            blocks
        )


        // ===== RELOAD REQUESTS =====
        try{

            await loadRequests(
                getCurrentRequestFilter()
            )

        }catch(requestErr){

            console.error(
                "❌ REQUEST RELOAD FAIL:",
                requestErr
            )

            showToast(
                "Dữ liệu chính đã cập nhật nhưng không thể tải lại danh sách yêu cầu",
                "warning"
            )

            return false
        }


        // ===== SUCCESS =====
        return true

    }catch(err){

        console.error(
            "❌ RELOAD CORE FAIL:",
            err
        )

        showToast(
            err.message ||
            "Không thể tải lại dữ liệu",
            "error"
        )

        return false
    }
}

// ===============================
// HELPERS
// ===============================
function toHHMM(min){

    min = Number(min)

    if(isNaN(min)){
        return "--:--"
    }

    const h =
        Math.floor(min / 60)

    const m =
        min % 60

    return `
        ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}
    `.trim()
}


function formatPrice(v){

    return Number(v || 0)
        .toLocaleString("vi-VN") + "đ"
}


function getStatusClass(status){

    if(status === "approved"){
        return "request-approved"
    }

    if(status === "rejected"){
        return "request-rejected"
    }

    return "request-pending"
}


function escapeHTML(str){

    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}


function formatAdminNote(note){

    if(!note){
        return "-"
    }

    return escapeHTML(note)
}


function getCurrentRequestFilter(){

    return (
        document.getElementById(
            "request-status-filter"
        )?.value || "all"
    )
}


function safe(v){

    return (
        v == null ||
        v === ""
    )
        ? "-"
        : v
}


function safeStatus(status){

    switch(status){

        case "approved":
            return "Đã duyệt"

        case "rejected":
            return "Từ chối"

        case "pending":
        default:
            return "Chờ duyệt"
    }
}
