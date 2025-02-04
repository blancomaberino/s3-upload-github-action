const aws = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const spacesEndpoint = new aws.Endpoint(process.env.S3_ENDPOINT);
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const uploadFile = (fileName, avoidHiddenFiles = false) => {
  if (fileName instanceof Array === true) {
    for (let i = 0; i < fileName.length; i++) {
      uploadFile(`${fileName[i]}`, avoidHiddenFiles);
    }
    return;
  } 
  if (avoidHiddenFiles && fileName.match(/(^|\/)\.[^\.\/]+/)) {
    console.log(fileName);
    return;
  }
  if (fs.lstatSync(fileName).isDirectory()) {
    fs.readdirSync(fileName).forEach((file) => {
      uploadFile(`${fileName}/${file}`, avoidHiddenFiles);
    });
  } else {
    const fileContent = fs.readFileSync(fileName);
    console.log(`Normalized path: ${process.env.S3_PREFIX || ""}${path.normalize(fileName)}`);
    // Setting up S3 upload parameters
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${process.env.S3_PREFIX || ""}${path.normalize(fileName)}`,
      Body: fileContent
    };
    let extension = fileName.match(/\.(.{2,4})$/);
    extension = extension && extension.length > 1 ? extension[1] : null;
    let contentType = null;
    if (extension) {
      switch (extension) {
        case 'html': contentType = 'text/html'; break;
        case 'css': contentType = 'text/css'; break;
        case 'js': contentType = 'text/javascript'; break;
        case 'svg': contentType = 'image/svg+xml'; break;
        case 'png': contentType = 'image/x-png'; break;
        case 'jpg': contentType = 'image/jpeg'; break;
      }
    }
    if (contentType) {
      params.ContentType = contentType;
    }
    const acl = process.env.S3_ACL;
    if (acl) {
      params.ACL = acl;
    }

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successful. ${data.Location}`);
    });
  }
};

uploadFile(process.env.FILE, process.env.AVOID_HIDDEN);


