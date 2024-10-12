const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commandsList = commandFiles.map(file => {
  const command = require(path.join(commandsPath, file));
  return command.name; 
}).filter(name => name !== 'help'); 

const commandsPerPage = 10;
const totalPages = Math.ceil(commandsList.length / commandsPerPage);

module.exports = {
  name: 'help',
  info: 'Displays the list of commands.',
  withPrefix: true,
  author: 'Jonell Magallanes',

  onCmds: async function ({ bot, args }) {
    const page = args.length === 0 ? 1 : parseInt(args[0]);

    if (isNaN(page) || page < 1 || page > totalPages) {
      bot.send(`Invalid page number. Please specify a valid page number (1-${totalPages}).`);
      return;
    }

    const start = (page - 1) * commandsPerPage;
    const end = start + commandsPerPage;
    const commandsToShow = commandsList.slice(start, end);

    if (commandsToShow.length === 0) {
      return;
    }

    let response = `╭─『 Commands List 』\n`;
    commandsToShow.forEach(command => {
      response += `│✧ ${command}\n`;
    });
    response += `╰───────────◊\n\n`;
    response += `(Page ${page}/${totalPages})\n`;
    response += `Type help <page number> to see more commands.\n\n`;
    response += `Dev: Jonell Magallanes`;

    bot.send(response);
  }
};
