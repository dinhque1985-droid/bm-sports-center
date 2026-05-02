/**
 * blockForm.js
 * 🎯 PRODUCTION UI LAYER
 *
 * RULE:
 * ✅ UI only
 * ✅ Modal only
 * ✅ Validate basic
 * ✅ Store + API sync
 */

import { hhmmToMinutes } from "../core/time.js"
import { createBlockAPI } from "../services/blockService.js"
import { addBlock } from "../state/blockStore.js"
import { getCurrentDate } from "../timeline/timelineDate.js"
import { showToast } from "../ui/toast.js"


// ===============================
// MAIN
// ===============================
export function initBlockForm(){

    const dom = getDOM()

    if(!dom){
        console.warn(
            "❌ Block form elements not found"
        )
        return
    }

    const {
        openBtn,
        form,
        closeBtn,
        cancelBtn,
        saveBtn,
        backdrop,

        courtEl,
        dateFromEl,
        dateToEl,

        startEl,
        endEl,

        reasonEl,

        ruleTypeEl,
        factorEl
    } = dom


    // ================= OPEN =================
    openBtn.addEventListener(
        "click",
        (e) => {

            e.preventDefault()

            const currentDate =
                getCurrentDate()

            if(!currentDate){

                showToast(
                    "Ngày hiện tại chưa sẵn sàng",
                    "error"
                )

                return
            }

            prefillDate({
                currentDate,
                dateFromEl,
                dateToEl
            })

            form.hidden = false
        }
    )


    // ================= CLOSE =================
    function closeModal(){

        resetForm({
            startEl,
            endEl,
            reasonEl,
            ruleTypeEl,
            factorEl
        })

        hideForm(form)
    }

    closeBtn?.addEventListener(
        "click",
        closeModal
    )

    cancelBtn?.addEventListener(
        "click",
        closeModal
    )

    backdrop?.addEventListener(
        "click",
        closeModal
    )


    // ================= ESC =================
    document.addEventListener(
        "keydown",
        (e) => {

            if(
                e.key === "Escape" &&
                !form.hidden
            ){

                closeModal()
            }
        }
    )


    // ================= RULE TYPE =================
    initRuleTypeLogic(
        ruleTypeEl,
        factorEl
    )


    // ================= SAVE =================
    saveBtn.addEventListener(
        "click",
        async () => {

            if(
                saveBtn.disabled
            ){
                return
            }

            saveBtn.disabled = true

            try{

                const payload =
                    buildPayload({

                        courtEl,

                        dateFromEl,
                        dateToEl,

                        startEl,
                        endEl,

                        reasonEl,

                        ruleTypeEl,
                        factorEl
                    })

                const newBlock =
                    await createBlockAPI(
                        payload
                    )

                if(!newBlock){

                    throw new Error(
                        "Không thể tạo block"
                    )
                }

                // ===== STORE =====
                addBlock(
                    newBlock
                )

                // ===== UI =====
                closeModal()

                showToast(
                    "Đã tạo block thành công"
                )

            }catch(err){

                console.error(
                    "❌ CREATE BLOCK FAIL:",
                    err
                )

                showToast(
                    err.message ||
                    "Tạo block thất bại",
                    "error"
                )

            }finally{

                saveBtn.disabled =
                    false
            }
        }
    )
}



// ===============================
// DOM
// ===============================
function getDOM(){

    const dom = {

        // ===== MODAL =====
        openBtn:
            document.getElementById(
                "open-block-form"
            ),

        form:
            document.getElementById(
                "block-booking-modal"
            ),

        backdrop:
            document.getElementById(
                "bbm-backdrop"
            ),

        // ===== ACTION =====
        closeBtn:
            document.getElementById(
                "bf-close"
            ),

        cancelBtn:
            document.getElementById(
                "bf-cancel"
            ),

        saveBtn:
            document.getElementById(
                "bf-save"
            ),

        // ===== FORM =====
        courtEl:
            document.getElementById(
                "bf-court"
            ),

        dateFromEl:
            document.getElementById(
                "bf-date-from"
            ),

        dateToEl:
            document.getElementById(
                "bf-date-to"
            ),

        startEl:
            document.getElementById(
                "bf-start"
            ),

        endEl:
            document.getElementById(
                "bf-end"
            ),

        reasonEl:
            document.getElementById(
                "bf-reason"
            ),

        ruleTypeEl:
            document.getElementById(
                "bf-rule-type"
            ),

        factorEl:
            document.getElementById(
                "bf-pricing-factor"
            )
    }

    if(
        !dom.openBtn ||
        !dom.form ||
        !dom.saveBtn
    ){
        return null
    }

    return dom
}



