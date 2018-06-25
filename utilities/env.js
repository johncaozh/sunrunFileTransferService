const s3Config = {
    accessKeyId: '',
    secretAccessKey: '',
    endpoint: "",
    sslEnabled: false,
    s3ForcePathStyle: true,
    bucketName: "",
    path: "",
}

const zeekeeperConfig = {
    host: '10.254.50.27:2181',
    s3_endpont: '/custom/s3/endpoint',
    s3_accessKey: '/custom/s3/accesskey',
    s3_secretKey: '/custom/s3/secretKey',
    s3_bucket: '/custom/s3/bucket',
}

module.exports = {
    s3Config,
    zeekeeperConfig
}