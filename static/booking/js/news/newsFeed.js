/**
 * newsFeed.js
 * BM_Sport News Center V1
 */

const ROLE =
    window.USER_ROLE ||
    "guest"

let allNews = []

let searchKeyword = ""

let currentFilter = "all"

console.log("NEWS FEED JS LOADED");

// ======================================
// INIT
// ======================================
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindFilters()

        if(
            ROLE === "admin" ||
            ROLE === "staff"
        ){
            bindNewsModal()
        }

        await loadNews()
    }
)


// ======================================
// API
// ======================================
async function loadNews(){

    try{

        const res =
            await fetch(
                "/api/news/"
            )

        const contentType =
            res.headers.get("content-type") || ""

        if(!contentType.includes("application/json")){
            throw new Error(
                `Server trả về không phải JSON (HTTP ${res.status})`
            )
        }

        const data = await res.json()

        if(
            !data.ok
        ){
            throw new Error(
                data.error ||
                "Không thể tải bản tin"
            )
        }

        allNews =
            Array.isArray(
                data.results
            )
                ? data.results
                : []

        renderAll()

    }catch(err){

        console.error(
            "❌ LOAD NEWS FAIL:",
            err
        )

        renderError(
            err.message
        )
    }
}


async function createNews(){

    const title =
        document.getElementById(
            "news-title"
        )?.value.trim()

    const content =
        document.getElementById(
            "news-content"
        )?.value.trim()

    const imageInput =
        document.getElementById(
            "news-image"
        )

    const is_active =
        document.getElementById(
            "news-active"
        )?.checked

    const is_pinned =
        document.getElementById(
            "news-pinned"
        )?.checked || false

    if(
        !title ||
        !content
    ){
        alert(
            "Thiếu tiêu đề hoặc nội dung"
        )
        return
    }

    const formData =
        new FormData()

    formData.append(
        "title",
        title
    )

    formData.append(
        "content",
        content
    )

    formData.append(
        "is_active",
        is_active
    )

    formData.append(
        "is_pinned",
        is_pinned
    )

    if(
        imageInput?.files?.[0]
    ){
        formData.append(
            "image",
            imageInput.files[0]
        )
    }

    try{

        const res =
            await fetch(
                "/api/news/create/",
                {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCSRFToken()
                    },
                    body: formData
                }
            )

        const contentType =
            res.headers.get("content-type") || ""

        if(!contentType.includes("application/json")){
            throw new Error(
                `Server trả về không phải JSON (HTTP ${res.status})`
            )
        }

        const data = await res.json()

        if(
            !data.ok
        ){
            throw new Error(
                data.error ||
                "Đăng tin thất bại"
            )
        }

        closeNewsModal()

        resetNewsForm()

        await loadNews()

        alert(
            "Đăng bản tin thành công"
        )

    }catch(err){

        console.error(
            "❌ CREATE NEWS FAIL:",
            err
        )

        alert(
            err.message
        )
    }
}



// ======================================
// RENDER
// ======================================
function renderAll(){

    const filtered =
        getFilteredNews()

    const pinned =
        filtered.filter(
            post =>
                post.is_pinned
        )

    const normal =
        filtered.filter(
            post =>
                !post.is_pinned
        )

    renderPinned(
        pinned
    )

    renderFeed(
        normal
    )
}


function renderPinned(posts){

    const container =
        document.getElementById(
            "pinned-news-list"
        )

    if(!container) return

    if(
        posts.length === 0
    ){

        container.innerHTML =
            `<p>Không có bản tin ghim</p>`

        return
    }

    container.innerHTML =
        posts
            .map(
                renderPinnedCard
            )
            .join("")
}


function renderFeed(posts){

    const container =
        document.getElementById(
            "news-list"
        )

    if(!container) return

    if(
        posts.length === 0
    ){

        container.innerHTML =
            `<p>Không có bản tin phù hợp</p>`

        return
    }

    container.innerHTML =
        posts
            .map(
                renderNewsCard
            )
            .join("")
}


function renderPinnedCard(post){

    return `
        <article class="news-card pinned">

            ${
                post.image_url
                    ? `
                    <img
                        src="${post.image_url}"
                        class="news-image"
                        alt="${escapeHtml(post.title)}"
                    >
                    `
                    : ""
            }

            <div class="news-body">

                <h4>
                    📌 ${escapeHtml(post.title)}
                </h4>

                <p>
                    ${escapeHtml(post.short_content)}
                </p>

                <small>
                    ${post.created_at}
                    • ${escapeHtml(post.created_by)}
                </small>

            </div>

        </article>
    `
}


