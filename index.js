require('dotenv').config()
const Twit = require('twit')
const CronJob = require('cron').CronJob

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000
})

const scheduledTweet = JSON.parse(process.env.SCEDHULED_TWEET)
let failedTweet = []

const autoTweet = new CronJob('* * * * *', function () {
  const newDate = new Date()
  const hour = newDate.getHours('en-ID', { timezone: 'Asia/Jakarta' })
  const minute = newDate.getMinutes('en-ID', { timezone: 'Asia/Jakarta' })
  const time = `${hour}:${minute}`

  for (let i = 0; i < scheduledTweet.length; i++) {
    console.log(time)
    console.log(scheduledTweet[i].time)
    if (scheduledTweet[i].time == time) {
      T.post('statuses/update', { status: scheduledTweet[i].message }, function (err, data, response) {
        console.log('Success tweet: ' + scheduledTweet[i].message)

        if (err) {
          console.error(err)
          failedTweet.push(scheduledTweet[i])
        }
      })
    }
  }
}, null, true, 'Asia/Jakarta')

const autoFailedTweet = new CronJob('* * * * * *', function () {
  if (failedTweet.length > 0) {
    console.log('TWEETING FAILED TWEET!!!!!!')
    for (let i = 0; i < failedTweet; i++) {
      if (failedTweet[i].time == time) {
        T.post('statuses/update', { status: failedTweet[i].message }, function (err, data, response) {
          if (err) {
            console.error(err)
            continue
          }
          console.log(data)
          failedTweet.splice(i, 1)
        })
      }
    }
  }
  console.log('Failed tweet is clear :)')
}, null, true, 'Asia/Jakarta')

autoTweet.start()
autoFailedTweet.start()