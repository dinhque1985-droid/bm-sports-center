export function assertBookingRequestModel(r){

    if(!r || typeof r !== "object"){
        throw new Error("Invalid booking request")
    }

    if(r.id == null){
        throw new Error("Missing request id")
    }

    if(r.court_id == null){
        throw new Error("Missing court_id")
    }

    if(!r.date){
        throw new Error("Missing request date")
    }

    if(r.start == null){
        throw new Error("Missing request start")
    }

    if(r.end == null){
        throw new Error("Missing request end")
    }

    if(Number(r.start) >= Number(r.end)){
        throw new Error("Invalid request time range")
    }

    if(!r.status){
        throw new Error("Missing request status")
    }

    return true
}