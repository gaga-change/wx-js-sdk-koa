const Koa = require('koa')
const Router = require('@koa/router');
const router = new Router();
const axios = require('axios')
const crypto = require('crypto');
const koaBody = require('koa-body');
const schedule = require('node-schedule');
const dayjs = require('dayjs');

function log(...args) {
  console.log(...[dayjs().format('YYYY-MM-DD HH:mm:ss'), ':', ...args])
}

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

const app = new Koa()
const APP_ID = 'wxcfdd9a5d9a5aa40b'
const APP_SECRET = 'f69678e9c7167b7af430dda95e3ef14f'

const ticketCache = {
  ticket: "",
}

async function fetchTokenAndTicket() {
  const tokenRes =  await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`)
  const token = tokenRes.data.access_token
  log('新token', token,'有效时长', tokenRes.data.expires_in )
  const ticketRes = await  axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`)
  const ticket = ticketRes.data.ticket
  log('新ticket: ', ticket, '有效时长', ticketRes.data.expires_in)
  ticketCache.ticket = ticket
}

schedule.scheduleJob('0 55 7 * * ?', async function(){
  log('定时器启动')
  await fetchTokenAndTicket()
  log('刷新token、ticket结束')
});
// schedule.scheduleJob('0 0 0/3 * * ?', async function(){
//   log('定时器启动')
//   await fetchTokenAndTicket()
//   log('刷新token、ticket结束')
// });

// schedule.scheduleJob('0 30 1/3 * * ?', async function(){
//   log('定时器启动')
//   await fetchTokenAndTicket()
//   log('刷新token、ticket结束')
// });

router.get('/api/ticket.js', async ctx => {
  const { url, callback } = ctx.query
  const noncestr = 'NO' + Math.random()
  ctx.assert(url, 'url 必填项')
  const timestamp = Date.now()
  log('请求秘钥 ', ' url:', url)
  const ticket = ticketCache.ticket
  const signature = sha1(`jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`)
  ctx.set('Content-Type', 'text/javascript')
  ctx.body = `${callback || 'callback'}(${JSON.stringify({
    data: {
      signature,
      noncestr,
      timestamp
    }
  })})`
})
app.use(koaBody())
app.use(router.routes())

app.use(ctx => {
  ctx.body = "weixin server"
})

fetchTokenAndTicket().then(_ => {
  app.listen(7200, () => {
    log('http://localhost:7200')
  })
})

