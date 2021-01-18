const Koa = require('koa')
const Router = require('@koa/router');
const router = new Router();
const axios = require('axios')
const crypto = require('crypto');
const koaBody = require('koa-body');

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

const app = new Koa()
const APP_ID = 'wxcfdd9a5d9a5aa40b'
const APP_SECRET = 'f69678e9c7167b7af430dda95e3ef14f'
const tokenCache = {
  token: "",
  createTime: null
}

const ticketCache = {
  ticket: "",
  createTime: null
}
async function getToken() {
  if (tokenCache.token && Date.now() - tokenCache.createTime < 1.5 * 60 * 60 * 1000) {
    console.log('读取 缓存token,距离里过期时间还有：', (1.5 * 60 * 60 * 1000 - (Date.now() - tokenCache.createTime)) / 1000, '秒')
    return tokenCache.token
  }
  tokenCache.token = ''
  tokenCache.createTime = null
  const res =  await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`)
  console.log('新token: ', res.data.access_token, '有效时长', res.data.expires_in)
  tokenCache.token = res.data.access_token
  tokenCache.createTime = Date.now()
  return  tokenCache.token
}

async function getTicket() {
  if (ticketCache.ticket && Date.now() - ticketCache.createTime < 1.5 * 60 * 60 * 1000) {
    console.log('读取 缓存ticket,距离里过期时间还有：', (1.5 * 60 * 60 * 1000 - (Date.now() - ticketCache.createTime)) / 1000, '秒')
    return ticketCache.ticket
  }
  const token = await getToken()
  ticketCache.ticket = ''
  ticketCache.createTime = null
  const res = await  axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`)
  console.log('新ticket: ', res.data.ticket, '有效时长', res.data.expires_in)
  ticketCache.ticket = res.data.ticket
  ticketCache.createTime = Date.now()
  return ticketCache.ticket
}

router.get('/api/wx', ctx => {
  console.log('微信服务')
  ctx.body = ctx.query.echostr
})

router.get('/api/ticket.js', async ctx => {
  const { url, callback } = ctx.query
  const noncestr = 'NO' + Math.random()
  ctx.assert(url, 'url 必填项')
  const timestamp = Date.now()
  console.log('获取ticket ', ' url', url)
  const ticket = await getTicket()
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

app.listen(7200, () => {
  console.log('http://localhost:7200')
})
