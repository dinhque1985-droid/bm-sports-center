/**
 * bookingModel.js
 * 🎯 BOOKING CONTRACT MODEL
 *
 * RULE:
 * ✅ Đây là shape chuẩn DUY NHẤT cho booking frontend
 * ✅ Service normalize API → model này
 * ✅ Store/UI chỉ dùng booking đã assert
 * ❌ UI không tự đoán field
 * ❌ Store không normalize lại
 */

export function assertBookingModel(booking){

    // ===============================
    // OBJECT CHECK
    // ===============================
    if(!booking || typeof booking !== "object"){
        throw new Error("Invalid booking model")
    }


    // ===============================
    // REQUIRED FIELDS
    // ===============================
    const required = [
        "id",
        "court_id",
        "date",
        "start",
        "end"
    ]

    for(const key of required){

        if(
            booking[key] == null ||
            booking[key] === ""
        ){
            throw new Error(
                `Missing booking field: ${key}`
            )
        }
    }


    // ===============================
    // TYPE CHECK
    // ===============================
    if(
        isNaN(Number(booking.court_id))
    ){
        throw new Error(
            "Invalid court_id"
        )
    }

    if(
        isNaN(Number(booking.start))
    ){
        throw new Error(
            "Invalid booking start"
        )
    }

    if(
        isNaN(Number(booking.end))
    ){
        throw new Error(
            "Invalid booking end"
        )
    }


    // ===============================
    // TIME RANGE
    // ===============================
    if(
        Number(booking.start) >=
        Number(booking.end)
    ){
        throw new Error(
            "Invalid booking time range"
        )
    }


    // ===============================
    // DATE FORMAT
    // YYYY-MM-DD basic guard
    // ===============================
    if(
        !/^\d{4}-\d{2}-\d{2}$/.test(
            booking.date
        )
    ){
        throw new Error(
            "Invalid booking date format"
        )
    }


    // ===============================
    // OPTIONAL NORMALIZED FIELDS
    // ===============================
    if(
        booking.price != null &&
        isNaN(Number(booking.price))
    ){
        throw new Error(
            "Invalid booking price"
        )
    }

    if(
        booking.paid != null &&
        typeof booking.paid !== "boolean"
    ){
        throw new Error(
            "Invalid booking paid status"
        )
    }


    // ===============================
    // SAFE OPTIONAL STRINGS
    // ===============================
    const stringFields = [
        "customer",
        "phone",
        "booked_by",
        "source"
    ]

    for(const key of stringFields){

        if(
            booking[key] != null &&
            typeof booking[key] !== "string"
        ){
            throw new Error(
                `Invalid booking field type: ${key}`
            )
        }
    }


    // ===============================
    // DEFAULT BUSINESS RULE
    // ===============================
    if(
        booking.source &&
        ![
            "admin",
            "request",
            "system"
        ].includes(
            booking.source
        )
    ){
        console.warn(
            "⚠️ Unknown booking source:",
            booking.source
        )
    }

    return true
}