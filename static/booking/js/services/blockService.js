/**
 * blockService.js
 * 🎯 CONTRACT LAYER DUY NHẤT cho Block
 *
 * RULE:
 * ✅ Chỉ file này transform API <-> App
 * ✅ Store/UI chỉ dùng normalized block
 * ❌ UI không tự sửa shape
 * ❌ Store không đoán field
 */

import { assertBlockModel } from "../models/blockModel.js"
import { getCurrentDate } from "../timeline/timelineDate.js"

const BASE = "/api/blocks"

// ===============================
// CONTRACT SHAPE GUARD
// ===============================
function assertValidBlockPayload(payload){

    if(!payload || typeof payload !== "object"){
        throw new Error("Invalid block payload")
    }

    const required = [
        "court_id",
        "date_from",
        "date_to",
        "start",
        "end"
    ]

    for(const key of required){
        if(payload[key] == null || payload[key] === ""){
            throw new Error(`Missing block field: ${key}`)
        }
    }

    if(Number(payload.start) >= Number(payload.end)){
        throw new Error("Invalid block time range")
    }

    return true
}


// ===============================
// BUILD API PAYLOAD
// UI → API
// ===============================
function toApiPayload(payload){

    assertValidBlockPayload(payload)

    return {
        court_id: Number(payload.court_id),

        date_from: payload.date_from,
        date_to: payload.date_to,

        start: Number(payload.start),
        end: Number(payload.end),

        pricing_factor: Number(payload.pricing_factor || 1),

        rule_type: payload.rule_type || "normal",

        reason: payload.reason || ""
    }
}


// ===============================
// NORMALIZE API RESPONSE
// API → APP
// ===============================
function normalizeBlock(raw){

    const normalized = {
        id: String(raw.id),

        court_id: Number(raw.court_id),

        date_from: raw.date_from,
        date_to: raw.date_to,

        start: Number(raw.start),
        end: Number(raw.end),

        reason: raw.reason || "",

        rule_type: raw.rule_type,

        pricing_factor: Number(raw.pricing_factor),

        price: Number(raw.price)
    }

    assertBlockModel(normalized)

    return normalized
}

// ===============================
// FETCH
// ===============================
export async function fetchBlocks(date){

    if(!date){
        throw new Error("Missing date for fetchBlocks")
    }

    const res = await fetch(`${BASE}/?date=${date}`)

    if(!res.ok){
        throw new Error("Block fetch failed")
    }

    const data = await res.json()

    if(!Array.isArray(data)){
        throw new Error("Invalid block list response")
    }

    console.log("🧪 BLOCK API RAW:", data)

    const normalized = data.map(normalizeBlock)

    console.log("🧠 BLOCK CONTRACT:", normalized)

    return normalized
}


// ===============================
// CREATE
// ===============================
export async function createBlockAPI(payload){

    const apiPayload = toApiPayload(payload)

    console.log("📦 BLOCK API PAYLOAD:", apiPayload)

    const res = await fetch(`${BASE}/create/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(apiPayload)
    })

    const json = await res.json().catch(() => ({}))

    if(!res.ok){
        console.error("❌ BLOCK CREATE FAIL:", json)
        throw new Error(
            Array.isArray(json.error)
                ? json.error.join(", ")
                : json.error || "Create block failed"
        )
    }

    const normalized = normalizeBlock(json)

    console.log("✅ BLOCK CREATED NORMALIZED:", normalized)

    return normalized
}


// ===============================
// DELETE
// ===============================
export async function deleteBlockAPI(id, date){

    if(!id){
        throw new Error("Missing block id")
    }

    if(!date){
        throw new Error("Current date not initialized")
    }

    const url = `${BASE}/${id}/?date=${date}`

    console.log("🧨 DELETE REQUEST:", {
        id,
        date,
        url
    })

    const res = await fetch(url, {
        method: "DELETE"
    })

    const json = await res.json().catch(() => ({}))

    if(!res.ok){
        console.error("❌ DELETE ERROR:", res.status, json)
        throw new Error(
            json.error || `Delete block failed (${res.status})`
        )
    }

    console.log("✅ DELETE RESPONSE:", json)

    return json
}


// ===============================
// DEBUG
// ===============================
window.createBlockAPI = createBlockAPI
window.fetchBlocks = fetchBlocks
window.deleteBlockAPI = deleteBlockAPI