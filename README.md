# modelarts-wechaty


## Inital

```bash
npm install qrcode-terminal --save
npm install wechaty 
npm install wechaty-puppet-wechat --save // 这个依赖是关键
export WECHATY_PUPPET=wechaty-puppet-wechat // 这里也是关键，需要配置你使用的puppet
```

## Add Config

- config.js
```
module.exports = {
    TokenURL: 'https://iam.myhuaweicloud.com/v3/auth/tokens?nocatalog=true', // 获取token的地址
    IAMDomain: 'your domain', // IAM用户所属帐号名
    IAMUser: 'your username', // IAM用户名
    IAMPassword: 'your password', // IAM用户密码
    IAMProject: 'cn-north-4',//项目名称
    URL: 'your API url', // ModelArts 在线服务
}
```

## Npm Install

```bash
npm install axios
npm install form-data
```

## Run

```bash
node index.js
```