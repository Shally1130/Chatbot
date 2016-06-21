'use strict';

const StringDecoder = require('string_decoder').StringDecoder;

// Quickstart example
// See https://wit.ai/l5t/Quickstart

// When not cloning the `node-wit` repo, replace the `require` like so:
// const Wit = require('node-wit').Wit;
const Wit = require('../').Wit;
const http = require('http');


const token = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node index.js <wit-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

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
    console.log(message);
    cb();
  },
  merge(sessionId, context, entities, message, cb) {
     // Retrieve the location entity and store it into a context field
    const loc = firstEntityValue(entities, 'location');
    // if (loc) {
    //   context.loc = loc;
    //   // context.time = time;
    //   // context.person = person;
    //   console.log('loc!!!!!!!!!!!!!');
    //   //wait.miliseconds(100);
    // }

    //setTimeout(function() {
    if (loc) {
      context.loc = loc;
      // context.time = time;
      // context.person = person;
      console.log('loc!!!!!!!!!!!!!');
      //wait.miliseconds(100);
    }
    //}, 1);


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
  },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  ['Introduction-People'](sessionId, context, cb) {
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.loc)

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
      });
      context.intro = res;
      res.resume();
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });

    
    cb(context);
  },

};

const client = new Wit(token, actions);
client.interactive();
