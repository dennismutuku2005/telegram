const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

// Replace with your actual Telegram API credentials
const botToken = '7151506870:AAE2fu1k_tpbwshIZ6-nh12TJdbnFpXpbO0';
const api_id = 28205301;
const api_hash = 'b0fddf704ea08516edc1c7e83bc3728e';

const bot = new TelegramBot(botToken, { polling: true });
const app = express(); // Ensure Express app is initialized

app.use(express.json());

// Pending payments object to track payment status by external reference
let pendingPayments = {};

// Generate basic auth token for the payment API
const generateBasicAuthToken = () => {
  const apiUsername = '0hsXykykIC9lX7D7omlq';
  const apiPassword = 'HPEBjDHxA0bWmzCvwlKmrML0Pxu5N2bQfLpvbq6f';
  const credentials = `${apiUsername}:${apiPassword}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
};

// Payment API URL
const paymentUrl = 'https://backend.payhero.co.ke/api/v2/payments';

// Load Telegram session if exists
let sessionString = '';
try {
  sessionString = fs.readFileSync('session.txt', 'utf8');
} catch (err) {
  console.log('No previous session found, starting a new login session...');
}

let chatId, userId, user, selectedData, amount, duration;
let stringSession = new StringSession(sessionString);

// Declare Telegram client as a global object
let client;

// Initialize Telegram client and login process
(async () => {
  console.log('Loading Telegram client...');
  client = new TelegramClient(stringSession, api_id, api_hash, {
    connectionRetries: 5,
  });

  if (!sessionString) {
    await client.start({
      phoneNumber: async () => await input.text('Enter your phone number: '),
      password: async () => await input.text('Enter your password (if 2FA is enabled): '),
      phoneCode: async () => await input.text('Enter the code you received: '),
      onError: (err) => console.log(err),
    });
    console.log('You are now logged in!');
    fs.writeFileSync('session.txt', client.session.save(), 'utf8');
    console.log('Session string saved to session.txt');
  } else {
    await client.connect();
    console.log('Logged in using saved session!');
  }

  // Bot interaction for users to select time plan
  bot.onText(/\/start/, async (msg) => {
    chatId = msg.chat.id;

    const paymentOptions = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '2 minutes - Ksh 6', callback_data: '6,2' },
            { text: '3 minutes - Ksh 10', callback_data: '10,3' }
          ],
          [
            { text: '5 minutes - Ksh 15', callback_data: '15,5' },
            { text: '20 minutes - Ksh 30', callback_data: '30,20' }
          ],
          [
            { text: '1.5 hours - Ksh 50', callback_data: '50,90' }
          ],
          [{ text: 'Cancel', callback_data: 'cancel' }]
        ],
      },
    };

    bot.sendMessage(chatId, 'Welcome to the Premium Xpose Channel Manager! Choose a time plan to proceed with payment:', paymentOptions);
  });

  bot.on('callback_query', async (query) => {
    chatId = query.message.chat.id;
    userId = query.from.id;
    user = query.from.username;
    selectedData = query.data.split(',');
    amount = parseInt(selectedData[0]);
    duration = parseInt(selectedData[1]);

    if (selectedData[0] === 'cancel') {
      return bot.sendMessage(chatId, 'You have canceled the action. Type /start to begin again.');
    }

    // Request for the user to enter their mobile number
    bot.sendMessage(chatId, 'Please enter your valid M-pesa number to proceed with payment');
    bot.once('message', async (message) => {
      const userPhoneNumber = message.text;

      // Initiate payment request
      const basicAuthToken = generateBasicAuthToken();
      const requestBody = {
        amount: amount,
        phone_number: userPhoneNumber,
        channel_id: 1045,
        provider: 'm-pesa',
        external_reference: `INV-${new Date().getTime()}`, // Unique invoice reference
        callback_url: 'https://telegram-30sm.onrender.com/payment-callback', // Replace with your actual callback URL
      };

      try {
        const response = await axios.post(paymentUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': basicAuthToken
          }
        });

        const reference = response.data.CheckoutRequestID;
        console.log(reference);

        if (reference) {
          // Save the reference and status as pending
          pendingPayments[reference] = { status: 'pending', chatId, amount, duration, userId, user };
          console.log(`Pending payment saved: ${reference}`);
          bot.sendMessage(chatId, `Payment request has been sent. Please enter M-pesa pin to complete the payment.`);
        } else {
          bot.sendMessage(chatId, 'Payment request failed. Please try again later.');
        }
      } catch (error) {
        console.error('Error initiating payment:', error.response ? error.response.data : error.message);
        bot.sendMessage(chatId, 'Payment STK push failed.');
      }
    });
  });
})();

// Payment callback endpoint to update payment status
app.post('/payment-callback', async (req, res) => {
  console.log(req.body)
    const { MpesaReceiptNumber, CheckoutRequestID } = req.body.response;
    console.log(`Callback received for CheckoutRequestID: ${CheckoutRequestID}`);

    // Check if a callback URL is present and if the payment reference exists
    if (MpesaReceiptNumber && CheckoutRequestID && pendingPayments[CheckoutRequestID]) {
      const paymentData = pendingPayments[CheckoutRequestID];

      // Perform the user addition operation if the status is successful
      if (Status === 'Success') {
        bot.sendMessage(paymentData.chatId, 'Payment successful! You now have access to the channel.');
        paymentData.status = 'completed';

        const channelId = '-1002262212076'; // Replace with your private channel ID
        const privateChannel = await client.getEntity(channelId);

        // Add the user to the channel after successful payment
        await client.invoke(
          new Api.channels.InviteToChannel({
            channel: privateChannel,
            users: [paymentData.userId],
          })
        );

        // Calculate expiration time
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + paymentData.duration);

        // Display expiration time to the user
        const expirationMessage = `You have been added to the channel for ${paymentData.duration} minutes. Your subscription will expire on ${expirationTime.toLocaleString()}.`;
        bot.sendMessage(paymentData.chatId, expirationMessage);

        // Start timer to remove user after their time expires
        setTimeout(async () => {
          await client.invoke(
            new Api.channels.EditBanned({
              channel: privateChannel,
              participant: paymentData.userId,
              bannedRights: new Api.ChatBannedRights({
                untilDate: 0,
                viewMessages: true,
              }),
            })
          );

          // Notify user that access has expired
          const startButton = {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Start Again', callback_data: 'start' }]
              ]
            }
          };

          bot.sendMessage(paymentData.chatId, `Your access to the channel has expired. You have been banned from viewing messages.`, startButton);
        }, paymentData.duration * 60 * 1000); // Convert minutes to milliseconds

        delete pendingPayments[CheckoutRequestID];
      } else {
        bot.sendMessage(paymentData.chatId, 'Payment failed. Please try again.');
        paymentData.status = 'failed';
      }
    } else {
      console.log('Callback URL missing or no pending payment found for this reference.');
    }

  res.send({ status: 'received' });
});

// Health check route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
