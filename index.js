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
const WIT_TOKEN = 'ZTDH4FZ7T7FWWTFR3Y5CXVYTCBE76OQS';     

const firstEntityValue = (entities, entity) => {
  console.log('should be running');
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

// //system parameter
// var qid =  '1'; //convert int to char
// var title;
// var body='Some%20additional%20information%20on%20the%20question';
// var category = 'Knowledge'
// var pathname;


// Our bot actions
const actions = {
  say(sessionId, context, message, cb) {
    //console.log(message);
    cb();   
  },
  merge(sessionId, context, entities, message, cb) {
     // Retrieve the location entity and store it into a context field
    // const q = firstEntityValue(entities, 'question');
    // // console.log('firstEntityValue');
    // // console.log('loc11111111');
    // if (q) {
    //   context.question = q;
    //   console.log('question!!!!!!!!!!!!!');
    //   //wait.miliseconds(100);    
    // }
    context.query = message;
    cb(context);
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  ['Query-Answer'](sessionId, context,cb) {
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.loc)
    ////////////////////////////////////////////////////
    var pathname = '/?qid=1&title=' + encodeURIComponent(context.query)+ '&body=Some%20additional%20information%20on%20the%20question&category=Knowledge';
    var options = {
      host: 'carbonite.mathcs.emory.edu',
      port: '8080',
      path:  pathname
    };
    console.log(pathname);
    var decoder = new StringDecoder();
    http.get(options, (res) => {
      console.log(`Got response: ${res.statusCode}`);
      // consume response body
      res.on('data', function (chunk) {
        var data = decoder.write(chunk).trim();
         var beg = data.indexOf("<content>");
         var end = data.indexOf("</content>");
         //console.log(data.substring(beg + 9, end));
         //var tempintro;
         // if(end-beg>320)
         // {
         //    for(var i=beg+9;(end-i)/300>=1;i=i+301)
         //    {
         //        tempintro = data.substring(i, i+300);
         //        sendMessage(sessionId, {text: tempintro});
         //        console.log("22222222222222");
         //    }
         //    tempintro = data.substring(i-301, end);
         //    sendMessage(sessionId, {text: tempintro});
         //    console.log("33333333333333");
         // }
         // else
         // {
         //    context.intro = data.substring(beg + 9, end);
         //    console.log(context.intro);
         //    sendMessage(sessionId, {text: "reply: "+context.intro});  
         // }
         context.answer = data.substring(beg + 9, end);
         //console.log(context.answer);
         sendMessage(sessionId, {text: "reply: "+context.answer});
         cb(context);
      });
      res.resume();
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });
    // cb(context);
  },

};

// Setting up our bot
const wit = new Wit(WIT_TOKEN, actions);


// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    const context0 = {};
    for (i = 0; i < events.length; i++) {
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
                        // console.log('Waiting for futher messages.');
                        context0 = context;
                        //console.log(context.answer);
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
// function sendMessage(recipientId, message) {
//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
//         method: 'POST',
//         json: {
//             recipient: {id: recipientId},
//             message: message,
//         }
//     }, function(error, response, body) {    
//         if (error) {
//             console.log('Error sending message: ', error);
//         } else if (response.body.error) {
//             console.log('Error: ', response.body.error);
//         }
//     });
// };



function sendMessage(recipientId, message) {
  var length = message.length;
    var num = length/80;
    for(var i=0;i<num;i++)
    {
      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message.substring(i*80,(i+1)*80-1),
        }
      }, function(error, response, body) {    
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
      });
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message.substring(num*80,length),
        }
      }, function(error, response, body) {    
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
      });
};


