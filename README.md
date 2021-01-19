# 微信js-sdk获取
> 使用koa.js 实现


## 环境变量配置

在微信公众号中获取

* `APP_ID`
* `APP_SECRET`

## 项目运行

下载依赖

`npm i `

运行项目

`npm run start`


## 获取签名接口（jsonp）

请求类型： `GET`

请求地址：`/api/ticket.js`

请求参数：
1. `url` 网页地址
2. `callback` 回调方法名称

返回数据：
`signature`、`noncestr`、`timestamp`
