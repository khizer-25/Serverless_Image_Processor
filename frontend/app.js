const UPLOAD_API =
"https://n15fhozm28.execute-api.us-east-1.amazonaws.com/prod/upload-url";

const PROCESSED_BUCKET =
"https://khizer-image-processed.s3.amazonaws.com";

async function uploadImage() {

    const file =
    document.getElementById("imageInput").files[0];

    const message =
    document.getElementById("message");

    const progressBar =
    document.getElementById("progressBar");

    const previewSection =
    document.getElementById("previewSection");

    if (!file) {
        message.innerText =
        "Please select an image";
        return;
    }

    previewSection.innerHTML = "";

    try {

        message.innerText =
        "Generating upload URL...";

        const response =
        await fetch(UPLOAD_API,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                fileName:file.name,
                contentType:file.type
            })
        });

        const data =
        await response.json();

        const xhr =
        new XMLHttpRequest();

        xhr.upload.addEventListener(
        "progress",
        e => {

            if(e.lengthComputable){

                const percent =
                (e.loaded/e.total)*100;

                progressBar.style.width =
                percent + "%";

                message.innerText =
                `Uploading ${Math.round(percent)}%`;
            }
        });

        xhr.onload = () => {

            if(xhr.status === 200){

                message.innerHTML = `
                ⏳ Processing image...
                <br>
                `;

                setTimeout(() => {

                    showImages(
                        file.name
                    );

                },5000);

            } else {

                message.innerText =
                "Upload failed";
            }
        };

        xhr.open(
            "PUT",
            data.uploadUrl
        );

        xhr.setRequestHeader(
            "Content-Type",
            file.type
        );

        xhr.send(file);

    } catch(error){

        console.error(error);

        message.innerText =
        "Upload failed";
    }
}

async function showImages(fileName){

    const baseName =
    fileName.substring(
        0,
        fileName.lastIndexOf(".")
    );

    const files = [
        {
            title:"Compressed JPG",
            url:`${PROCESSED_BUCKET}/${baseName}_compressed.jpg`,
            filename:`${baseName}_compressed.jpg`
        },
        {
            title:"Low Quality JPG",
            url:`${PROCESSED_BUCKET}/${baseName}_low.jpg`,
            filename:`${baseName}_low.jpg`
        },
        {
            title:"WEBP",
            url:`${PROCESSED_BUCKET}/${baseName}.webp`,
            filename:`${baseName}.webp`
        },
        {
            title:"PNG",
            url:`${PROCESSED_BUCKET}/${baseName}.png`,
            filename:`${baseName}.png`
        },
        {
            title:"Thumbnail",
            url:`${PROCESSED_BUCKET}/${baseName}_thumbnail.jpg`,
            filename:`${baseName}_thumbnail.jpg`
        }
    ];

    let html = `

    <h2 class="results-title">
        Processed Images
    </h2>

    <div class="grid">

    `;

    files.forEach(file => {

        html += `

        <div class="card">

            <img
                src="${file.url}"
                alt="${file.title}"
            >

            <h3>${file.title}</h3>

            <div class="actions">

                <a
                    href="${file.url}"
                    target="_blank"
                    class="view-btn">
                    Preview
                </a>

                <button
                    class="download-btn"
                    onclick="downloadFile(
                    '${file.url}',
                    '${file.filename}'
                    )">
                    Download
                </button>

            </div>

        </div>

        `;
    });

    html += `</div>`;

    document.getElementById(
        "previewSection"
    ).innerHTML += html;

    document.getElementById(
        "message"
    ).innerHTML =
    "✅ Processing Completed";
}

function downloadFile(url, filename){

    fetch(url)
    .then(response => response.blob())
    .then(blob => {

        const link =
        document.createElement("a");

        link.href =
        URL.createObjectURL(blob);

        link.download =
        filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(link.href);
    })
    .catch(error => {
        console.error(error);
    });
}

document
.getElementById("imageInput")
.addEventListener("change", function(){

    const file =
    this.files[0];

    document.getElementById(
        "selectedFile"
    ).innerText =
    file
        ? file.name
        : "No file selected";
});