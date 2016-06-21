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

const StringDecoder = require('string_decoder').StringDecoder;
const Wit = require('node-wit').Wit
const http = require('http');

// Wit.ai parameters
const WIT_TOKEN = 'YXZYW2IZTZS6D3VVEAN5KV4IDYKN63P6';     



const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
    ;
    if (!val) {
      return null;
  }
  return typeof val === 'object' ? val.value : val;
};


//system parameter
var qid =  '1'; //convert int to char
var title;
var body='Some%20additional%20information%20on%20the%20question';
var category = 'Knowledge'
var pathname;


// Our bot actions
const actions = {
  say(sessionId, context, message, cb) {
    console.log("Entering say");
    console.log(message);
    sendMessage(sessionId, {text: "reply: "+context.intro});
    cb();
    console.log("Exiting say");    
  },
  merge(sessionId, context, entities, message, cb) {
    console.log("Entering merge");
     // Retrieve the location entity and store it into a context field
    const loc = firstEntityValue(entities, 'location');

    if (loc) {
      context.loc = loc;
      console.log('loc!!!!!!!!!!!!!');
      //wait.miliseconds(100);
    }


    const person = firstEntityValue(entities,'person');
    if(person){
      context.person = person;
      console.log('person!!!!!!!!!!!!!');
      //wait.miliseconds(100);

      }

    const time = firstEntityValue(entities, 'time');
    if(time)
    {
      context.time = time;
      console.log('time!!!!!!!!!!!');
      //wait.miliseconds(100);
    }
    cb(context);
    console.log("Exiting merge");
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  ['Introduction-People'](sessionId, context, cb) {
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.loc)
    console.log("Entering introducing");
    ////////////////////////////////////////////////////
    pathname = '/?qid='+qid+'&title=';
    title = 'who%20is%20'+context.time+'%20'+context.person+'%20of%20' + context.loc+ '&';
    pathname += title+ '&body=' + body + '&category=' + category;
        var options = {
      host: 'carbonite.mathcs.emory.edu',
      port: '8080',
      path:  pathname
    };
    console.log(title);
    var decoder = new StringDecoder();
    http.get(options, (res) => {
      console.log(`Got response: ${res.statusCode}`);
      // consume response body
      res.on('data', function (chunk) {
        var data = decoder.write(chunk);
         var beg = data.indexOf("<content>");
         var end = data.indexOf("</content>");
         console.log(data.substring(beg + 9, end));
         context.intro = res;
      });
      
      res.resume();
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });

    
    cb(context);
    console.log("Exiting introducing");
  },

};

// Setting up our bot
const wit = new Wit(WIT_TOKEN, actions);


// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    const context0 = {};
    for (i = 0; i < events.length; i++) {
        console.log("Event:" + i);
        console.log(events[i]);
        var event = events[i];
        // if (event.message && event.message.text) {
        //     sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
        // }
        if (event.message && event.message.text) {
            wit.runActions(
                event.sender.id, // the user's current session
                event.message.text, // the user's message 
                context0, // the user's current session state
                (error, context) => {
                    console.log("Entering callback");
                    if (error) {
                        console.log('Oops! Got an error from Wit:', error);
                    } else {
                    // Our bot did everything it has to do.
                    // Now it's waiting for further messages to proceed.
                        console.log('Waiting for futher messages.');
                        context0 = context;
                        console.log("Context:");
                        console.log(context);
                        console.log(context0);
                        console.log(context.intro);
                        console.log("Exiting callback");
                        //sendMessage(event.sender.id, {text: "reply: "+context0.intro});
                    }
                    
                }
            );
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
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
};

