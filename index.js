require('dotenv').config()
const Twit = require('twit')
const CronJob = require('cron').CronJob
const Firebase = require('firebase-admin')
const serviceAccount = require("/Users/work/Downloads/auto-tweet-6f60c-firebase-adminsdk-1ip8o-bb242483ba.json")

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000
})

Firebase.initializeApp({
  credential: Firebase.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
})
const db = Firebase.database()
const ref = db.ref("/tweetData")

let tweetData = {}
ref.on("value", function (snapshot) {
  tweetData = snapshot.val()
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code)
})

//Scheduled tweet
new CronJob('* * * * *', function () {
  console.log('Starting auto tweet.......')
  let failedTweet = []

  const newDate = new Date()
  const hour = newDate.getHours('en-ID', { timezone: 'Asia/Jakarta' })
  const minute = newDate.getMinutes('en-ID', { timezone: 'Asia/Jakarta' })
  const time = `${hour}:${minute}`

  for (let i = 0; i < tweetData.scheduledTweet.length; i++) {
    if (tweetData.scheduledTweet[i].time == time) {
      T.post('statuses/update', { status: tweetData.scheduledTweet[i].message }, function (err, data, response) {
        if (err) {
          console.error('ERROR ====> ' + err.message)
          console.log(tweetData.scheduledTweet[i])
          failedTweet.push(tweetData.scheduledTweet[i])
        } else {
          console.log('Success tweet: ' + tweetData.scheduledTweet[i].message)
        }
      })
    }
  }

  setTimeout(() => {
    failedTweet.length > 0 ? ref.child('failedTweet').set(failedTweet) : ''
  }, 1000)
}, null, true, 'Asia/Jakarta').start()

// Failed Tweet
new CronJob('*/5 * * * * *', function () {
  if (tweetData.failedTweet) {
    let failedTweet = tweetData.failedTweet
    console.log('TWEETING FAILED TWEET!!!!!!')
    for (let i = 0; i < tweetData.failedTweet; i++) {
      T.post('statuses/update', { status: tweetData.failedTweet[i].message }, function (err, data, response) {
        if (err) {
          console.error('ERROR ====> ' + err.message)
        } else {
          console.log('Success tweet: ' + tweetData.failedTweet[i].message)
          failedTweet.splice(i, 1)
        }
      })
    }

    setTimeout(() => {
      ref.child('failedTweet').set(failedTweet)
    }, 1000)
  } else {
    console.log('Failed tweet is clear :)')
  }
}, null, true, 'Asia/Jakarta').start()