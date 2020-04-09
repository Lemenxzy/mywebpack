/**
 * @Author zhiyuan.xu
 * @Date 2020-04-08
 * @Version 1.0.0
 * @Last Modified by zhiyuan.xu
 * @Last Modified Time 2020-04-08
 */
const express = require('express');
const app = express();
const c = require('child_process');
const bundleFile = require('./index.js');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const socketIo = require("socket.io");
const http = require("http");
let needOpenBro = true;

// webpack dev config
const config = {
    entry: 'test/index.js',
    output: '/dist',
    port: 3000
};

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
// 做一个映射
app.use('/dist', express.static('public'));

const server = http.createServer(app);
// socket
const io = socketIo(server);

// 重新编译。重新写入
function reloadJs() {
    const result = bundleFile(config);
    fs.writeFileSync(path.join(__dirname, '../public/index.js'), result, {
        encoding: 'utf8',
    });
}

// 监听文件变化
let flag = false;
const watcherDoc = chokidar.watch('test', {
    persistent: true,
    ignoreInitial: true
});

watcherDoc.on('add', path => {
    flag = true;
    console.log(`File ${path} has been added`)
}).on('change', path => {
    flag = true;
    console.log(`File ${path} has been changed`)
}).on('unlink', path => {
    flag = true;
    console.log(`File ${path} has been remove`)
});

// 发生变化时要做的事情
const getApiAndEmit = (socket) => {
    if (flag) {
        reloadJs();
        socket.emit("refresh", 'refresh');
        flag = false;
    }
};


const OpenBro = () => {
    console.log(`> Nfes Ready on http://localhost:${config.port}`);
    needOpenBro = false;
    // 主动打开游览器
    const platformObj = {
        wind32: 'start',
        linux: 'xdg-open',
        darwin: 'open'
    };
    c.exec(`${platformObj[process.platform]} http://localhost:${config.port}`);
};

let interval;
io.on("connection", socket => {
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(() => getApiAndEmit(socket), 1000);
    socket.on("disconnect", () => {
    });
    // socket.io 完成之后再进行打开游览器
    if (needOpenBro) {
        OpenBro();
    }
});

// 根据配置
function main(config) {
    fs.mkdir(`public`,function(err){
        reloadJs();
        let html = fs.readFileSync(path.join(__dirname, '../index.html'),{
            encoding: 'utf8',
        }).toString();
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            `<script src="${config.output}/index.js"></script>
                <script>
                function addScript (src, callback) {
                    var newScript = document.createElement('script');
                    newScript.src = src;
                    document.body.appendChild(newScript);
                    if(callback){
                        newScript.onload = callback;
                        newScript.onreadystatechange = function() { 
                            var state = newScript.readyState; 
                            if (state === 'loaded' || state === 'complete') { 
                                newScript.onreadystatechange = null; 
                                return callback();
                            } 
                        }; 
                    }
                };
                addScript('https://cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js', function () {
                    var socket = io('http://localhost:3000');
                    socket.on("refresh", data => {
                        console.log(1232321, data);
                        window.location.reload()
                    });
                });
                </script>
        `);
        fs.writeFileSync(path.join(__dirname, '../public/index.html'), html, {
            encoding: 'utf8',
        });
    });
}
main(config);

server.listen(config.port);


