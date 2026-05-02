let currentDate = getTodayLocal()

// console.log("📅 timelineDate loaded")

export function getCurrentDate(){

    if(!currentDate){

        currentDate =
            new Date()
                .toISOString()
                .slice(0, 10)
    }

    return currentDate
}

function getTodayLocal(){
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

function isValidDate(dateStr){
    const d = new Date(dateStr)
    return !isNaN(d.getTime())
}

export function initDateBar(loadBookings, renderAll){

    const prevBtn = document.getElementById("prev-day")
    const nextBtn = document.getElementById("next-day")
    const todayBtn = document.getElementById("today-btn")
    const label = document.getElementById("current-date-label")
    const picker = document.getElementById("date-picker")

    const urlParams = new URLSearchParams(window.location.search)
    const today = getTodayLocal()

    const urlDate =
        urlParams.get("date")

    currentDate =
        (
            urlDate &&
            isValidDate(urlDate)
        )
            ? urlDate
            : today

    console.log(
        "📅 INIT DATE:",
        currentDate
    )

    updateUI()

    if(prevBtn){
        prevBtn.onclick = () => changeDate(-1)
    }

    if(nextBtn){
        nextBtn.onclick = () => changeDate(1)
    }

    if(todayBtn){
        todayBtn.onclick = () => {
            currentDate = today
            updateUI()
            trigger()
        }
    }

    if(picker){
        picker.onchange = () => {

            if(
                picker.value &&
                isValidDate(picker.value)
            ){
                currentDate = picker.value
            }else{
                currentDate = today
            }

            updateUI()
            trigger()
        }
    }    
    
    function changeDate(offset){

        if(
            !currentDate ||
            !isValidDate(currentDate)
        ){
            currentDate = getTodayLocal()
        }

        const d = new Date(currentDate)

        d.setDate(
            d.getDate() + offset
        )

        currentDate =
            d.toISOString()
                .split("T")[0]

        updateUI()
        trigger()

        console.log(
            "📅 DATE CHANGED:",
            currentDate
        )
    }

    async function trigger(){

        if(loadBookings){
            await loadBookings()
        }

        if(renderAll){
            await renderAll(currentDate)
        }
    }

    function updateUI(){

        if(label) label.innerText = "LỊCH NGÀY: " + currentDate
        if(picker) picker.value = currentDate

        const url = new URL(window.location)
        url.searchParams.set("date", currentDate)
        window.history.replaceState({}, "", url)

        requestAnimationFrame(() => {
            document.querySelectorAll(".court-row").forEach(row => {
                row.dataset.date = currentDate
            })
        })
    }
}

// window.getCurrentDate = getCurrentDate
