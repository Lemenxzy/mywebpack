/**
 * @Author zhiyuan.xu
 * @Date 2020-04-08
 * @Version 1.0.0
 * @Last Modified by zhiyuan.xu
 * @Last Modified Time 2020-04-08
 */
const babylon = require('babylon');
const babel = require("@babel/core");
const fs = require('fs');
const path = require('path');
const traverse = require("@babel/traverse").default;

/**
 * 获取文件，解析成ast语法
 * @param filename // 入口文件
 * @returns {*}
 */
function getAst (filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    return babylon.parse(content, {
        sourceType: 'module',
    });
}

/**
 * 编译
 * @param ast
 * @returns {*}
 */
function getTranslateCode(ast) {
    const {code} = babel.transformFromAst(ast, null, {
        presets: ['@babel/preset-env']
    });
    return code
}

function getDependence (ast) {
    let dependencies = []
    traverse(ast, {
        ImportDeclaration: ({node}) => {
            dependencies.push(node.source.value);
        },
    })
    return dependencies
}

/**
 * 生成完整的文件依赖关系映射
 * @param fileName
 * @param entry
 * @returns {{fileName: *, dependence, code: *}}
 */
function parse(fileName, entry) {
    let filePath = fileName.indexOf('.js') === -1 ? fileName + '.js' : fileName;
    let dirName = entry ? '' : path.dirname(config.entry);
    let absolutePath = path.join(dirName, filePath);
    const ast = getAst(absolutePath);
    return {
        fileName,
        dependence: getDependence(ast),
        code: getTranslateCode(ast),
    };
}

/**
 * 获取深度队列依赖关系
 * @param main
 * @returns {*[]}
 */
function getQueue(main) {
    let queue = [main]
    for (let asset of queue) {
        asset.dependence.forEach(function (dep) {
            let child = parse(dep)
            queue.push(child)
        })
    }
    return queue
}

function bundle(queue) {
    let modules = '';
    queue.forEach(function (mod) {
        modules += `'${mod.fileName}': function (require, module, exports) { ${mod.code} },`
    });

    const result = `
    (function(modules) {
      function require(fileName) {
        var fn = modules[fileName];

        var module = { exports : {} };

        fn(require, module, module.exports);

        return module.exports;
      }

      require('${config.entry}');
    })({${modules}})
  `;

    // We simply return the result, hurray! :)
    return result;
}

function bundleFile(option) {
    config = option;
    let mainFile = parse(config.entry, true);
    let queue = getQueue(mainFile);
    return bundle(queue)
}

module.exports = bundleFile;

