const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: "us-east-1"
  })
);

exports.handler = async () => {

  try {

    const result = await ddb.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME
      })
    );

    const images = result.Items.map(item => ({
      imageId: item.imageId,
      original: item.original,

      compressed:
        `https://khizer-image-processed.s3.amazonaws.com/${item.compressed}`,

      low:
        `https://khizer-image-processed.s3.amazonaws.com/${item.low}`,

      webp:
        `https://khizer-image-processed.s3.amazonaws.com/${item.webp}`,

      png:
        `https://khizer-image-processed.s3.amazonaws.com/${item.png}`,

      thumbnail:
        `https://khizer-image-processed.s3.amazonaws.com/${item.thumbnail}`,

      uploadDate:
        item.uploadDate
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(images)
    };

  } catch (error) {

    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};