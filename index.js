"use strict";
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
  console.log('should be running......................');
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


// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) { 
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: []};
  }
  return sessionId;
};


// Our bot actions
const actions = {
  say(sessionId, context, message, cb) { 
    //console.log(message);
    // var length = context.answer.length;
    // var num = length/310;
    // for(var i=0;i<num;i++)
    // {
    //   sendMessage(sessionId, {text: "reply: "+(i+1).toString()+'\r\n'+context.answer.substring(i*310,(i+1)*310-1)});
    // }
    //sendMessage(sessionId, {text: "reply: "+(num+1).toString()+'\r\n'+context.answer.substring(num*310,length)});

    const recipientId = sessions[sessionId].fbid;
    console.log("say....................");
    console.log(message+"        score:"+context.score+"............");
    if(parseFloat(context.score)>=2.5)
    {
      context.score = 0;
      showMoreMessage(recipientId,message,context.url);
    }
    else if(message.equals("Do you like my answer? Please reply yes or no."))
    {
      sendMessage(recipientId,  {text: "Feedback: "+message});
    }
    else
    {
      context.score = 0;
      sendMessage(recipientId,  {text: "Reply: "+message});
    }
    console.log("message:"+message);
    //showMoreMessage(sessionId,context.answer,context.url);
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
    console.log("merge...................................");
    var greetings = firstEntityValue(entities, 'greetings');
    if(greetings)
    {
      console.log("greetings...................");
      var contact = firstEntityValue(entities, 'contact');
      console.log("contact"+contact+".........................");
      if(contact)
      {
        context.contact = contact;
      }
    }
    else
    {
      context.query = message;
      console.log("else???????????????");
      
    }
    cb(context);
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  // ['Greetings']({context, entities}){
  //   return new Promise(function(resolve, reject) {
  //   const q = firstEntityValue(entities, 'contact');
  //   console.log('firstEntityValue');
  //   // console.log('loc11111111');
  //   if (q) {
  //     context.contact = q; 
  //     console.log('contact!!!!!!!!!!!!!'+contact); 
  //     //wait.miliseconds(100);    
  //   }
  //   return resolve(context); 
  // });
  // },

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
    console.log("api call!!!!!!!!!!!!!!!!!!");
    console.log(pathname);
    var decoder = new StringDecoder();
    http.get(options, (res) => {
      console.log(`Got response: ${res.statusCode}`);
      // consume response body
      res.on('data', function (chunk) {
        var data = decoder.write(chunk).trim();
         var beg = data.indexOf("<content>");
         var end = data.indexOf("</content>");
         var scorebeg = data.indexOf("<confidence>");
         var scoreend = data.indexOf("</confidence>");
         var urlbeg = data.indexOf("<resources>");
         var urlend = data.indexOf("</resources>");
         //console.log(data.substring(beg + 9, end));
         context.score = data.substring(scorebeg + 12, scoreend);
         if(parseFloat(context.score)>=2.5)
         {
            context.answer = data.substring(beg + 9, end).trim();
            var temp = [];
            temp.push(" <question>" + context.query + "</question>");
            temp.push(" <answer>" + context.answer+"</answer>")
            sessions[sessionId].context.push(temp);
            context.url = data.substring(urlbeg + 11, urlend).trim();
            console.log('score: '+parseFloat(data.substring(scorebeg + 12, scoreend)));
         }
         else
         {
            context.answer = "Sorry, I don't quite understand your question. Could you say again?";
            console.log("<2.5................"); 
         }
         //console.log(context.answer);
         cb(context);
      });
      res.resume();
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });
    //cb(context);
  },

};

// Setting up our bot
const wit = new Wit(WIT_TOKEN, actions);


// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    //console.log("app.post('/webhook', function (req, res) .....................");

    //console.log("Events length = " + events.length);
    //console.log("Events = " + events);
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        const context0 = {};
        // if (event.message && event.message.text) {
        //     sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
        // }

        ////////////////////////////////////////////////////
        // We retrieve the Facebook user ID of the sender
        const sender = event.sender.id;

        // We retrieve the user's current session, or create one if it doesn't exist
        // This is needed for our bot to figure out the conversation history
        const sessionId = findOrCreateSession(sender);

        // We retrieve the message content
        //console.log("Event = " + event);
        if (event.message && event.message.text) {
            const msg = event.message.text;
            
            /////////////////////////////////////////////////////

            wit.runActions(
                sessionId, // the user's current session
                msg, // the user's message 
                context0, // the user's current session state
                (error, context) => {
                    console.log("Entering callback");
                    if (error) {
                        console.log(context);
                        console.log('Oops! Got an error from Wit:', error);
                    } else {
                    // Our bot did everything it has to do.
                    // Now it's waiting for further messages to proceed.
                        // console.log('Waiting for futher messages.');
                        //console.log("Before answer context = " + context);
                        //context.answers += "answer:" + context.answer;
                        console.log("Session content:"+sessions[sessionId].context+"............");
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

var messageLeft = "";



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
                        //"subtitle": "Cute kitten picture",
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

//var messageLeft = "";


// //generic function sending messages
// function sendMessage(recipientId, message) {
//     var messageLength=310;
//     console.log("sendMessage................");
//     if (message.length == 0) return;
//     //messageLength -= message.substring(0, 310).lastIndexOf(' ');
//     //console.log('length!!!!!!!!!!!!!!'+messageLength);
//     // while(message.substring(0, 310).charAt(messageLength)!=' ')
//     //      messageLength--;    
//     toSend = message.substring(0, messageLength)
//     //sendMessage(sessionId, {text: "reply: "+(i+1).toString()+'\r\n'+context.answer.substring(i*310,(i+1)*310-1)});
//     result={text: "reply: \r\n"+toSend};
//     console.log(result);
//     request({
//       url: 'https://graph.facebook.com/v2.6/me/messages',
//       qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
//       method: 'POST',
//       json: {
//           recipient: {id: recipientId},
//           message: result,
//       }
//     }, function(error, response, body) {    
//         if (error) {
//             console.log('Error sending message: ', error);
//         } else if (response.body.error) {
//             console.log('Error: ', response.body.error);
//         }
//         else
//         {
//             console.log("message.length.............");
//             if (message.length > messageLength) {
//               messageLeft = message.substring(messageLength);  // from 310 to the end
//               sendMessage(recipientId, messageLeft);
//             }
//             else
//             {  
//               console.log("else!!!!!!!!!!!!!");
//             }
            
//         }
//     });
    
// };




