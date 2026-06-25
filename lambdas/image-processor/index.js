const sharp = require("sharp");

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "us-east-1"
});

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
};

exports.handler = async (event) => {

  console.log("STEP 1: Handler Started");

  try {

    const bucket =
      event.Records[0].s3.bucket.name;

    const key =
      decodeURIComponent(
        event.Records[0].s3.object.key
      );

    console.log("STEP 2: Bucket =", bucket);
    console.log("STEP 3: Key =", key);

    const extension =
      key.split(".").pop().toLowerCase();

    const supportedFormats = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "tiff",
      "avif"
    ];

    if (!supportedFormats.includes(extension)) {

      console.log(
        "Skipping non-image file:",
        key
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "Non-image file skipped"
        })
      };
    }

    const image =
      await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key
        })
      );

    console.log("STEP 4: Image Downloaded");

    const originalBuffer =
      await streamToBuffer(
        image.Body
      );

    console.log(
      "STEP 5: Buffer Created",
      originalBuffer.length
    );

    const baseName =
      key.substring(
        0,
        key.lastIndexOf(".")
      );

    console.log(
      "STEP 6: Generating Variants"
    );

    const compressed = Buffer.from(
      await sharp(originalBuffer)
        .jpeg({ quality: 85 })
        .toBuffer()
    );

    const low = Buffer.from(
      await sharp(originalBuffer)
        .jpeg({ quality: 60 })
        .toBuffer()
    );

    const webp = Buffer.from(
      await sharp(originalBuffer)
        .webp({ quality: 85 })
        .toBuffer()
    );

    const png = Buffer.from(
      await sharp(originalBuffer)
        .png()
        .toBuffer()
    );

    const thumbnail = Buffer.from(
      await sharp(originalBuffer)
        .resize(200, 200)
        .jpeg({ quality: 80 })
        .toBuffer()
    );

    console.log(
      "STEP 7: Variants Generated"
    );

    const processedBucket =
      process.env.PROCESSED_BUCKET;

    const files = [
      {
        key: `${baseName}_compressed.jpg`,
        body: compressed,
        type: "image/jpeg"
      },
      {
        key: `${baseName}_low.jpg`,
        body: low,
        type: "image/jpeg"
      },
      {
        key: `${baseName}.webp`,
        body: webp,
        type: "image/webp"
      },
      {
        key: `${baseName}.png`,
        body: png,
        type: "image/png"
      },
      {
        key: `${baseName}_thumbnail.jpg`,
        body: thumbnail,
        type: "image/jpeg"
      }
    ];

    console.log(
      "STEP 8: Uploading Variants"
    );

    for (const file of files) {

      await s3.send(
        new PutObjectCommand({
          Bucket: processedBucket,
          Key: file.key,

          // Important fix for Node 24
          Body: Uint8Array.from(file.body),

          ContentType: file.type
        })
      );

      console.log(
        "Uploaded:",
        file.key
      );
    }

    console.log(
      "STEP 9: Processing Complete"
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (error) {

    console.error(
      "ERROR:",
      error
    );

    throw error;
  }
};