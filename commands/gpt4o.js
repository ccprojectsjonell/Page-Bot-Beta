const axios = require('axios');

module.exports = {
  name: 'gpt',
  info: 'Asks the GPT4o API and returns the response.',
  withPrefix: true,
  author: 'Jonell Magallanes',
  cooldowns: 10,

  onCmds: async function ({ bot, args, event }) {
    const askQuery = args.join(' ') || 'default question';
    const apiUrl = `https://gpt4o-hshs.onrender.com/gpt4o?ask=${encodeURIComponent(askQuery)}&id=${event.sender.id}`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data.status) {
        const bold = global.fonts.bold("GPT4o AI");
        const result = response.data.response;
        bot.send(`${bold}\n${global.line}\n${result}`);
      } else {
        bot.send('No response from GPT4o AI.');
      }
    } catch (error) {
      bot.send(error.message);
    }
  }
};
