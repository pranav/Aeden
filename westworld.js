'use es6';

const request = require('request');
const WebSocket = require('ws');

const buildResponse = (message, result) => {
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

request({
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
    ws.send(buildResponse("arnold", result));
  });
  ws.on('message', message => {
    console.log("received message from ws: ", message);
    let newMessage = JSON.parse(message).messages.map(item => item.text).join(".");
    console.log(newMessage);
  });
});
