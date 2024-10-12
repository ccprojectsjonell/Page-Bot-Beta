const axios = require('axios');

module.exports = {
  name: 'ai',
  info: 'Asks the API and returns the response.',
  withPrefix: true,
  author: 'Jonell Magallanes',
  cooldowns: 10,

  onCmds: async function ({ bot, args, event}) {
    const askQuery = args.join(' ') || 'Hello';

    try {
      const response = await axios.get(`https://jonellprojectccapisexplorer.onrender.com/api/gptconvo?ask=${askQuery}&id=${event.sender.id}`);
      const bold = global.fonts.bold("CHATGPT")
      const apiResponse = response.data.response;
      bot.send(`${bold}\n${global.line}\n${apiResponse}`);
    } catch (error) {
      bot.send(error.message);
    }
  }
};
