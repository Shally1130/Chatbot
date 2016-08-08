#Bot App Setup
We’re going to need a server application accessible from the Internet — the simplest way to do that is to use `Node` and `Heroku`.

##Install Node and create application
Install [Node](https://nodejs.org/en/), this will provide `node` and `npm` commands in your terminal. Create project directory and initialize `package.json`:

```shell
$ mkdir testbot
$ cd testbot/
$ npm init
```

The command npm init will display a wizard in order to configure the app. Install most useful Node packages by issuing command:

```shell
$ npm install express body-parser request --save
```

This will include the dependencies in `package.json`, so Heroku can resolve them upon deploy. Open that file and add start field in the scripts section that tells Heroku how to run our app:

```json
{
  "name": "testbot",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "dependencies": {
    "body-parser": "^1.15.1",
    "express": "^4.13.4",
    "request": "^2.72.0"
  },
  "devDependencies": {},
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node index.js"
  },
  "author": "Zhenying Tao",
  "license": "ISC"
}
```
Create index.js file in your project’s root directory:

```node
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});
```

First GET handler is only there to make sure the server is up and running when you visit app’s web address.

The second GET handler is used by Facebook to verify our server app as designated to handle Messenger Bot integration. Please note that example code uses testbot_verify_token as a verify token which we’ll need later.

##Create git repository
Create `.gitignore` file that ignores local modules directory:

```
node_modules/
```

Initialize repository and commit files:

```shell
$ git init
$ git add .
$ git commit -m 'Register Facebook Webhook'
```

##Setup Heroku
Create an account if you don’t have one, install [Heroku Toolbelt](https://toolbelt.heroku.com), log in to the tool, create app and push the code to server:

```shell
$ heroku login
$ heroku create
$ git push heroku master
```

Heroku creates our web app under given URL and deploys it to server after successful git push. Visit provided link to verify, that your app actually works.

![alt text][testbot]
[testbot]: https://github.com/emory-irlab/QAChatBot/blob/master/images/testbot.png

#Facebook Setup
##Create Facebook Page
This is used as an identity of our bot — for our users, chatting with bot looks exactly like writing messages to ordinary Page.

You can use an existing page or create new one. 

1. Log in to Facebook and go to [Create a Page website](https://www.facebook.com/pages/create/)
2. Click on one of the page types, example setup could be:
      __Company, Organization or Institution__ type
      __Internet/Software__ category
      __TestBot__ company name (this is official Page name)
3. Next steps are optional.

Your test Page is now ready:

![alt text][testPage]
[testPage]: https://github.com/emory-irlab/QAChatBot/blob/master/images/testpage.png

##Create Facebook App
This is used for setting up your Facebook Application, registering callbacks and submitting for approval. Go to [Add a New App page](https://developers.facebook.com/quickstarts/), click `basic setup` link below app icons and fill in the form, select `Apps for Pages` as a category.

Click `Create App ID`, you should be taken to the app dashboard. In the `Product Settings`, `Add Product` section, click on `Get Started with Messenger`.

##Generate Page Access Token and Setup a Webhook

Webhook is a callback interface from Facebook to your server that allows us to receive messages sent via Messenger to our Page, as well as metadata and lifecycle events.

In the `Messenger` tab of your Facebook application, choose your test page in `Token Generation`, authorize app in order to generate PAGE_ACCESS_TOKEN and save it somewhere.

In the `Webhooks` section click on `Setup Webhooks`, paste your application’s webhook URL (HTTPS is required), custom `verify token` (defined in server code) and select all the available checkboxes. Clicking `Verify and Save` will make a GET call to your server, so make sure it’s working.

##Subscribe your custom App to the Page

You need to subscribe your custom webhook to the Page events by issuing a POST request and providing PAGE_ACCESS_TOKEN generated in the previous section. The simplest way to do it is to use curl from your terminal:

```shell
$ curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=PAGE_ACCESS_TOKEN"
```
You should get a success response:

```shell
{"success": true}
```

##Set page access token in Heroku
Go to you app’s `Settings` and set `Config Variable` PAGE_ACCESS_TOKEN to the value generated previously

##Git your bot
Save index.js, `commit` & `deploy` to Heroku and write message to your Facebook Page. Then, see if it works:

```shell
$ git add .
$ git commit -m 'Create Echo Bot'
$ git push heroku master
```
We also can see logs on Heroku, go to your `Heroku dashboard` and then `View logs`:

![alt text][logs]
[logs]: https://github.com/emory-irlab/QAChatBot/blob/master/images/logs.png

#Wit.ai
[Wit.ai quickstart](https://wit.ai/docs/quickstart) and [documentation](https://github.com/wit-ai/node-wit) has introduced clearly, there is no need to repeat. It is worth noting that because of version updating, `merge` function does not necessary anymore.

There are two stories, for one is `Greeting`, and another is `Question and Answer`.


1.__Greeting Story:__


![alt text][Greeting_1]
[Greeting_1]: https://github.com/emory-irlab/QAChatBot/blob/master/images/Greeting_1.png


![alt text][Greeting_2]
[Greeting_2]: https://github.com/emory-irlab/QAChatBot/blob/master/images/Greeting_2.png


2.__Question and Answer:__


![alt text][QA1]
[QA1]: https://github.com/emory-irlab/QAChatBot/blob/master/images/QA1.png


__Note__: There are two branches.

1.For one, the confidence of answer is greater or equal to 2.5:


![alt text][QA2]
[QA2]: https://github.com/emory-irlab/QAChatBot/blob/master/images/QA2.png

2.Another one is the confidence of answer less than 2.5:


![alt text][QA3]
[QA3]: https://github.com/emory-irlab/QAChatBot/blob/master/images/QA3.png

__Note__: There are three conditions.  

1.User does not satisfy the answer, chatbot add `badAnswer` to url and query a new answer again:


![alt text][QA4]
[QA4]: https://github.com/emory-irlab/QAChatBot/blob/master/images/QA4.png

2.User satisfy the answer:


![alt text][QA5]
[QA5]:https://github.com/emory-irlab/QAChatBot/blob/master/images/QA5.png

3.User ignore the feedback, query new question:


![alt text][QA6]
[QA6]:https://github.com/emory-irlab/QAChatBot/blob/master/images/QA6.png

#Entity Linking Intelligence Service
Microsoft Cognitive Services provides [Entity Linking](https://www.microsoft.com/cognitive-services/en-us/entitylinking-api/documentation/overview), which users can easily get entity in a sentence:

```node
const MSCOG_BASE = 'https://api.projectoxford.ai/entitylinking/v1.0/link';

const requestHeader = {
  'Content-Type': 'text/plain',
  'Ocp-Apim-Subscription-Key': "*****************"
}

const getQueryParams = (params) => {
  return { selection: params.selection,
           offset: params.offset }
}

const linkEntities = (params, callback) => {
  let queryParams = getQueryParams(params)
  let reqBody = params.text

  let options = {
    url: MSCOG_BASE,
    method: 'POST',
    body: reqBody, 
    headers: requestHeader,
    qs: queryParams
  }

  request(options, (err, res, body) => {
    if (err) return callback(err)
    if (!err && res.statusCode !== 200) {
      return callback(new Error(res.body))
    }
    if (!err && res.statusCode === 200) {
      return callback(null, body)
    }
  })
}
```










