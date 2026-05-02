/**
 * bookingList.js
 * 🎯 PRODUCTION BOOKING LIST
 */

import {
    minutesToTime
} from "../core/time.js"

import {
    subscribe
} from "../state/bookingStore.js"

let allBookings = []

let searchKeyword = ""

let statusFilter = "all"

// ==== FIND & FILTER =====

function getFilteredBookings(){

    return allBookings
        .filter(b => {

            // ===== SEARCH =====
            const keyword =
                searchKeyword.toLowerCase()

            const customer =
                String(
                    b.customer || ""
                ).toLowerCase()

            const phone =
                String(
                    b.phone || ""
                ).toLowerCase()

            const bookedBy =
                String(
                    b.booked_by || ""
                ).toLowerCase()

            const matchesSearch =
                !keyword ||
                customer.includes(keyword) ||
                phone.includes(keyword) ||
                bookedBy.includes(keyword)

            if(!matchesSearch){
                return false
            }

            // ===== STATUS =====
            if(
                statusFilter &&
                statusFilter !== "all"
            ){

                const bookingStatus =
                    getStatus(
                        b.start,
                        b.end,
                        b.date
                    )

                if(
                    bookingStatus !== statusFilter
                ){
                    return false
                }
            }

            return true
        })
        .sort(
            (a, b) =>
                a.court_id - b.court_id ||
                a.start - b.start
        )
}

function bindBookingFilters(){

    const searchInput =
        document.getElementById(
            "search-name"
        )

    const statusSelect =
        document.getElementById(
            "filter-status"
        )

    // ===== STATUS OPTIONS =====
    if(
        statusSelect &&
        !statusSelect.dataset.bound
    ){

        statusSelect.innerHTML = `
            <option value="all">Tất cả</option>
            <option value="Chưa chơi">Chưa chơi</option>
            <option value="Đang chơi">Đang chơi</option>
            <option value="Đã chơi">Đã chơi</option>
        `

        statusSelect.dataset.bound =
            "true"
    }

    // ===== SEARCH =====
    if(
        searchInput &&
        !searchInput.dataset.bound
    ){

        searchInput.addEventListener(
            "input",
            (e) => {

                searchKeyword =
                    e.target.value.trim()

                renderBookingList(
                    allBookings
                )
            }
        )

        searchInput.dataset.bound =
            "true"
    }

    // ===== STATUS =====
    if(
        statusSelect &&
        !statusSelect.dataset.listener
    ){

        statusSelect.addEventListener(
            "change",
            (e) => {

                statusFilter =
                    e.target.value

                renderBookingList(
                    allBookings
                )
            }
        )

        statusSelect.dataset.listener =
            "true"
    }
}

// ===============================
// PRICE
// ===============================
function formatPrice(v){

    if(
        v == null ||
        isNaN(v)
    ){
        return "0đ"
    }

    return Number(v)
        .toLocaleString("vi-VN") + "đ"
}


// ===============================
// COURT
// ===============================
function formatCourt(id){

    const num =
        Number(id)

    if(
        isNaN(num) ||
        num < 1
    ){
        return "N/A"
    }

    return num <= 4
        ? `Cầu lông ${num}`
        : `Pickleball ${num - 4}`
}


// ===============================
// STATUS
// ===============================
function getStatus(
    start,
    end,
    date
){

    if(
        !date ||
        start == null ||
        end == null
    ){
        return "N/A"
    }

    const now =
        new Date()

    const today =
        now.toISOString()
            .slice(0, 10)

    const nowMin =
        now.getHours() * 60 +
        now.getMinutes()

    const bookingDate =
        String(date)
            .slice(0, 10)

    if(
        bookingDate !== today
    ){
        return bookingDate < today
            ? "Đã chơi"
            : "Chưa chơi"
    }

    if(
        nowMin < start
    ){
        return "Chưa chơi"
    }

    if(
        nowMin < end
    ){
        return "Đang chơi"
    }

    return "Đã chơi"
}


// ===============================
// SAFE
// ===============================
function safe(
    val,
    fallback = "-"
){

    return (
        val == null ||
        val === ""
    )
        ? fallback
        : val
}


// ===============================
// ESCAPE
// ===============================
function escapeHTML(str){

    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}


// ===============================
// PAYMENT
// ===============================
function formatPaid(paid){

    return paid
        ? "✔"
        : "✖"
}


// ===============================
// ROW
// ===============================
function formatBookingRow(
    b,
    i
){

    const customer =
        escapeHTML(
            safe(
                b.customer,
                "Khách"
            )
        )

    const phone =
        escapeHTML(
            safe(
                b.phone
            )
        )

    const bookedBy =
        escapeHTML(
            safe(
                b.booked_by ||
                b.customer,
                "-"
            )
        )

    const status =
        getStatus(
            b.start,
            b.end,
            b.date
        )

    return `
        <tr
            class="booking-row"
            data-id="${safe(b.id, "")}"
            data-court-id="${safe(b.court_id, "")}"
            data-start="${safe(b.start, "")}"
            data-end="${safe(b.end, "")}"
        >
            <td>${i + 1}</td>

            <td>
                ${formatCourt(
                    b.court_id
                )}
            </td>

            <td>
                ${customer}
            </td>

            <td>
                ${phone}
            </td>

            <td>
                ${bookedBy}
            </td>

            <td>
                ${
                    b.start != null
                        ? minutesToTime(
                            b.start
                        )
                        : "-"
                }
            </td>

            <td>
                ${
                    b.end != null
                        ? minutesToTime(
                            b.end
                        )
                        : "-"
                }
            </td>

            <td>
                ${formatPrice(
                    b.price ?? 0
                )}
            </td>

            <td>
                ${status}
            </td>

            <td>
                ${formatPaid(
                    b.paid
                )}
            </td>
        </tr>
    `
}


// ===============================
// RENDER
// ===============================
export function renderBookingList(
    bookings
){

    if(
        window.DEBUG
    ){

        console.log(
            "📋 BOOKING LIST INPUT:",
            bookings
        )
    }

    const table =
        document.getElementById(
            "booking-table"
        )

    if(!table){
        return
    }

    // ===== SAFE TARGET =====
    const tbody =
        table.querySelector(
            "tbody"
        ) || table

    // ===== VALIDATE =====
    if(
        !Array.isArray(bookings)
    ){

        console.warn(
            "❌ INVALID BOOKINGS:",
            bookings
        )

        allBookings = []

        tbody.innerHTML = ""

        return
    }

    allBookings = [...bookings]
    const filtered =
        getFilteredBookings()



    // ===== EMPTY =====
    if(filtered.length === 0){

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="
                        text-align:center;
                        padding:16px;
                        color:#777;
                    "
                >
                    Không có booking phù hợp
                </td>
            </tr>
        `

        return
    }

    // ===== RENDER =====
    tbody.innerHTML =
        filtered
            .map(
                (b, i) =>
                    formatBookingRow(
                        b,
                        i
                    )
            )
            .join("")
    }


// ===============================
// INIT
export function initBookingList(){

    bindBookingFilters()

    subscribe(
        renderBookingList
    )
}