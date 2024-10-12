const fs = require('fs');
const path = require('path');
const request = require('request');
const gradient = require('gradient-string');
const chalk = require('chalk');
const boldText = (text) => chalk.bold(text);

const usersDbPath = path.join(__dirname, 'users.json');
let users = {};
if (fs.existsSync(usersDbPath)) {
  users = JSON.parse(fs.readFileSync(usersDbPath));
} else {
  fs.writeFileSync(usersDbPath, JSON.stringify(users, null, 2));
}

function updateUserDatabase(senderId, recipientId, messageId) {
  let isNewUser = false;
  if (!users[senderId]) {
    users[senderId] = {
      recipientId,
      messageId,
      interactions: 0
    };
    isNewUser = true;
  }
  users[senderId].interactions += 1;
  fs.writeFileSync(usersDbPath, JSON.stringify(users, null, 2));
  return isNewUser;
}

function sendMessage(senderId, message, pageAccessToken) {
  request({
    url: 'https://graph.facebook.com/v13.0/me/messages',
    qs: { access_token: pageAccessToken },
    method: 'POST',
    json: {
      recipient: { id: senderId },
      message: { text: message },
    },
  }, (error, response, body) => {
    if (error) {
      console.log(boldText(gradient.cristal('Error sending message:')), error);
    } else if (response.body.error) {
      console.log(boldText(gradient.cristal('Error response:')), response.body.error);
    } else {
      console.log(boldText(gradient.summer('Message sent successfully:')), body);
    }
  });
}

function getPageName(pageAccessToken) {
  return new Promise((resolve, reject) => {
    request({
      url: `https://graph.facebook.com/v13.0/me`,
      qs: { access_token: pageAccessToken },
      method: 'GET'
    }, (error, response, body) => {
      if (error) {
        reject('Error retrieving page name');
      } else {
        const pageInfo = JSON.parse(body);
        resolve(pageInfo.name || 'Unknown Page');
      }
    });
  });
}

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

console.log(boldText(gradient.morning('COMMAND DEPLOYING......')));
commandFiles.forEach(file => {
  try {
    const command = require(path.join(__dirname, '../commands', file));
    commands.push(command);
    console.log(boldText(gradient.summer(`[ ${command.name} ] Successfully Deployed Command`)));
  } catch (error) {
    console.log(boldText(gradient.cristal(`[ ${file} ] Failed to Deploy Command: ${error.message}`)));
  }
}); 
global.page = commands.name
const pageAccessToken = process.env.TOKEN;

getPageName(pageAccessToken).then(pageName => {
  console.log(boldText(gradient.summer(`Page Account Logged In: ${pageName}`)));
  const userCount = Object.keys(users).length;
  console.log(boldText(gradient.summer(`Database User Count: ${userCount}`)));
  console.log(boldText(gradient.summer('Bot Listening.........')));
}).catch(err => {
  console.log(boldText(gradient.cristal(err)));
});

module.exports.handleCommand = async function (event, pageAccessToken) {
  const messageText = event.message.text.trim().toLowerCase();
  const [commandName, ...args] = messageText.split(' ');
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const messageId = event.message.mid;
  const userName = event.sender.name;

  const isNewUser = updateUserDatabase(senderId, recipientId, messageId);

  if (isNewUser) {
    console.log(boldText(gradient.summer(`New user detected: ${userName} (ID: ${senderId})`)));
  }

  const command = commands.find(cmd => cmd.name === commandName);

  if (command) {
    try {
      await command.onCmds({
        bot: {
          send: (response) => sendMessage(senderId, response, pageAccessToken),
          reply: (response) => sendMessage(senderId, response, pageAccessToken)
        },
        event,
        args
      });
      console.log(boldText(gradient.summer(`Command [${command.name}] executed successfully by ${userName}`)));
    } catch (error) {
      console.log(boldText(gradient.cristal(`Error executing command [${command.name}] for user ${userName}:`)), error);
    }
  }

  if (command && command.pageEvent && messageText.startsWith(command.eventTrigger)) {
    try {
      await command.pageEvent({
        bot: {
          send: (response) => sendMessage(senderId, response, pageAccessToken),
          reply: (response) => sendMessage(senderId, response, pageAccessToken)
        },
        args,
        event: messageText
      });
      console.log(boldText(gradient.summer(`Page event triggered [${command.eventTrigger}] by ${userName}`)));
    } catch (error) {
      console.log(boldText(gradient.cristal(`Error handling page event [${command.eventTrigger}] for user ${userName}:`)), error);
    }
  }
};
