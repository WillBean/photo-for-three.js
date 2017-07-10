/**
 * Created by gzliweibin on 2017/7/10.
 */
const koa = require('koa');
const app = new koa();
const  serve = require("koa-static");

app.use(serve(__dirname,{ extensions: ['html','js','jpg','mov']}));

app.listen(3000, ()=>{console.log(`listening 3000`)});
