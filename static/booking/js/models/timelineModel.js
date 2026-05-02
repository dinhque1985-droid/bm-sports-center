/**
 * models/timelineModel.js
 * 🎯 TIMELINE ITEM DOMAIN MODEL
 */

const REQUIRED_FIELDS = [
    "id",
    "type",
    "court_id",
    "date",
    "start",
    "end"
]

const ALLOWED_TYPES = [
    "booking",
    "block"
]


export function isTimelineItemShape(item){

    if(!item || typeof item !== "object"){
        return false
    }

    const hasRequired = REQUIRED_FIELDS.every(
        key => item[key] != null
    )

    if(!hasRequired){
        return false
    }

    if(!ALLOWED_TYPES.includes(item.type)){
        return false
    }

    return true
}


export function validateTimelineItem(item){

    if(!isTimelineItemShape(item)){
        return {
            valid: false,
            error: "Invalid timeline item shape"
        }
    }

    if(Number(item.start) >= Number(item.end)){
        return {
            valid: false,
            error: "Invalid timeline time range"
        }
    }

    return {
        valid: true,
        error: null
    }
}


export function assertTimelineItem(item){

    const result = validateTimelineItem(item)

    if(!result.valid){
        throw new Error(result.error)
    }

    return true
}