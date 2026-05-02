/**
 * toast.js
 * 🎯 GLOBAL TOAST SYSTEM
 * success | error | warning | info
 */

let toastRoot = null


// ===============================
// PUBLIC API
// ===============================
export function showToast(
    message,
    type = "success",
    duration = 2500
){

    if(!message) return

    ensureToastRoot()

    const toast =
        createToastElement(
            message,
            type
        )

    toastRoot.appendChild(
        toast
    )

    // ===== ENTER =====
    requestAnimationFrame(() => {
        toast.classList.add(
            "show"
        )
    })

    // ===== AUTO REMOVE =====
    const timer =
        setTimeout(() => {
            removeToast(
                toast
            )
        }, duration)

    // ===== CLICK TO CLOSE =====
    toast.addEventListener(
        "click",
        () => {

            clearTimeout(
                timer
            )

            removeToast(
                toast
            )
        }
    )
}


// ===============================
// SHORTCUTS
// ===============================
export function toastSuccess(
    message,
    duration
){
    showToast(
        message,
        "success",
        duration
    )
}

export function toastError(
    message,
    duration
){
    showToast(
        message,
        "error",
        duration
    )
}

export function toastWarning(
    message,
    duration
){
    showToast(
        message,
        "warning",
        duration
    )
}

export function toastInfo(
    message,
    duration
){
    showToast(
        message,
        "info",
        duration
    )
}


// ===============================
// ROOT
// ===============================
function ensureToastRoot(){

    if(toastRoot) return

    toastRoot =
        document.getElementById(
            "toast-root"
        )

    if(toastRoot) return

    toastRoot =
        document.createElement(
            "div"
        )

    toastRoot.id =
        "toast-root"

    document.body.appendChild(
        toastRoot
    )
}


// ===============================
// CREATE
// ===============================
function createToastElement(
    message,
    type
){

    const toast =
        document.createElement(
            "div"
        )

    toast.className =
        `toast toast-${normalizeType(type)}`

    toast.setAttribute(
        "role",
        "alert"
    )

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">
                ${getToastIcon(type)}
            </span>

            <span class="toast-message">
                ${escapeHTML(message)}
            </span>

            <button
                class="toast-close"
                aria-label="Đóng"
                type="button"
            >
                ×
            </button>
        </div>
    `

    // ===== CLOSE BTN =====
    toast.querySelector(
        ".toast-close"
    )?.addEventListener(
        "click",
        (e) => {

            e.stopPropagation()

            removeToast(
                toast
            )
        }
    )

    return toast
}


// ===============================
// REMOVE
// ===============================
function removeToast(
    toast
){

    if(!toast) return

    toast.classList.remove(
        "show"
    )

    toast.classList.add(
        "hide"
    )

    setTimeout(() => {
        toast.remove()
    }, 300)
}


// ===============================
// HELPERS
// ===============================
function normalizeType(
    type
){

    const valid = [
        "success",
        "error",
        "warning",
        "info"
    ]

    return valid.includes(type)
        ? type
        : "info"
}


function getToastIcon(
    type
){

    switch(type){

        case "success":
            return "✔"

        case "error":
            return "✖"

        case "warning":
            return "⚠"

        default:
            return "ℹ"
    }
}


function escapeHTML(
    str
){

    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}