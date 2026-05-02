/**
 * guestBookingForm.js
 * 🎯 GUEST BOOKING REQUEST FORM
 * Refactor-safe / Single source of truth
 */

import {
    createRequest
} from "../state/bookingRequestStore.js"

import {
    getCurrentDate
} from "../timeline/timelineDate.js"

import {
    showToast
} from "./toast.js"


// ===============================
// DOM IDS
// ===============================
const IDS = {
    modal: "guest-booking-modal",
    backdrop: "gbm-backdrop",

    openBtn: "open-guest-booking",
    closeBtn: "gbf-close",
    cancelBtn: "gbf-cancel",
    submitBtn: "gbf-submit",

    court: "gbf-court",
    date: "gbf-date",
    start: "gbf-start",
    end: "gbf-end",
    customer: "gbf-customer",
    phone: "gbf-phone",
    note: "gbf-note"
}


// ===============================
// STATE
// ===============================
let initialized = false


// ===============================
// HELPERS
// ===============================
function $(id){
    return document.getElementById(id)
}

function getModal(){
    return $(IDS.modal)
}

function getValue(id){
    return $(id)?.value?.trim?.() || ""
}

function setValue(id, value){
    const el = $(id)
    if(el){
        el.value = value ?? ""
    }
}


// ===============================
// INIT
// ===============================
export function initGuestBookingForm(){

    if(initialized){
        return
    }

    initialized = true

    bindGuestForm()
    populateCourtOptions()
}


// ===============================
// POPULATE COURTS
// ===============================
function populateCourtOptions(){

    const select = $(IDS.court)

    if(!select){
        console.warn("❌ Court select missing")
        return
    }

    const courtRows =
        [...document.querySelectorAll(".court-row")]

    if(!courtRows.length){

        select.innerHTML = `
            <option value="">
                Không có sân
            </option>
        `

        return
    }

    select.innerHTML = `
        <option value="">
            -- Chọn sân --
        </option>
        ${
            courtRows.map(row => {

                const courtId =
                    row.dataset.courtId || ""

                const courtName =
                    row.querySelector(".court-name")
                        ?.innerText
                        ?.trim() ||
                    `Sân ${courtId}`

                return `
                    <option value="${courtId}">
                        ${courtName}
                    </option>
                `
            }).join("")
        }
    `
}


// ===============================
// BIND
// ===============================
function bindGuestForm(){

    const modal = getModal()

    if(!modal){
        console.warn("❌ Guest booking modal missing")
        return
    }

    // ===== OPEN =====
    $(IDS.openBtn)?.addEventListener(
        "click",
        (e) => {
            e.preventDefault()
            openGuestForm()
        }
    )

    // ===== CLOSE =====
    $(IDS.closeBtn)?.addEventListener(
        "click",
        (e) => {
            e.preventDefault()
            closeGuestForm()
        }
    )

    $(IDS.cancelBtn)?.addEventListener(
        "click",
        (e) => {
            e.preventDefault()
            closeGuestForm()
        }
    )

    // ===== SUBMIT =====
    $(IDS.submitBtn)?.addEventListener(
        "click",
        async (e) => {
            e.preventDefault()
            await submitGuestForm()
        }
    )

    // ===== BACKDROP =====
    $(IDS.backdrop)?.addEventListener(
        "click",
        closeGuestForm
    )

    // ===== CLICK OUTSIDE =====
    modal.addEventListener(
        "click",
        (e) => {
            if(e.target === modal){
                closeGuestForm()
            }
        }
    )

    // ===== ESC =====
    document.addEventListener(
        "keydown",
        (e) => {
            if(
                e.key === "Escape" &&
                !modal.hidden
            ){
                closeGuestForm()
            }
        }
    )
}


// ===============================
// OPEN
// ===============================
export function openGuestForm(prefill = {}){

    populateCourtOptions()

    const modal = getModal()

    if(!modal){
        return
    }

    modal.hidden = false

    setValue(
        IDS.date,
        prefill.date || getCurrentDate()
    )

    if(prefill.courtId){
        setValue(
            IDS.court,
            String(prefill.courtId)
        )
    }

    if(prefill.start){
        setValue(
            IDS.start,
            prefill.start
        )
    }

    if(prefill.end){
        setValue(
            IDS.end,
            prefill.end
        )
    }
}


// ===============================
// CLOSE
// ===============================
export function closeGuestForm(){

    const modal = getModal()

    if(!modal){
        return
    }

    modal.hidden = true
}


// ===============================
// RESET
// ===============================
function resetGuestForm(){

    [
        IDS.court,
        IDS.start,
        IDS.end,
        IDS.customer,
        IDS.phone,
        IDS.note
    ].forEach(id => {

        const el = $(id)

        if(!el){
            return
        }

        if(el.tagName === "SELECT"){
            el.selectedIndex = 0
        }else{
            el.value = ""
        }
    })

    setValue(
        IDS.date,
        getCurrentDate()
    )
}


// ===============================
// SUBMIT
// ===============================
async function submitGuestForm(){

    const submitBtn = $(IDS.submitBtn)

    if(submitBtn?.disabled){
        return
    }

    try{

        if(submitBtn){
            submitBtn.disabled = true
        }

        const payload =
            buildPayload()

        const validationError =
            validatePayload(payload)

        if(validationError){

            showToast(
                validationError,
                "warning"
            )

            return
        }

        const result =
            await createRequest(payload)

        if(result){

            showToast(
                "Yêu cầu đã gửi, vui lòng chờ xác nhận."
            )

            resetGuestForm()
            closeGuestForm()

            return
        }

        showToast(
            "Không thể gửi yêu cầu",
            "error"
        )

    }catch(err){

        console.error(
            "❌ GUEST REQUEST FAIL:",
            err
        )

        showToast(
            err.message ||
            "Không thể gửi yêu cầu",
            "error"
        )

    }finally{

        if(submitBtn){
            submitBtn.disabled = false
        }
    }
}


// ===============================
// BUILD
// ===============================
function buildPayload(){

    return {
        court_id:
            Number(getValue(IDS.court)),

        date:
            getValue(IDS.date),

        start:
            timeToMinutes(
                getValue(IDS.start)
            ),

        end:
            timeToMinutes(
                getValue(IDS.end)
            ),

        customer:
            getValue(IDS.customer),

        phone:
            getValue(IDS.phone),

        note:
            getValue(IDS.note)
    }
}


// ===============================
// VALIDATE
// ===============================
function validatePayload(payload){

    if(
        !payload.court_id ||
        payload.court_id < 1
    ){
        return "Vui lòng chọn sân hợp lệ"
    }

    if(!payload.date){
        return "Vui lòng chọn ngày"
    }

    if(
        isNaN(payload.start) ||
        isNaN(payload.end)
    ){
        return "Vui lòng nhập giờ hợp lệ"
    }

    if(
        payload.start >= payload.end
    ){
        return "Giờ kết thúc phải lớn hơn giờ bắt đầu"
    }

    if(
        payload.start < 0 ||
        payload.end > 1440
    ){
        return "Khung giờ không hợp lệ"
    }

    if(!payload.customer){
        return "Vui lòng nhập tên người đặt"
    }

    if(!payload.phone){
        return "Vui lòng nhập số điện thoại"
    }

    return null
}


// ===============================
// TIME
// ===============================
function timeToMinutes(str){

    if(
        !str ||
        !str.includes(":")
    ){
        return NaN
    }

    const [h, m] =
        str.split(":").map(Number)

    if(
        isNaN(h) ||
        isNaN(m)
    ){
        return NaN
    }

    return h * 60 + m
}