// ===============================
// BUILD PAYLOAD
// ===============================
function buildPayload({
    courtEl,
    dateFromEl,
    dateToEl,
    startEl,
    endEl,
    reasonEl,
    ruleTypeEl,
    factorEl
}){

    const currentDate =
        getCurrentDate()

    if(!currentDate){

        throw new Error(
            "Ngày hiện tại chưa sẵn sàng"
        )
    }

    const court_id =
        Number(
            courtEl?.value
        )

    const date_from =
        dateFromEl?.value ||
        currentDate

    const date_to =
        dateToEl?.value ||
        currentDate

    const startStr =
        startEl?.value

    const endStr =
        endEl?.value

    const reason =
        reasonEl?.value?.trim() ||
        ""

    const rule_type =
        ruleTypeEl?.value ||
        "normal"

    const pricing_factor =
        Number(
            factorEl?.value || 1
        )

    validateForm({

        court_id,

        date_from,
        date_to,

        startStr,
        endStr,

        rule_type,
        pricing_factor
    })

    return {

        court_id,

        date_from,
        date_to,

        start:
            hhmmToMinutes(
                startStr
            ),

        end:
            hhmmToMinutes(
                endStr
            ),

        rule_type,
        pricing_factor,

        reason
    }
}



// ===============================
// VALIDATE
// ===============================
function validateForm({
    court_id,
    date_from,
    date_to,
    startStr,
    endStr,
    rule_type,
    pricing_factor
}){

    const today =
        getTodayLocal()

    if(
        !court_id ||
        isNaN(court_id)
    ){
        throw new Error(
            "Sân không hợp lệ"
        )
    }

    if(
        !date_from ||
        !date_to
    ){
        throw new Error(
            "Thiếu ngày"
        )
    }

    if(
        date_from < today
    ){
        throw new Error(
            "Không thể tạo block trong quá khứ"
        )
    }

    if(
        date_from > date_to
    ){
        throw new Error(
            "Ngày không hợp lệ"
        )
    }

    if(
        !startStr ||
        !endStr
    ){
        throw new Error(
            "Thiếu giờ"
        )
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
        throw new Error(
            "Giờ không hợp lệ"
        )
    }

    if(
        start >= end
    ){
        throw new Error(
            "Giờ không hợp lệ"
        )
    }

    if(
        rule_type === "monthly" &&
        pricing_factor <= 0
    ){
        throw new Error(
            "Hệ số tháng phải > 0"
        )
    }
}



// ===============================
// RULE TYPE
// ===============================
function initRuleTypeLogic(
    ruleTypeEl,
    factorEl
){

    if(
        !ruleTypeEl ||
        !factorEl
    ){
        return
    }

    updateFactorState(
        ruleTypeEl.value,
        factorEl
    )

    ruleTypeEl.addEventListener(
        "change",
        () => {

            updateFactorState(
                ruleTypeEl.value,
                factorEl
            )
        }
    )
}


function updateFactorState(
    ruleType,
    factorEl
){

    if(
        ruleType === "monthly"
    ){

        factorEl.disabled =
            false

    }else{

        factorEl.value = 1

        factorEl.disabled =
            true
    }
}



// ===============================
// HELPERS
// ===============================
function prefillDate({
    currentDate,
    dateFromEl,
    dateToEl
}){

    if(dateFromEl){
        dateFromEl.value =
            currentDate
    }

    if(dateToEl){
        dateToEl.value =
            currentDate
    }
}


function resetForm({
    startEl,
    endEl,
    reasonEl,
    ruleTypeEl,
    factorEl
}){

    if(startEl){
        startEl.value = ""
    }

    if(endEl){
        endEl.value = ""
    }

    if(reasonEl){
        reasonEl.value = ""
    }

    if(ruleTypeEl){
        ruleTypeEl.value =
            "normal"
    }

    if(factorEl){

        factorEl.value = 1

        factorEl.disabled =
            true
    }
}


function hideForm(form){

    if(form){
        form.hidden = true
    }
}


function getTodayLocal(){

    const now =
        new Date()

    const y =
        now.getFullYear()

    const m =
        String(
            now.getMonth() + 1
        ).padStart(2, "0")

    const d =
        String(
            now.getDate()
        ).padStart(2, "0")

    return `${y}-${m}-${d}`
}