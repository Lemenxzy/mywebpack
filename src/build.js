/**
 * @Author zhiyuan.xu
 * @Date 2020-04-08
 * @Version 1.0.0
 * @Last Modified by zhiyuan.xu
 * @Last Modified Time 2020-04-08
 */
const bundleFile = require('./index.js');
const fs = require('fs');
const config = require('../config/build.config.js');

function main(config) {
    const result = bundleFile(config);

    fs.mkdir(`${config.output}`,function(err){
        fs.writeFile(`${config.output}/index.js`, result, 'utf8', function(err) {
            if (err) {
                throw err;
            }
        });
    });
    fs.copyFileSync(config.template, `${config.output}/${config.template}`);
}

main(config);
