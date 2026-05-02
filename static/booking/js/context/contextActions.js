/**
 * contextActions.js
 * 🎯 CONTEXT MENU ACTIONS
 * create / save / delete
 */

import {
    createBooking
} from "../state/bookingStore.js"

import {
    getCurrentDate
} from "../timeline/timelineDate.js"

import {
    getMinuteFromClick
} from "../interaction/createBooking.js"

import {
    showToast
} from "../ui/toast.js"


// ===============================
// MAIN
// ===============================
export async function handleAction({
    action,
    meta,
    id,
    event,
    handlers,
    getBookings,
    getBlocks
}){

    if(
        !action ||
        !meta
    ){
        return false
    }

    switch(action){

        case "create-booking":
            return await handleCreate(
                meta,
                event
            )

        case "delete":
            return await handleDelete(
                meta,
                id,
                handlers
            )

        case "save":
            return await handleSave(
                meta,
                id,
                handlers
            )

        case "cancel":
            return true

        default:
            console.warn(
                "⚠ Unknown context action:",
                action
            )

            return false
    }
}


// ===============================
// CREATE
// ===============================
async function handleCreate(
    meta,
    event
){

    if(
        ![
            "timeline-empty",
            "timeline",
            "empty"
        ].includes(meta.type)
    ){
        return false
    }

    const court_id =
        Number(
            meta.courtId
        )

    const date =
        meta.date ||
        getCurrentDate()

    if(
        !court_id ||
        !date
    ){
        showToast(
            "Thiếu dữ liệu sân hoặc ngày",
            "error"
        )

        return false
    }

    const timeline =
        document.querySelector(
            `.court-row[data-court-id="${court_id}"] .timeline`
        ) ||
        document.querySelector(
            `.court-row[data-court-id="${court_id}"]`
        )
    if(!timeline){

        console.warn(
            "❌ Missing timeline or click event"
        )

        showToast(
            "Không thể tạo booking",
            "error"
        )

        return false
    }

    // ===== TIME =====
    let start =
        meta.minute != null
            ? Number(meta.minute)
            : getMinuteFromClick(
                event,
                timeline
            )
    if(
        isNaN(start)
    ){
        showToast(
            "Không xác định được thời gian",
            "error"
        )

        return false
    }

    let end =
        Math.min(
            start + 60,
            1380
        )

    console.log(
        "🧠 CONTEXT CREATE:",
        {
            court_id,
            date,
            start,
            end
        }
    )

    try{

        const ok =
            await createBooking({

                court_id,
                date,
                start,
                end,

                customer:
                    "Khách",

                phone:
                    "",

                paid:
                    false
            })

        if(!ok){

            showToast(
                "Khung giờ không hợp lệ hoặc bị trùng",
                "error"
            )

            return false
        }

        showToast(
            "Đã tạo booking"
        )

        return true

    }catch(err){

        console.error(
            "❌ CREATE ERROR:",
            err
        )

        showToast(
            err.message ||
            "Không thể tạo booking",
            "error"
        )

        return false
    }
}


// ===============================
// DELETE
// ===============================
async function handleDelete(
    meta,
    id,
    handlers
){

    if(
        !id
    ){
        showToast(
            "Thiếu ID dữ liệu",
            "error"
        )

        return false
    }

    let type =
        meta.type

    // ===== CONFIRM =====
    if(
        type === "block" ||
        type === "block-row"
    ){

        if(
            !confirm(
                "Block có thể đang hoạt động.\nChỉ phần tương lai sẽ bị xóa. Tiếp tục?"
            )
        ){
            return false
        }

    }else{

        if(
            !confirm(
                "Xác nhận xóa?"
            )
        ){
            return false
        }
    }

    // ===== NORMALIZE =====
    if(
        type === "booking-row"
    ){
        type = "booking"
    }

    if(
        type === "block-row"
    ){
        type = "block"
    }

    try{

        const result =
            await handlers.delete?.(
                id,
                type
            )

        if(result){

            showToast(
                "Đã xóa thành công",
                "warning"
            )

            return true
        }

        showToast(
            "Không thể xóa",
            "error"
        )

        return false

    }catch(err){

        console.error(
            "❌ DELETE ERROR:",
            err
        )

        showToast(
            err.message ||
            "Xóa thất bại",
            "error"
        )

        return false
    }
}


// ===============================
// SAVE
// ===============================
async function handleSave(
    meta,
    id,
    handlers
){

    let type =
        meta.type

    // ===== ONLY BOOKING =====
    if(
        type !== "booking" &&
        type !== "booking-row"
    ){
        return false
    }

    if(
        type === "booking-row"
    ){
        type = "booking"
    }

    const customer =
        document
            .getElementById(
                "cm-customer"
            )
            ?.value
            .trim()

    const phone =
        document
            .getElementById(
                "cm-phone"
            )
            ?.value
            .trim()

    const startStr =
        document
            .getElementById(
                "cm-start"
            )
            ?.value

    const endStr =
        document
            .getElementById(
                "cm-end"
            )
            ?.value

    if(
        !startStr ||
        !endStr
    ){

        showToast(
            "Thiếu giờ",
            "warning"
        )

        return false
    }

    const start =
        hhmmToMinutes(
            startStr
        )

    const end =
        hhmmToMinutes(
            endStr
        )

    if(
        isNaN(start) ||
        isNaN(end)
    ){

        showToast(
            "Giờ không hợp lệ",
            "error"
        )

        return false
    }

    if(
        start >= end
    ){

        showToast(
            "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
            "warning"
        )

        return false
    }

    const paid =
        document
            .getElementById(
                "cm-paid"
            )
            ?.checked || false

    const payload = {

        customer:
            customer || "Khách",

        phone:
            phone || "",

        start,
        end,

        paid
    }

    try{

        const result =
            await handlers.save?.(
                id,
                payload,
                type
            )

        if(result){

            showToast(
                "Đã cập nhật booking"
            )

            return true
        }

        showToast(
            "Không thể cập nhật booking",
            "error"
        )

        return false

    }catch(err){

        console.error(
            "❌ SAVE ERROR:",
            err
        )

        showToast(
            err.message ||
            "Lưu thất bại",
            "error"
        )

        return false
    }
}


// ===============================
// HELPERS
// ===============================
function hhmmToMinutes(
    str
){

    if(
        !str ||
        !str.includes(":")
    ){
        return NaN
    }

    const [
        h,
        m
    ] = str
        .split(":")
        .map(Number)

    if(
        isNaN(h) ||
        isNaN(m)
    ){
        return NaN
    }

    return h * 60 + m
}