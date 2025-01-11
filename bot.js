const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const botToken = '7269149574:AAFaeGPnBjt1E5n-M5nfa6OU6WwtwlUxrVI';
const bot = new TelegramBot(botToken, { polling: true });

// When a user sends a message to the bot
bot.on('message', (msg) => {
  const userId = msg.from.id; // User ID
  const username = msg.from.username || 'No username'; // Username (if available)
  const firstName = msg.from.first_name || 'No first name'; // First name (if available)
  const lastName = msg.from.last_name || 'No last name'; // Last name (if available)

  // Respond with user info
  const responseMessage = `
    Your User ID: ${userId}
    Your Username: @${username}
    Your Name: ${firstName} ${lastName}
  `;

  bot.sendMessage(msg.chat.id, responseMessage);
});
