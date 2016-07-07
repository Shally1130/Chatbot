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
    // var length = context.answer.length;
    // var num = length/310;
    // for(var i=0;i<num;i++)
    // {
    //   sendMessage(sessionId, {text: "reply: "+(i+1).toString()+'\r\n'+context.answer.substring(i*310,(i+1)*310-1)});
    // }
    //sendMessage(sessionId, {text: "reply: "+(num+1).toString()+'\r\n'+context.answer.substring(num*310,length)});
    sendMessage(sessionId,message);
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
    context.query = message;
    
    cb(context);
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  ['Greetings']({context, entities}){
    const q = firstEntityValue(entities, 'contact');
    console.log('firstEntityValue');
    // console.log('loc11111111');
    if (q) {
      context.contact = q; 
      console.log('contact!!!!!!!!!!!!!'+contact); 
      //wait.miliseconds(100);    
    }
    return resolve(context); 
  }
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
         var scorebeg = data.indexOf("<confidence>");
         var scoreend = data.indexOf("</confidence>");
         //console.log(data.substring(beg + 9, end));
         if(parseFloat(data.substring(scorebeg + 12, scoreend))>=2.5)
         {
            context.answer = data.substring(beg + 9, end).trim();
            context.url = 'http://carbonite.mathcs.emory.edu:8080'+pathname;
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
    const context0 = {};
    console.log("app.post('/webhook', function (req, res) .....................");
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

var messageLeft = "";



function showMoreMessage(recipientId, text, url) {
  console.log('show more message...........');

  var message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": text.substring(0,40)+'.......', 
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




// // generic function sending messages
// function sendMessage(recipientId, message) { 
//   console.log('send message..................');
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
//   console.log('exit send message..................');
// };

//var messageLeft = "";


//generic function sending messages
function sendMessage(recipientId, message) {
    var messageLength=310;
    console.log("sendMessage................");
    if (message.length == 0) return;
    //messageLength -= message.substring(0, 310).lastIndexOf(' ');
    //console.log('length!!!!!!!!!!!!!!'+messageLength);
    // while(message.substring(0, 310).charAt(messageLength)!=' ')
    //      messageLength--;    
    toSend = message.substring(0, messageLength)
    //sendMessage(sessionId, {text: "reply: "+(i+1).toString()+'\r\n'+context.answer.substring(i*310,(i+1)*310-1)});
    result={text: "reply: \r\n"+toSend};
    console.log(result);
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
          recipient: {id: recipientId},
          message: result,
      }
    }, function(error, response, body) {    
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        else
        {
            console.log("message.length.............");
            if (message.length > messageLength) {
              messageLeft = message.substring(messageLength);  // from 310 to the end
              sendMessage(recipientId, messageLeft);
            }
            else
            {  
              console.log("else!!!!!!!!!!!!!");
            }
            
        }
    });
    
};




