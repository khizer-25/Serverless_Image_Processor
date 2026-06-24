const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: "us-east-1"
});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const fileName = body.fileName;

    const command = new PutObjectCommand({
      Bucket: "khizer-image-upload",
      Key: fileName,
      ContentType: body.contentType
    });

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 300
      }
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        uploadUrl,
        key: fileName
      })
    };
  } catch (err) {
    console.log(err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to generate upload URL"
      })
    };
  }
};