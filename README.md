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

##Create a bot
So far, we have a working bot server published and accessible over HTTPS, webhook is registered and we’re ready to make the bot do some actual work now.

In order to receive messages, we need to register `POST` handler that loops over messages. Add this function call at the bottom of `index.js` file:

```node

// handler receiving messages
app.post('/webhook', function (req, res) {
  var events = req.body.entry[0].messaging;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    const context0 = {};
    // We retrieve the Facebook user ID of the sender
    const sender = event.sender.id;

    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    const sessionId = findOrCreateSession(sender);

    // We retrieve the message content
    //console.log("Event = " + event);
    if (event.message && event.message.text) {
    	sendMessage(sessionId, {text: "Echo: " + event.message.text});
    }
  }
  res.sendStatus(200);
});
```
It goes over message objects found in messaging property (they can be batched in one webhook call) and if there’s a message text available, it sends it back using the `sendMessage` function:

```node
// generic function sending messages
function sendMessage(recipientId, message) { 
  console.log('send message..................');
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {    
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
  console.log('exit send message..................');
};
```
As you can see, we need the `recipient ID`, message object and `PAGE_ACCESS_TOKEN` to authorize every request.

##Structured messages

[Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform) supports multiple types multimedia and templates attachments, like image, audio, video, file, generic template, button template and receipt template.

Our codes use the `Button Template` with the [Send API](https://developers.facebook.com/docs/messenger-platform/send-api-reference#request) to send a text and buttons attachment to request input from the user. This buttons can open a URL to read more details about answer:

```node
function showMoreMessage(recipientId, text, url) {
  console.log('show more message...........');
  var reply="";
  if(text.length>=310)
  {
  	reply += text.substring(0,300)+".......";
  }
  else
  {
  	reply = text;
  }
  var message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text":   "Reply: "+ reply,
                        "buttons": [
                          {
                            "type": "web_url",
                            "url": url,
                            "title": "Show More"
                          }
                        ]
                    }
                }
            };
  console.log('exit show more message...........');

  sendMessage(recipientId, message);

}
```

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
[Microsoft Cognitive Services](https://www.microsoft.com/cognitive-services) provides [Entity Linking](https://www.microsoft.com/cognitive-services/en-us/entitylinking-api/documentation/overview), which users can easily get entity in a sentence:

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

```node
let params = {
  text: query+context.answer
}
console.log("query+context.answer: "+ params);
linkEntities(params, (err, result) => {
  if (err) return console.error(err);
  var name = [];
  var wikipediaId = [];
  var len = JSON.parse(result).entities.length;
  for(var i=0; i<len; i++)
  {
    name.push(JSON.parse(result).entities[i].name);
    wikipediaId.push(JSON.parse(result).entities[i].wikipediaId);
  }
  temp.push(name);
  temp.push(wikipediaId);
  console.log("name: " + name);
  console.log("wikipediaId: " + wikipediaId);
});
```
##About counting pronouns
Use wikipediaIds which extracted above to request wikipedia, then count the pronouns occurences of each page and store the results in sessions.

```node
var pronouns = [];
var i = 0;
var len = JSON.parse(result).entities.length;
var fCount = 0; //count female pronoun
var mCount = 0; //count male pronoun
var oCount = 0; //count object pronoun
var fNum = ""; //store the id which has the most occurances of female pronouns
var mNum = ""; //store the id which has the most occurances of male pronouns
var oNum = ""; //store the id which has the most occurances of object pronouns
console.log("length: " + len);
var forLoop = function(i){
  if(i<len){
    name.push(JSON.parse(result).entities[i].name);
    var tempname = name[i];
    console.log("tempname: "+tempname);
    wikipediaId.push(JSON.parse(result).entities[i].wikipediaId);
    const wikiHost = 'https://en.wikipedia.org/wiki';
    let wikiOptions = {
      url: wikiHost+'/'+encodeURIComponent(JSON.parse(result).entities[i].wikipediaId),
      method: 'POST',
    }
    request(wikiOptions, (err, res, body) => {
      if(err){
        console.log("Got an error ",err);
      }
      else
      {
        var data = extractor(res.body);
        var index = {},
        words = data.text.replace(/[.,?!;()"'-]/g, " ").replace(/\s+/g, " ").toLowerCase().split(" ");
        index['his'] = 0;
        index['he'] = 0;
        index['its'] = 0;
        index['it'] = 0;
        index['she'] = 0;
        index['her'] = 0;
        words.forEach(function (word) {
          if (word==='it'||word==='he'||word==='she'||word==='its'||word==='his'||word==='her') {
            index[word]++;
          }
        });
        if((index['it']+index['its'])>oCount)
        {
          oCount = index['it']+index['its'];
          oNum = tempname;
        }
        if((index['he']+index['his'])>mCount)
        {
          mCount = index['he']+index['his'];
          mNum = tempname;
        }
        if((index['her']+index['she'])>fCount)
        {
          fCount = index['her']+index['she'];
          fNum = tempname;
        }
      }
      //console.log(res.body);
      forLoop(i+1);
    })  
  }
  else {
    console.log("storeInform.....................");
    console.log("female, male, object: "+fNum+" "+mNum+" "+oNum);
    pronouns.push(fNum);
    pronouns.push(mNum);
    pronouns.push(oNum);
    temp.push(name);
    temp.push(wikipediaId);
    temp.push(pronouns);
    console.log("name: " + name);
    console.log("wikipediaId: " + wikipediaId);
    console.log("pronouns: " + pronouns);
    sessions[sessionId].context.push(temp);
  } 
}
forLoop(0);
```










