const fs = require('fs');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram');
const input = require('input');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// API credentials from Telegram
const api_id = 28205301;
const api_hash = 'b0fddf704ea08516edc1c7e83bc3728e';
const botToken = '7266824104:AAGw77zPxcUzfp2t4kO0oSwFFOH_hW_cc0A';
const bot = new TelegramBot(botToken, { polling: true });

let sessionString = '';
try {
  sessionString = fs.readFileSync('session.txt', 'utf8');
} catch (err) {
  console.log('No previous session found, starting a new login session...');
}

const stringSession = new StringSession(sessionString);

// Generate Basic Auth Token
const generateBasicAuthToken = () => {
  const apiUsername = '0hsXykykIC9lX7D7omlq';
  const apiPassword = 'HPEBjDHxA0bWmzCvwlKmrML0Pxu5N2bQfLpvbq6f';
  return 'Basic ' + Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');
};

// API endpoints
const paymentUrl = 'https://backend.payhero.co.ke/api/v2/payments';
const statusUrl = 'https://backend.payhero.co.ke/api/v2/transaction-status';

(async () => {
  console.log('Loading Telegram client...');
  const client = new TelegramClient(stringSession, api_id, api_hash, { connectionRetries: 5 });

  if (!sessionString) {
    await client.start({
      phoneNumber: async () => await input.text('Enter your phone number: '),
      password: async () => await input.text('Enter your password (if 2FA is enabled): '),
      phoneCode: async () => await input.text('Enter the code you received: '),
      onError: (err) => console.log(err),
    });
    fs.writeFileSync('session.txt', client.session.save(), 'utf8');
    console.log('Session string saved to session.txt');
  } else {
    await client.connect();
    console.log('Logged in using saved session!');
  }

  // Main menu with payment options
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const paymentOptions = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '2 minutes - Ksh 6', callback_data: '6,2' }, { text: '3 minutes - Ksh 10', callback_data: '10,3' }],
          [{ text: '5 minutes - Ksh 15', callback_data: '15,5' }, { text: '20 minutes - Ksh 30', callback_data: '30,20' }],
          [{ text: '1.5 hours - Ksh 50', callback_data: '50,90' }],
          [{ text: 'Cancel', callback_data: 'cancel' }]
        ],
      },
    };
    bot.sendMessage(chatId, 'Welcome to the Premium Xpose Channel Manager! Choose a time plan:', paymentOptions);
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const selectedData = query.data.split(',');
    const amount = parseInt(selectedData[0]);
    const duration = parseInt(selectedData[1]);

    if (selectedData[0] === 'cancel') {
      return bot.sendMessage(chatId, 'You have canceled the action. Type /start to begin again.');
    }

    bot.sendMessage(chatId, 'Please enter your mobile number to proceed with payment');
    bot.once('message', async (message) => {
      const userPhoneNumber = message.text;
      const requestBody = {
        amount: amount,
        phone_number: userPhoneNumber,
        channel_id: 1045,
        provider: 'm-pesa',
        external_reference: `INV-${new Date().getTime()}`,
        callback_url: 'https://your-callback-url.com',
      };

      try {
        const response = await axios.post(paymentUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': generateBasicAuthToken()
          }
        });

        const reference = response.data.reference;
        if (reference) {
          bot.sendMessage(chatId, 'Payment request sent. Please complete the payment.');
          await fetchTransactionStatus(reference, chatId, client, query.from.id, amount, duration);
        } else {
          bot.sendMessage(chatId, 'Payment request failed. Try again later.');
        }
      } catch (error) {
        bot.sendMessage(chatId, 'Payment STK push failed.');
      }
    });
  });
})();

// Check transaction status
async function fetchTransactionStatus(reference, chatId, client, userId, amount, duration) {
  const url = `${statusUrl}?reference=${reference}`;
  let attemptCount = 0;
  let maxAttempts = 10;

  while (attemptCount < maxAttempts) {
    try {
      const response = await axios.get(url, { headers: { 'Authorization': generateBasicAuthToken() } });
      const data = response.data;

      if (data.status === 'SUCCESS') {
        bot.sendMessage(chatId, 'Payment successful! You now have access to the channel.');
        const privateChannel = await client.getEntity('-1002202617627'); // Replace with your channel ID

        await client.invoke(
          new Api.channels.InviteToChannel({ channel: privateChannel, users: [userId] })
        );

        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + duration);
        bot.sendMessage(chatId, `You have been added for ${duration} minutes. Expires at ${expirationTime.toLocaleString()}.`);

        setTimeout(async () => {
          await client.invoke(
            new Api.channels.EditBanned({
              channel: privateChannel,
              participant: userId,
              bannedRights: new Api.ChatBannedRights({ untilDate: 0, viewMessages: true })
            })
          );
          bot.sendMessage(chatId, 'Access expired. You have been banned from viewing messages.');
        }, duration * 60 * 1000);
        break;
      } else if (data.status === 'FAILED') {
        bot.sendMessage(chatId, 'Payment failed.');
        break;
      }
    } catch (error) {
      bot.sendMessage(chatId, 'Error checking payment status.');
      break;
    }
  }
}

app.get('/', (req, res) => res.send('Hello World!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
