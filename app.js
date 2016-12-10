'use es6';

process.env.DEBUG = 'actions-on-google:*';

const requests = require('request');
const WebSocket = require('ws');
const ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
const express = require('express');
const app = express();

const INTRO = '<speak>Hello, I\'m Aeden. Your Westworld host. Let\'s begin. ' +
  'It\'s so nice to meet you. What questions can I answer about Westworld?</speak>';

const PROMPTS = [
  'Do you have any questions about Westworld?'
];

app.set('port', (process.env.PORT || 8080));
app.use(require('body-parser').json({type: 'application/json'}));

const buildWsResponse = (message, result) => {
  return JSON.stringify({
    action: 'inbound',
    actor: 'bot',
    bot_id: 5649391675244544,
    message: {
      text: message
    },
    session_id: result.session_id,
    timestamp: new Date().getTime()
  })
};

app.post('/', (request, response) => {
  console.log("Received POST!");
  const assistant = new ActionsSdkAssistant({request, response});

  let entryPoint = (assistant) => {
    console.log('Reached entryPoint!');
    assistant.ask(assistant.buildInputPrompt(true, INTRO, PROMPTS));
  };

  let rawInput = (assistant) => {
    console.log('Reached rawInput!');
    if (assistant.getRawInput() === 'bye') {
      assistant.tell('bye.');
    } else {
      requests({
        method: 'POST',
        uri: 'https://zoobot-live.appspot.com/bot/5649391675244544/chat',
        body: JSON.stringify({
          actor: 'bot',
          action: 'start',
          timestamp: new Date().getTime(),
          bot_id: 5649391675244544,
          user_id: 'USER'
        })
      }, (err, response, body) => {
        console.log("Received response from zoobot", response.body);
        let result = JSON.parse(body);
        let ws = new WebSocket(result.metadata.socket_uri);
        ws.on('open', () => {
          console.log('opened websocket to %s', result.metadata.socket_uri);
          ws.send(buildWsResponse(assistant.getRawInput(), result));
        });
        ws.on('message', message => {
          console.log("received message from ws: ", message);
          let aeden = JSON.parse(message);
          if (aeden.metadata.topic_name === '__welcome__') {
            return;
          }
          let aedenResponse = JSON.parse(message).messages.map(item => item.text).join(".");
          assistant.ask('<speak>' + aedenResponse + '</speak>');
        });
      });
      // let ws = new WebSocket('wss://bot.discoverwestworld.com//a/ws/5233591336304640');
      // ws.on('open', () => ws.send(assistant.getRawInput()));
      // ws.on('message', (message) => {
      //   assistant.ask('<speak>' + message + '</speak>');
      // });

    }
  };

  let actionMap = new Map();
  actionMap.set(assistant.StandardIntents.MAIN, entryPoint);
  actionMap.set(assistant.StandardIntents.TEXT, rawInput);
  assistant.handleRequest(actionMap);
});


const server = app.listen(app.get('port'), () => {
  console.log("Listening on port %s", server.address().port);
});