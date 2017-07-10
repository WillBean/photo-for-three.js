/**
 * Created by gzliweibin on 2017/5/15.
 *
 * 图片文件转js格式脚本
 *
 */
let fs = require('fs')
let getPixels = require('get-pixels')
let filepath = './images'
let filename = 'image.js'

let file = fs.readdirSync(filepath)
if (!file) {
  console.error(err)
}

let res = []
let len = file.length
file.sort()

let promiseList = []
for (let i = 0; i < len; i++) {
  if (/\.jpg|png|gif$/i.test(file[i])) {
    promiseList.push(getImage(i))
  }
}
Promise.all(promiseList).then((d) => {
  res = 'var imageJsonFile = ' + JSON.stringify(res);
  fs.writeFile(filename, res, (err) => {
    if (err) {
      console.error(err)
      return
    }
    console.log('文件操作成功!')
    console.log(res)
  })
}).catch((err) => {
  console.error(err)
})


function getImage(i) {
  return new Promise((resolve, reject) => {
    let obj = {};
    obj['image'] = filepath + '/' + file[i];
    console.log(`loading:${filepath + '/' + file[i]}\nfile index:${i}`);
    getImagePixels(filepath + '/' + file[i]).then((shape) => {
      obj['width'] = shape[0]
      obj['height'] = shape[1]

      console.log(`loaded:${filepath + '/' + file[i]}\nfile index:${i}`);

      if (file[i + 1] && /\.mov$/i.test(file[i + 1]) && file[i].match(/(\w*)\./)[1] === file[i + 1].match(/(\w*)\./)[1]) {
        obj['video'] = filepath + '/' + file[++i];
      }
      res.push(obj)

      resolve(i)
    })
  })
}

function getImagePixels(path) {

  return new Promise((resolve, reject) => {
    getPixels(path, function (err, pixels) {
      if (err) {
        console.error(`loading ${path} got an error:\n${err}`);
        reject()
        return

      }
      resolve(pixels.shape.slice())
    })
  })
}