function renderNewsCard(post){

    return `
        <article class="news-card">

            ${
                post.image_url
                    ? `
                    <img
                        src="${post.image_url}"
                        class="news-image"
                        alt="${escapeHtml(post.title)}"
                    >
                    `
                    : ""
            }

            <div class="news-body">

                <h4>
                    ${escapeHtml(post.title)}
                </h4>

                <p>
                    ${escapeHtml(post.content)}
                </p>

                <small>
                    ${post.created_at}
                    • ${escapeHtml(post.created_by)}
                    ${
                        !post.is_active
                            ? " • [ẨN]"
                            : ""
                    }
                </small>

            </div>

        </article>
    `
}


function renderError(message){

    const feed =
        document.getElementById(
            "news-list"
        )

    if(feed){

        feed.innerHTML = `
            <p>
                ❌ ${escapeHtml(message)}
            </p>
        `
    }
}



// ======================================
// FILTER
// ======================================
function getFilteredNews(){

    return allNews.filter(
        post => {

            const keyword =
                searchKeyword.toLowerCase()

            const matchesSearch =
                !keyword ||
                (post.title || "").toLowerCase()
                    .includes(
                        keyword
                    ) ||
                post.content
                    .toLowerCase()
                    .includes(
                        keyword
                    )

            if(
                !matchesSearch
            ){
                return false
            }

            switch(
                currentFilter
            ){

                case "pinned":
                    return post.is_pinned

                case "active":
                    return post.is_active

                case "hidden":
                    return !post.is_active

                default:
                    return true
            }
        }
    )
}



// ======================================
// EVENTS
// ======================================
function bindFilters(){

    const search =
        document.getElementById(
            "news-search"
        )

    const filter =
        document.getElementById(
            "news-filter"
        )

    search?.addEventListener(
        "input",
        e => {

            searchKeyword =
                e.target.value.trim()

            renderAll()
        }
    )

    filter?.addEventListener(
        "change",
        e => {

            currentFilter =
                e.target.value

            renderAll()
        }
    )
}


function bindNewsModal(){
    
    const openBtn =
        document.getElementById(
            "open-news-create"
        )
    if(!openBtn){
        console.warn("Missing #open-news-create")
    }

    const closeBtn =
        document.getElementById(
            "news-close"
        )

    const cancelBtn =
        document.getElementById(
            "news-cancel"
        )

    const submitBtn =
        document.getElementById(
            "news-submit"
        )

    const modal =
        document.getElementById(
            "news-modal"
        )

    const backdrop =
        document.getElementById(
            "news-modal-backdrop"
        )

    openBtn?.addEventListener(
        "click",
        openNewsModal
    )

    closeBtn?.addEventListener(
        "click",
        closeNewsModal
    )

    cancelBtn?.addEventListener(
        "click",
        closeNewsModal
    )

    backdrop?.addEventListener(
        "click",
        closeNewsModal
    )

    submitBtn?.addEventListener(
        "click",
        createNews
    )

    document.addEventListener(
        "keydown",
        e => {

            if(
                e.key === "Escape" &&
                modal &&
                !modal.hidden
            ){

                closeNewsModal()
            }
        }
    )
}



// ======================================
// MODAL
// ======================================
function openNewsModal(){

    const modal =
        document.getElementById(
            "news-modal"
        )

    if(modal){
        modal.hidden = false
    }
}


function closeNewsModal(){

    const modal =
        document.getElementById(
            "news-modal"
        )

    if(modal){
        modal.hidden = true
    }
}


function resetNewsForm(){

    [
        "news-title",
        "news-content",
        "news-image"
    ].forEach(id => {

        const el =
            document.getElementById(
                id
            )

        if(el){

            if(
                el.type === "file"
            ){
                el.value = ""
            }else{
                el.value = ""
            }
        }
    })

    const active =
        document.getElementById(
            "news-active"
        )

    if(active){
        active.checked = true
    }

    const pinned =
        document.getElementById(
            "news-pinned"
        )

    if(pinned){
        pinned.checked = false
    }
}



// ======================================
// SAFE
// ======================================
function escapeHtml(str){

    if(!str) return ""

    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function getCSRFToken(){

    return document.cookie
        .split("; ")
        .find(
            row =>
                row.startsWith(
                    "csrftoken="
                )
        )
        ?.split("=")[1] || ""
}