const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data'); 
const gradient = require('gradient-string');
const chalk = require('chalk');
const boldText = (text) => chalk.bold(text);

const botPrefix = '!'; 

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
  axios.post(`https://graph.facebook.com/v13.0/me/messages`, {
    recipient: { id: senderId },
    message: { text: message },
  }, {
    params: {
      access_token: pageAccessToken
    }
  }).then(response => {
    console.log(boldText(gradient.summer('Message sent successfully:')), response.data);
  }).catch(error => {
    console.log(boldText(gradient.cristal('Error sending message:')), error.response?.data || error.message);
  });
}

function sendFile(senderId, filePath, pageAccessToken) {
  const formData = new FormData();
  formData.append('recipient', JSON.stringify({ id: senderId }));
  formData.append('file', fs.createReadStream(filePath));

  axios.post(`https://graph.facebook.com/v13.0/me/messages`, formData, {
    params: { access_token: pageAccessToken },
    headers: {
      ...formData.getHeaders() 
    }
  }).then(response => {
    console.log(boldText(gradient.summer('File sent successfully:')), response.data);
  }).catch(error => {
    console.log(boldText(gradient.cristal('Error sending file:')), error.response?.data || error.message);
  });
}

function getPageName(pageAccessToken) {
  return axios.get('https://graph.facebook.com/v13.0/me', {
    params: { access_token: pageAccessToken }
  }).then(response => {
    return response.data.name || 'Unknown Page';
  }).catch(() => 'Error retrieving page name');
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
  const messageText = event.message.text.trim();
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const messageId = event.message.mid;
  const userName = event.sender.name;

  const isNewUser = updateUserDatabase(senderId, recipientId, messageId);

  if (isNewUser) {
    console.log(boldText(gradient.summer(`New user detected: ${userName} (ID: ${senderId})`)));
  }

  const hasPrefix = messageText.startsWith(botPrefix);
  const messageWithoutPrefix = hasPrefix ? messageText.slice(botPrefix.length).trim() : messageText;
  const [commandName, ...args] = messageWithoutPrefix.split(' ');

  const command = commands.find(cmd => cmd.name === commandName);

  if (hasPrefix && command) {
    try {
      await command.onCmds({
        bot: {
          send: (response) => sendMessage(senderId, response, pageAccessToken),
          reply: (response) => sendMessage(senderId, response, pageAccessToken),
          files: (filePath) => sendFile(senderId, filePath, pageAccessToken)
        },
        event,
        args
      });
      console.log(boldText(gradient.summer(`Command [${command.name}] executed successfully by ${userName}`)));
    } catch (error) {
      console.log(boldText(gradient.cristal(`Error executing command [${command.name}] for user ${userName}:`)), error);
    }
  } else if (!hasPrefix) {
    try {
      const response = await axios.get(`https://jonellprojectccapisexplorer.onrender.com/api/gptconvo`, {
        params: {
          ask: messageText,
          id: senderId
        }
      });

      const apiResponse = response.data.response;
      sendMessage(senderId, apiResponse, pageAccessToken);
      console.log(boldText(gradient.summer(`Responded to [${userName}]: ${apiResponse}`)));
    } catch (error) {
      console.log(boldText(gradient.cristal(`Error processing message from [${userName}]:`)), error);
      sendMessage(senderId, 'An error occurred while processing your request.', pageAccessToken);
    }
  }
};
