const { Wechaty } = require('wechaty');

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('./config');

const name = 'wechat-puppet-wechat';
let bot = '';
bot = new Wechaty({
    name, // generate xxxx.memory-card.json and save login data for the next login
});

//  二维码生成
function onScan(qrcode, status) {
    require('qrcode-terminal').generate(qrcode); // 在console端显示二维码
    const qrcodeImageUrl = [
        'https://wechaty.js.org/qrcode/',
        encodeURIComponent(qrcode),
    ].join('');
    console.log(qrcodeImageUrl);
}

// 登录
async function onLogin(user) {
    console.log(`贴心小助理${user}登录了`);
    //   if (config.AUTOREPLY) {
    //     console.log(`已开启机器人自动聊天模式`);
    //   }
    // 登陆后创建定时任务
    // await initDay();
}

//登出
function onLogout(user) {
    console.log(`小助手${user} 已经登出`);
}

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot
    .start()
    .then(() => console.log('开始登陆微信'))
    .catch((e) => console.error(e));

// 监听消息
bot.on('message', async function (m) {
    const contact = m.talker();
    const content = m.text();
    const room = m.room();
    let foodList = [];
    if (room) {
        console.log(`Room:${room.topic()}、${contact}发来${content}`)
    } else {
        console.log(`${contact}:${content}`)
    }
    if (m.self()) return;
    if (/^6.1$/i.test(content)) {       //忽略大小写
        m.say('请您发一张美食图片');
        if (foodList.length == 0) {       //如果列表为空,说明没有food监听。
            foodList.push(contact);

            bot.on('message', async function food(n) {
                // console.log('food监听')
                const contact1 = n.talker();
                const content1 = n.text();
                if (/^6.1$/i.test(content1) || n.self()) return;
                // console.log('speak2');
                foodList.forEach((person, index) => {   //如果在列表中且是同一个人。
                    if (person == contact1) {
                        // console.log(n)
                        if (n.type() == bot.Message.Type.Image) {  //发送的是图片格式
                            n.say(`${contact1},我们正在飞速分析您的照片,请耐心等待。`);
                            saveMediaFile(n);

                        } else {
                            n.say('发送的不是图片格式,请重新发送food.');
                        }
                        n.say('了解更多请点击：')
                        foodList.splice(index, 1)//移除这个人
                        return  //每个人只可能出现一次,所以出现一次后,就终止。
                    }
                })
                if (!foodList.length) bot.removeListener('message', food);  //如果列表为空,则移除监听。
            })
        }
        else if (!foodList.includes(contact)) foodList.push(contact); //列表中如果已有此人,就不添加。

    }

})


async function saveMediaFile(message) {
    const image = message.toImage()
    const fileBox = await image.artwork()
    const fileName = './images/' + fileBox.name
    fileBox.toFile(fileName).then(res => {
        // console.log(res)
        sendImage(fileName).then(res => {
            console.log(res)
            if (res) {
                const { scores, predicted_label } = res
                if (scores && scores[0][1] > 0.9) {
                    message.say(`您偷偷地在吃${predicted_label}吗？我也要~`)
                } else if (scores && scores[0][1] > 0.8) {
                    message.say(`妈咪妈咪哄，${predicted_label}，${predicted_label}，我最爱吃的${predicted_label}~`)
                } else if (scores && scores[0][1] > 0.6) {
                    message.say(`您别说让我猜一会儿，这是${predicted_label}~`)
                } else if (scores && scores[0][1] < 0.6 || (scores && scores[0][1] == 0.6)) {
                    message.say(`好难呀，我猜猜呀,这是${predicted_label}吗`)
                    message.say(`嗯~，难道是${scores[1][0]}?`)
                    message.say(`${scores[2][0]}?${scores[3][0]}?${scores[4][0]}?`)
                    message.say(`求求您重新训练我吧~ huaweicloud.ai 等您！`)
                }
            } else {
                message.say(`奴婢在获取AI超能力的路上迷路了~`)
            }
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
}

// 获取Token
async function getToken() {
    let token = ''
    const data = {
        "auth": {
            "identity": {
                "methods": [
                    "password"
                ],
                "password": {
                    "user": {
                        "domain": {
                            "name": config.IAMDomain
                        },
                        "name": config.IAMUser,
                        "password": config.IAMPassword
                    }
                }
            },
            "scope": {
                "project": {
                    "name": config.IAMProject
                }
            }
        }
    }
    await axios.post(config.TokenURL, data).then(res => {
        token = res.headers['x-subject-token']
    }).catch(err => {
        console.log(err)
        token = ''
    });

    return token
}

// 识别美食
async function sendImage(fileName) {
    let resp = {}
    await getToken().then(async res => {
        // console.log(res)
        const form = new FormData();
        form.append('images', fs.createReadStream(fileName));
        console.log(form.getHeaders())
        await axios.post(config.URL, form, { headers: Object.assign(form.getHeaders(), { "X-Auth-Token": res }) }).then(res => {
            console.log(res.data)
            resp = res.data
        }).catch(err => {
            console.log(err)
            if (err.response && err.response.data) {
                resp = err.response.data
            }
        })
    }).catch(err => {
        console.log(err)
        resp = err.data
    })
    return resp
}
