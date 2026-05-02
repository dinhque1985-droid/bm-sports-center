// ===== IMPORT =====
import { getContextMeta } from "./contextMeta.js"
import { renderMenu } from "./contextRender.js"
import { handleAction } from "./contextActions.js"

// ===== STATE =====
let handlers = {
    save: null,
    delete: null
}

let currentMeta = null
let currentId = null
let lastClickEvent = null

const ROLE =
    document.body.dataset.role || "guest"


// ==================================================
// PUBLIC
// ==================================================
export function setContextMenuHandlers(h = {}){

    handlers = {
        ...handlers,
        ...h
    }
}


// ==================================================
// HELPER: HIT DETECTION
// QUAN TRỌNG:
// hỗ trợ refactor HTML mới
// ==================================================
function getTargetElement(target){

    if(!target) return null

    const safeTarget =
        target.nodeType === 3
            ? target.parentElement
            : target

    if(!safeTarget) return null

    return safeTarget.closest(`
        #open-guest-booking,
        #context-menu,
        .timeline,
        .timeline-slot,
        .timeline-cell,
        .booking-block,
        .block-item,
        #booking-table tr,
        #block-table tr
    `)
}

// ==================================================
// HELPER: POSITION
// ==================================================
function positionMenu(menu, x, y){

    if(!menu) return

    const padding = 8

    menu.style.visibility = "hidden"
    menu.style.display = "block"

    const rect =
        menu.getBoundingClientRect()

    const menuWidth =
        rect.width || 240

    const menuHeight =
        rect.height || 120

    const viewportWidth =
        window.innerWidth

    const viewportHeight =
        window.innerHeight

    let left = x
    let top  = y

    // ===== horizontal flip =====
    if(
        x + menuWidth >
        viewportWidth - padding
    ){
        left = x - menuWidth
    }

    // ===== vertical flip =====
    if(
        y + menuHeight >
        viewportHeight - padding
    ){
        top = y - menuHeight
    }

    left =
        Math.max(
            padding,
            left
        )

    top =
        Math.max(
            padding,
            top
        )

    menu.style.left =
        left + "px"

    menu.style.top =
        top + "px"

    menu.style.visibility =
        "visible"
}


// ==================================================
// HELPER: HIDE
// ==================================================
function createHideMenu(menu){

    return function hideMenu(){

        if(!menu) return

        menu.classList.remove(
            "show"
        )

        menu.style.display =
            "none"

        menu.innerHTML =
            ""

        currentMeta =
            null

        currentId =
            null

        lastClickEvent =
            null

        document.body.classList.remove(
            "context-open",
            "blocking-mode",
            "modal-open"
        )
    }
}


