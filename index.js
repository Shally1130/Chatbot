"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var jQuery = require('jquery');
var wikipedia = require("node-wikipedia");
var extractor = require('unfluff');
var async = require('async');



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
const Wit = require('node-wit').Wit;
const http = require('http');

// -----------

const MSCOG_BASE = 'https://api.projectoxford.ai/entitylinking/v1.0/link';

const requestHeader = {
  'Content-Type': 'text/plain',
  'Ocp-Apim-Subscription-Key': "ed6f40191a22476195c4cb79b48924ca"
}

const getQueryParams = (params) => {
  return { selection: params.selection, 
           offset: params.offset }
}

const linkEntities = (params, callback) => {
  //let queryParams = getQueryParams(params)
  let reqBody = params.text

  let options = {
    url: MSCOG_BASE,
    method: 'POST',
    body: reqBody, 
    headers: requestHeader,
    //qs: queryParams
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

// -----------


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

var pathname;
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
    console.log("equals = "+(message=="Do you like my answer? Please reply Yes or No.")+"..........."+message);
    if(message!="Do you like my answer? Please reply Yes or No."&&message != "Sorry, I don't quite understand your question. Could you say again?")
    {
      if(parseFloat(context.score)>=2.5)
      {
        showMoreMessage(recipientId,message,context.url);
      }
      else
      {
        sendMessage(recipientId,  {text: "Reply: "+message});
      }
    }
    else
    {
    	sendMessage(recipientId,  {text: "Feedback: "+message});
      
    }
    if(message=="Do you want more details?")
    {
      flag = true;
    }
    //showMoreMessage(sessionId,context.answer,context.url);
    cb();   
  },
  merge(sessionId, context, entities, message, cb) {
    var contact = firstEntityValue(entities, 'contact');
    if(contact)
    {
      context.contact = contact;
    }
    context.score = "0";
    var size = sessions[sessionId].context.length;
    context.query = message;
    console.log("Exiting merging..............");
    cb(context);
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart

  ['Query-Answer'](sessionId, context, cb) {

    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.loc)
    ////////////////////////////////////////////////////
    //var pathname;
    //get the content of previous question 
    var size = sessions[sessionId].context.length;
    //var yes_no;
    var query = context.query;
    var temp = [];
    //var pathname;
    /*conditions: 1. this user has never sent questions
    */
    console.log("size:" + size + "..............................");
    if(size==0 ){
    	pathname = '/?qid=1&title=' + encodeURIComponent(query)+ '&body=Some%20additional%20information%20on%20the%20question&category=Knowledge';
    	console.log("context.query = "+ query);
    	console.log("two conditions............"+pathname);
    }
    /*parse answer and question*/
    else {
        console.log("parse question and answer...............");
        console.log("context.query = " + query);
        if(query!= null){
        	pathname = '/?qid=1&title=' + encodeURIComponent(query)+ '&body=Some%20additional%20information%20on%20the%20question&category=Knowledge';
      		console.log("context.query = "+ query);
      		console.log("two conditions............"+pathname);
        }
      	else{
      		console.log("the value of yes_no is 'N'");
      		query = sessions[sessionId].context[size-1][0];
      		//pathname = '/?qid=1&title=' + encodeURIComponent(query)+ '&body=Some%20additional%20information%20on%20the%20question&category=Knowledge';
	      	pathname += '&badanswer=';
	      	pathname +=encodeURIComponent(sessions[sessionId].context[size-1][1]);
	      	console.log("yes_no" + pathname);
        }
	  }
    var options = {
      host: 'carbonite.mathcs.emory.edu',
      port: '8080',
      path:  pathname
    };
    console.log("api call!!!!!!!!!!!!!!!!!!");
    //console.log("pathname"+pathname);
    var decoder = new StringDecoder();
    //Step(
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
         if(parseFloat(context.score)>=2.5){
         	  delete context.nonAnswer;
            context.answer = data.substring(beg + 9, end).trim();
            
            temp.push(query);
            temp.push(context.answer);
            context.url = data.substring(urlbeg + 11, urlend).trim();
            //console.log('score: '+parseFloat(data.substring(scorebeg + 12, scoreend)));
         }
         else{ 
            delete context.answer;
            console.log("<2.5................"); 
         }

        console.log("start linkEntities.................");

        let params = {
          text: query+" "+context.answer
        }
        //console.log("query+context.answer: "+ params.text);
        linkEntities(params, (err, result) => {
          if (err) return console.error(err);
          //console.log("query+context.answer: "+ params.text);
          //console.log("params.selection+params.text"+params.selection+" "+params.text);
          //console.log(JSON.stringify(JSON.parse(result), null, 2));
          var name = [];
          var wikipediaId = [];
          var pronouns = [];
          var i = 0;
          var len = JSON.parse(result).entities.length;
          var fCount = 0; //count female pronoun
          var mCount = 0; //count male pronoun
          var oCount = 0; //count object pronoun
          var fNum = ""; //store the id which has the most occurances of female pronouns
          var mNum = ""; //store the id which has the most occurances of male pronouns
          var oNum = ""; //store the id which has the most occurances of object pronouns
          //console.log(JSON.parse(result));
          console.log("length: " + len);
          async.series([
            function getInform(callback){
              setTimeout( function() { 
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
                        //console.log("word: "+words);
                        words.forEach(function (word) {
                          if (word==='it'||word==='he'||word==='she'||word==='its'||word==='his'||word==='her') {
                            index[word]++;
                            //console.log("index: "+index);
                          }
                        });
                        if((index['it']+index['its'])>oCount)
                        {
                          //console.log("index['it']+index['its']>oCount)");
                          oCount = index['it']+index['its'];
                          oNum = tempname;
                          console.log("it: "+oCount +" "+oNum);
                        }
                        if((index['he']+index['his'])>mCount)
                        {
                          //console.log("index['his']+index['he']>mCount)");
                          mCount = index['he']+index['his'];
                          mNum = tempname;
                          console.log("he: "+mCount +" "+mNum);
                        }
                        if((index['her']+index['she'])>fCount)
                        {
                          //console.log("index['her']+index['she']>fCount)");
                          fCount = index['her']+index['she'];
                          fNum = tempname;
                          console.log("she: "+fCount +" "+fNum);
                        }
                      }
                      //console.log(res.body);
                    })
                    forLoop(i++);
                  }
                }
                callback(null, 'one');
              },8000);
              i = 0;
            },
            function storeInform(callback){
              setTimeout( function() { 
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
                callback(null, 'two');
              },2000);
            }
          ],
           // optional callback
          function(err, results) {
              // results is now equal to ['one', 'two']
              if(err)
                console.log("Got error: "+ err);
              else
                console.log("results: "+results);
            }
          );
        });
        
        console.log("end linkEntities.............");

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




