const UPLOAD_API =
"https://n15fhozm28.execute-api.us-east-1.amazonaws.com/prod/upload-url";

const IMAGES_API =
"https://n15fhozm28.execute-api.us-east-1.amazonaws.com/prod/images";

async function uploadImage() {

    const file =
    document.getElementById(
      "imageInput"
    ).files[0];

    const message =
    document.getElementById(
      "message"
    );

    const progressBar =
    document.getElementById(
      "progressBar"
    );

    if(!file){

        message.innerText =
        "Select an image first";

        return;
    }

    try{

        const response =
        await fetch(
          UPLOAD_API,
          {
            method:"POST",
            headers:{
              "Content-Type":
              "application/json"
            },
            body:JSON.stringify({
              fileName:file.name,
              contentType:file.type
            })
          }
        );

        const data =
        await response.json();

        localStorage.setItem(
          "currentFile",
          data.key
        );

        const xhr =
        new XMLHttpRequest();

        xhr.upload.addEventListener(
          "progress",
          e=>{

            if(e.lengthComputable){

              const percent =
              (e.loaded/e.total)*100;

              progressBar.style.width =
              percent + "%";
            }
          }
        );

        xhr.onload = ()=>{

          if(xhr.status===200){

            message.innerText =
            "✅ Upload successful. Processing image...";

            setTimeout(
              loadResults,
              5000
            );

          }else{

            message.innerText =
            "❌ Upload failed";
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

    }catch(error){

        console.error(error);

        message.innerText =
        "Something went wrong";
    }
}

async function loadResults(){

    const fileName =
    localStorage.getItem(
      "currentFile"
    );

    if(!fileName) return;

    const response =
    await fetch(
      `${IMAGES_API}?fileName=${encodeURIComponent(fileName)}`
    );

    const image =
    await response.json();

    if(!image.imageId){

        setTimeout(
          loadResults,
          3000
        );

        return;
    }

    document.getElementById(
      "message"
    ).innerText =
    "✅ Processing completed";

    document.getElementById(
      "results"
    ).innerHTML = `

      <h2>Processed Variants</h2>

      ${createCard(
        image.compressed,
        "Compressed JPEG"
      )}

      ${createCard(
        image.low,
        "Low Quality JPEG"
      )}

      ${createCard(
        image.webp,
        "WebP"
      )}

      ${createCard(
        image.png,
        "PNG"
      )}

      ${createCard(
        image.thumbnail,
        "Thumbnail"
      )}

    `;
}

function createCard(
  url,
  title
){

    return `

    <div class="card">

      <img
        src="${url}"
      >

      <h3>${title}</h3>

      <a
        href="${url}"
        target="_blank"
        download
      >
        Download
      </a>

    </div>

    `;
}