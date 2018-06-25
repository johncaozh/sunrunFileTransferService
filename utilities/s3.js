var aws = require('aws-sdk');
var env = require('./env');
var zk = require('./zk');
var fs = require('fs');
const md5File = require('md5-file/promise')
var s3Client = null;
var config = env.s3Config;

async function init() {
    await zk.daemon();
    config.endpoint = await zk.getData(env.zeekeeperConfig.s3_endpont, refreshS3Endpoint);
    config.accessKeyId = await zk.getData(env.zeekeeperConfig.s3_accessKey, updateS3AccessKeyId);
    config.secretAccessKey = await zk.getData(env.zeekeeperConfig.s3_secretKey, updateS3SecretAccessKey);
    config.bucketName = await zk.getData(env.zeekeeperConfig.s3_bucket, updateS3BucketName);
    updateS3Client();
}

async function updateS3Client() {
    aws.config.update(config);
    s3Client = new aws.S3();
    s3Client.endpoint = new aws.Endpoint(config.endpoint);
}

async function refreshS3Endpoint() {
    config.endpoint = await zk.getData(env.zeekeeperConfig.s3_endpont, refreshS3Endpoint);
    await updateS3Client();
}

async function updateS3AccessKeyId() {
    config.accessKeyId = await zk.getData(env.zeekeeperConfig.s3_accessKey, updateS3AccessKeyId);
    await updateS3Client();
}

async function updateS3SecretAccessKey() {
    config.secretAccessKey = await zk.getData(env.zeekeeperConfig.s3_secretKey, updateS3SecretAccessKey);
    await updateS3Client();
}

async function updateS3BucketName() {
    config.bucketName = await zk.getData(env.zeekeeperConfig.s3_bucket, updateS3BucketName);
    await updateS3Client();
}

async function refreshS3ClientConfig() {
    var config = env.s3Config;
    config.endpoint = await zk.getData(env.zeekeeperConfig.s3_endpont, refreshS3ClientConfig);
    config.accessKeyId = await zk.getData(env.zeekeeperConfig.s3_accessKey, refreshS3ClientConfig);
    config.secretAccessKey = await zk.getData(env.zeekeeperConfig.s3_secretKey, refreshS3ClientConfig);
    config.bucketName = await zk.getData(env.zeekeeperConfig.s3_bucket, refreshS3ClientConfig);
}

async function uploadObject(filePath, objectKey, mimeType) {
    var fileData = fs.readFileSync(filePath);
    var request = {
        Bucket: env.s3Config.bucketName,
        Key: objectKey,
        Body: new Buffer(fileData),

    };

    if (mimeType)
        request.ContentType = mimeType;

    return await s3Client.putObject(request).promise();
}

async function getObjectStream(objectKey) {
    var request = {
        Bucket: env.s3Config.bucketName,
        Key: objectKey,
    };
    return await s3Client.getObject(request).createReadStream();
}

async function getObjectPresignedUrl(objectKey, expires) {
    var request = {
        Bucket: env.s3Config.bucketName,
        Key: objectKey,
        Expires: expires || 86400,
    }

    return s3Client.getSignedUrl('getObject', request);
}

async function checkObjectExist(objectKey) {
    try {
        var request = {
            Bucket: env.s3Config.bucketName,
            Key: objectKey
        }
        var result = await s3Client.getObject(request).promise();
        return result != null;
    } catch (err) {
        return false;
    }
}

async function getFileMd5(filePath) {
    var md5 = await md5File(filePath);
    return md5.toUpperCase();
}

function getLink(serverId) {
    return `${config.endpoint.startsWith('http://')?'':"http://"}${config.endpoint}/${config.bucketName}/${serverId}`
}

async function putObjectACL(serverId) {
    var request = {
        Bucket: env.s3Config.bucketName,
        Key: serverId,
        ACL: 'public-read',
    };

    return await s3Client.putObjectAcl(request).promise();
}

module.exports = {
    init,
    uploadObject,
    getObjectStream,
    getObjectPresignedUrl,
    checkObjectExist,
    getFileMd5,
    refreshS3ClientConfig,
    getLink,
    putObjectACL
}