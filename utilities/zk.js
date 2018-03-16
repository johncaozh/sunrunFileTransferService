var env = require('./env');
var zookeeper = require('node-zookeeper-client');
var zkClient = null;

async function daemon() {
    await connect(true);
}

async function connect(reconnect) {
    if (zkClient != null) {
        var stat = zkClient.getState();
        if (stat === zookeeper.State.SYNC_CONNECTED || stat === zookeeper.State.CONNECTED_READ_ONLY)
            return Promise.resolve(true);
    }

    return new Promise(function (resolve, reject) {
        zkClient = zookeeper.createClient(env.zeekeeperConfig.host, {
            sessionTimeout: 10000,
            spinDelay: 1000,
            retries: 3
        });

        zkClient.once("connected", function () {
            console.log("zk cluster connected");
            resolve(true);
        });

        zkClient.once("disconnected", function () {
            console.log("zk cluster disconnected");
            if (reconnect)
                connect();

            reject("zk cluster disconnected");
        });

        console.log('zk cluster connecting');
        zkClient.connect();
    });
}

async function close() {
    if (zkClient)
        zkClient.close();
}

async function getChildren(path) {
    await connect();

    return new Promise(function (resolve, reject) {
        zkClient.getChildren(path, function (error, children, stats) {
            if (error) {
                reject(error);
                return;
            }

            resolve(children);
        });
    });
}

async function create(path, data) {
    await connect();

    return new Promise(function (resolve, reject) {
        zkClient.create(
            path,
            new Buffer(data),
            zookeeper.CreateMode.PERSISTENT,
            function (error, path) {
                if (error) {
                    reject(error.stack);
                    return;
                }

                resolve(true);
            }
        );
    });
}

async function remove(path) {
    await connect();

    return new Promise(function (resolve, reject) {
        zkClient.remove(path,
            function (error, path) {
                if (error) {
                    reject(error.stack);
                    return;
                }

                resolve(true);
            }
        );
    });
}

async function getData(path, changedCallback) {
    await connect();

    return new Promise(function (resolve, reject) {
        zkClient.getData(
            path,
            function (event) {
                console.log('Got event: %s.', event);
 
                if (changedCallback)
                    changedCallback();
            },
            function (error, data, stat) {
                if (error) {
                    reject(error.stack);
                    return;
                }

                resolve(data ? data.toString('utf8') : "");
            }
        );
    });
}

async function setData(path, data) {
    await connect();

    return new Promise(function (resolve, reject) {
        zkClient.setData(path, new Buffer(data), -1, function (error, stat) {
            if (error) {
                reject(error.stack);
                return;
            }

            resolve(true);
        });
    });
}

async function mkdir(path) {
    await connect();

    return new Promise(function (resolve, reject) {
        zkClient.mkdirp(path, function (error, path) {
            if (error) {
                reject(error.stack);
                return;
            }

            resolve(true);
        });
    });
}

async function exists(path) {
    await connect();

    return new Promise(function (resolve, reject) {
        if (error) {
            reject(error.stack);
            return;
        }

        if (stat) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

module.exports = {
    daemon,
    connect,
    close,
    getChildren,
    create,
    remove,
    getData,
    setData,
    mkdir,
    exists,
}