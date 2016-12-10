'use es6';

process.env.DEBUG = 'actions-on-google:*';

const ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
const express = require('express');
const app = express();

const INTRO = '<speak>Hello, I\'m Aeden. Your Westworld host. Let\'s begin. ' +
  'It\'s so nice to meet you. What questions can I answer about Westworld?</speak>';

const PROMPTS = [
  'Do you have any questions about Westworld?',
  'When do you want to visit?'
];

app.set('port', (process.env.PORT || 8080));
app.use(require('body-parser').json({type: 'application/json'}));

app.post('/', (request, response) => {
  console.log("Received POST!");
  const assistant = new ActionsSdkAssistant({request, response});

  const entryPoint = (assistant) => {
    console.log('Reached entryPoint!');
    assistant.ask(assistant.buildInputPrompt(true, INTRO, PROMPTS));
  };

  const rawInput = (assistant) => {
    console.log('Reached rawInput!');
    if (assistant.getRawInput() === 'bye') {
      assistant.tell('bye.');
    } else {
      assistant.ask('<speak>' + assistant.getRawInput() + '</speak>');
    }
  };

  assistant.handleRequest({
    [assistant.StandardIntents.MAIN]: entryPoint,
    [assistant.StandardIntents.TEXT]: rawInput
  });
});


const server = app.listen(app.get('port'), () => {
  console.log("Listening on port %s", server.address().port);
});