// ==================================================
// INIT
// ==================================================
export function initContextMenu(
    getBookings,
    getBlocks
){

    const menu =
        document.getElementById(
            "context-menu"
        )
    console.log("🔥 INIT CONTEXT MENU RUNNING");

    if(!menu){

        console.warn(
            "❌ context-menu not found"
        )

        return
    }

    // ===== hard safety =====
    menu.style.pointerEvents =
        "auto"

    menu.style.zIndex =
        "99999"

    const hideMenu =
        createHideMenu(menu)


    // ==================================================
    // RIGHT CLICK
    // ==================================================
    document.addEventListener(
        "contextmenu",
        (e) => {

            hideMenu()

            if(
                ROLE === "guest"
            ){
                return
            }

            const el =
                getTargetElement(
                    e.target
                )
            console.log("RAW TARGET:", e.target);
            console.log("MATCHED TARGET:", el);

            if(!el){
                return
            }

            e.preventDefault()

            const meta =
                getContextMeta(el)

            if(
                !meta ||
                !meta.type
            ){

                if(window.DEBUG){
                    console.warn(
                        "❌ INVALID META",
                        meta
                    )
                }

                return
            }

            // ===== DEBUG =====
            if(window.DEBUG){
                console.log(
                    "META:",
                    meta
                )
            }

            currentMeta = {
                ...meta,
                clickX: e.clientX,
                clickY: e.clientY
            }

            console.log("🧪 FINAL META:", currentMeta);

            currentId =
                meta.id || null

            lastClickEvent =
                e

            // ==================================================
            // LOAD DATA
            // ==================================================
            let data = null

            if(
                meta.type === "booking" ||
                meta.type === "booking-row"
            ){

                data =
                    getBookings?.()
                        ?.find(
                            b =>
                                String(b.id) ===
                                String(meta.id)
                        ) || null
            }

            if(
                meta.type === "block" ||
                meta.type === "block-row"
            ){

                data =
                    getBlocks?.()
                        ?.find(
                            b =>
                                String(b.id) ===
                                String(meta.id)
                        ) || null
            }

            // ==================================================
            // RENDER
            // ==================================================
            const html =
                renderMenu(
                    meta,
                    data
                )

            if(!html){

                console.warn(
                    "❌ EMPTY MENU HTML",
                    meta
                )

                return
            }

            menu.innerHTML =
                html

            // ===== ensure buttons active =====
            menu.querySelectorAll(
                "button"
            ).forEach(btn => {
                btn.disabled = false
                btn.style.pointerEvents = "auto"
            })

            // ==================================================
            // SHOW
            // ==================================================
            menu.style.display =
                "block"

            menu.classList.add(
                "show"
            )

            document.body.classList.add(
                "context-open"
            )

            positionMenu(
                menu,
                e.clientX,
                e.clientY
            )
        }
    )


    // ==================================================
    // ACTION
    // ==================================================
    menu.addEventListener(
        "click",
        async (e) => {

            e.stopPropagation()

            const btn =
                e.target.closest("button")

            if(!btn){
                return
            }

            // ===== TOOLBAR / GUEST BOOKING =====
            if(
                btn.id === "open-guest-booking"
            ){
                e.preventDefault()

                document
                    .getElementById(
                        "guest-booking-modal"
                    )
                    ?.removeAttribute(
                        "hidden"
                    )

                hideMenu()

                return
            }

            if(
                ROLE === "guest"
            ){
                hideMenu()
                return
            }

            const action =
                btn.dataset.action

            if(!action){

                console.warn(
                    "❌ Missing action"
                )

                return
            }

            if(window.DEBUG){

                console.log(
                    "ACTION:",
                    action,
                    currentMeta
                )
            }

            btn.disabled = true

            try{

                const result =
                    await handleAction({

                        action,
                        meta: currentMeta,
                        id: currentId,
                        event: lastClickEvent,

                        handlers,

                        getBookings,
                        getBlocks
                    })

                if(
                    result !== false
                ){
                    hideMenu()
                }

            }catch(err){

                console.error(
                    "❌ Context action error:",
                    err
                )

            }finally{

                btn.disabled = false
            }
        }
    )

    // ==================================================
    // CLICK OUTSIDE
    // ==================================================
    document.addEventListener(
        "mousedown",
        (e) => {
            e.stopPropagation()

            // ===== left click only =====
            if(
                e.button !== 0
            ){
                return
            }

            if(
                menu.style.display ===
                "none"
            ){
                return
            }

            // ===== inside menu =====
            if(
                menu.contains(
                    e.target
                )
            ){
                return
            }

            // ===== block form safe =====
            const blockForm =
                document.getElementById(
                    "block-form"
                )

            if(
                blockForm &&
                !blockForm.hidden &&
                blockForm.contains(
                    e.target
                )
            ){
                return
            }

            // ===== guest form safe =====
            const guestForm =
                document.getElementById(
                    "guest-booking-form"
                )

            if(
                guestForm &&
                !guestForm.hidden &&
                guestForm.contains(
                    e.target
                )
            ){
                return
            }

            hideMenu()
        }
    )


    // ==================================================
    // ESC
    // ==================================================
    document.addEventListener(
        "keydown",
        (e) => {

            if(
                e.key === "Escape"
            ){
                hideMenu()
            }
        }
    )
}