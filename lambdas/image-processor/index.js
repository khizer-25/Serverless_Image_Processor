const sharp = require("sharp");

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} = require("@aws-sdk/client-s3");

const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  PutCommand
} = require("@aws-sdk/lib-dynamodb");

const s3 = new S3Client({
  region: "us-east-1"
});

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: "us-east-1"
  })
);

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

exports.handler = async (event) => {
  try {

    const bucket =
      event.Records[0].s3.bucket.name;

    const key =
      decodeURIComponent(
        event.Records[0].s3.object.key
      );

    console.log(
      `Processing image: ${key}`
    );

    const image =
      await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key
        })
      );

    const originalBuffer =
      await streamToBuffer(
        image.Body
      );

    const baseName =
      key.substring(
        0,
        key.lastIndexOf(".")
      );

    const compressed =
      await sharp(originalBuffer)
        .jpeg({ quality: 85 })
        .toBuffer();

    const low =
      await sharp(originalBuffer)
        .jpeg({ quality: 60 })
        .toBuffer();

    const webp =
      await sharp(originalBuffer)
        .webp({ quality: 85 })
        .toBuffer();

    const png =
      await sharp(originalBuffer)
        .png()
        .toBuffer();

    const thumbnail =
      await sharp(originalBuffer)
        .resize(200, 200)
        .jpeg({ quality: 80 })
        .toBuffer();

    const processedBucket =
      process.env.PROCESSED_BUCKET;

    const uploads = [
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

    for (const file of uploads) {

      await s3.send(
        new PutObjectCommand({
          Bucket: processedBucket,
          Key: file.key,
          Body: file.body,
          ContentType: file.type
        })
      );
    }

    await ddb.send(
      new PutCommand({
        TableName:
          process.env.TABLE_NAME,

        Item: {
          imageId:
            Date.now().toString(),

          original: key,

          compressed:
            `${baseName}_compressed.jpg`,

          low:
            `${baseName}_low.jpg`,

          webp:
            `${baseName}.webp`,

          png:
            `${baseName}.png`,

          thumbnail:
            `${baseName}_thumbnail.jpg`,

          uploadDate:
            new Date()
              .toISOString()
        }
      })
    );

    console.log(
      "Processing completed"
    );

    return {
      statusCode: 200
    };

  } catch (err) {

    console.error(err);

    throw err;
  }
};