// ===== TIMELINE =====
import {
    renderHeader,
    renderCourts,
    initTimelineRender
} from "./timeline/timelineRender.js"

import {
    initScroll
} from "./timeline/timelineScroll.js"

import {
    initHover
} from "./timeline/timelineHover.js"

import {
    initNowLine
} from "./timeline/timelineNow.js"

import {
    initDateBar,
    getCurrentDate
} from "./timeline/timelineDate.js"


// ===== INTERACTION =====
import {
    initCreateBooking
} from "./interaction/createBooking.js"

import {
    initBookingDrag
} from "./interaction/bookingDrag.js"


// ===== STATE =====
import {
    setBookings,
    getBookings,
    updateBookingAsync,
    deleteBooking
} from "./state/bookingStore.js"

import {
    getBlocks,
    setBlocks,
    deleteBlock,
    addBlock
} from "./state/blockStore.js"


// ===== SERVICES =====
import {
    fetchBookings,
    createBookingAPI
} from "./services/bookingService.js"

import {
    fetchBlocks,
    createBlockAPI
} from "./services/blockService.js"

import {
    fetchBookingRequests,
    createBookingRequestAPI,
    approveBookingRequestAPI,
    rejectBookingRequestAPI
} from "./services/bookingRequestService.js"


// ===== UI =====
import {
    initGuestBookingForm
} from "./ui/guestBookingForm.js"

import {
    initBookingRequestList
} from "./ui/bookingRequestList.js"

import {
    initBookingList
} from "./ui/bookingList.js"

import {
    initBlockForm
} from "./ui/blockForm.js"

import {
    initBlockList
} from "./ui/blockList.js"

import {
    initContextMenu,
    setContextMenuHandlers
} from "./context/contextMenu.js"

import {
    showToast
} from "./ui/toast.js"


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

console.log("ROLE:", ROLE)


// ===============================
// ROLE UI CLEANUP
// ===============================
function hideForGuest(){

    document
        .querySelectorAll(
            '[data-role-required="staff"]'
        )
            .forEach(el => el.remove())
    document.getElementById(
        "block-form"
    )?.remove()
}


// ===============================
// DEBUG
// ===============================
window.debug = {

    // ===== STORE =====
    getBookings,
    getBlocks,

    setBookings,
    setBlocks,

    addBlock,
    deleteBlock,
    deleteBooking,

    // ===== SERVICES =====
    fetchBookings,
    fetchBlocks,

    createBookingAPI,
    createBlockAPI,

    fetchBookingRequests,
    createBookingRequestAPI,
    approveBookingRequestAPI,
    rejectBookingRequestAPI,

    // ===== DATE =====
    getCurrentDate,

    // ===== ROLE =====
    ROLE,
    isGuest,
    isAdmin
}


// ===============================
// CONTROLLER
// ===============================
async function loadAllData(){

    const date =
        getCurrentDate()

    try{

        const [
            bookingData,
            blockData
        ] = await Promise.all([
            fetchBookings(date),
            fetchBlocks(date)
        ])

        setBookings(
            bookingData
        )

        setBlocks(
            blockData
        )

    }catch(err){

        console.error(
            "❌ LOAD DATA FAIL:",
            err
        )

        showToast(
            "Không thể tải dữ liệu",
            "error"
        )
    }
}


// ===============================
// INIT
// ===============================
document.addEventListener(
    "DOMContentLoaded",
    async () => {


        // ===== BASE UI =====
        renderHeader()
        renderCourts()

        // ===== ROLE UI =====
        if(isGuest){
            hideForGuest()
        }

        // ===== DATE =====
        initDateBar(
            loadAllData
        )

        // ===== RENDER =====
        initTimelineRender()
        initBookingList()

        // ===== CORE MODULE =====
        initScroll()
        initHover()
        initNowLine(
            getCurrentDate
        )

        // ===== CREATE BOOKING =====
        initCreateBooking()

        // ===== ADMIN ONLY =====
        if(isAdmin){

            initBookingDrag()

            initContextMenu(
                getBookings,
                getBlocks
            )
            initBlockForm()

            const blockForm =
                document.getElementById(
                    "block-form"
                )

            if(blockForm){
                blockForm.hidden = true
            }
        }

        // ===== CONTEXT ACTION =====
        setContextMenuHandlers({

            save: async (
                id,
                data,
                type
            ) => {

                if(
                    type === "booking"
                ){
                    return await updateBookingAsync(
                        id,
                        data
                    )
                }

                return false
            },

            delete: async (
                id,
                type
            ) => {

                if(
                    type === "booking"
                ){
                    return await deleteBooking(
                        id
                    )
                }

                if(
                    type === "block"
                ){
                    return await deleteBlock(
                        id
                    )
                }

                return false
            }
        })

        // ===== SHARED UI =====
        initBlockList()

        initBookingRequestList()

        initGuestBookingForm()

        // ===== LOAD =====
        await loadAllData()

        // ===== READY =====
        console.log(
            "✅ BM Sport Ready"
        )
    }
)