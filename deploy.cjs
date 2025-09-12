let AWS = require('aws-sdk');
let fs = require('fs');
const zlib = require('zlib');
const path = require('path');

console.log(`deploy:[${process.env.NODE_ENV}]-start`);

const deploy = {
  path: 'calorie_v2',
};

const awsConfig = {
  region: 'us-east-1',
  apiVersion: '2006-03-01',
  // bucketName:'vsa-test-all',
  bucketName: 'vsa-bucket-public-new',
  basePath: `miniapps/${deploy.path}/`,
  ContentType: 'valid content type',
};

const distPath = './dist/';
function travelPath(dir, callback, extensions = ['html','js','jsbundle', 'css', 'png', 'jpg', 'jpeg', 'map', 'gif', 'ttf', 'otf', 'webp', 'ico', 'json', 'hbc']) {
  fs.readdirSync(dir).forEach((file)=>{
    let pathname = path.join(dir, file);
    if (fs.statSync(pathname).isDirectory()) {
      travelPath(pathname, callback);
    } else {
      const pathSplits = pathname.split('.');
      if (pathSplits.length > 1 && extensions.includes(pathSplits[pathSplits.length - 1])) {
        callback(pathname);
      }
    }
  });
}
AWS.config.update({ region: awsConfig.region });

let s3 = new AWS.S3({ apiVersion: awsConfig.apiVersion });

const uploadFile = (file)=>{
  let uploadParams = { Bucket: awsConfig.bucketName, Key: '', Body: '' };
  let fileStream = fs.createReadStream(file);
  let gzipStream = zlib.createGzip();
  fileStream.on('error', (err) => {
    console.log('File Error', err);
  });
  uploadParams.Body = fileStream.pipe(gzipStream);
  uploadParams.Key = `${awsConfig.basePath}${file.replace(distPath, '')}`;
  const fileType = file.split('.').pop();
  if (fileType === 'js') {
    uploadParams.ContentType = 'text/javascript';
  }
  if (fileType === 'css') {
    uploadParams.ContentType = 'text/css';
  }
  if (fileType === 'html') {
    uploadParams.ContentType = 'text/html';
  }

  

  uploadParams.ContentEncoding = 'gzip';

  console.log(uploadParams.Key);
  s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.log('Error', err);
    } if (data) {
      console.log('Upload Success', data.Location);
    }
  });
};

travelPath(distPath, (pathname)=>{
  uploadFile(`./${pathname}`);
});

console.log(`deploy:[${process.env.NODE_ENV}]-end`);
