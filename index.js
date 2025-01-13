const botToken = '8195166190:AAEzqwcuPvJatBHt_T1T3deXg3yizRCcGfI';

const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const input = require('input');
const { StringSession } = require('telegram/sessions');
const { TelegramClient } = require('telegram');
const { Api } = require('telegram');
const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your actual API credentials for Telegram
const api_id = 28205301;
const api_hash = 'b0fddf704ea08516edc1c7e83bc3728e';

const bot = new TelegramBot(botToken, { polling: true });

// Pending payments object to track payment status by external reference
let pendingPayments = {};

const generateBasicAuthToken = () => {
  const apiUsername = '0hsXykykIC9lX7D7omlq';
  const apiPassword = 'HPEBjDHxA0bWmzCvwlKmrML0Pxu5N2bQfLpvbq6f';
  
  const credentials = `${apiUsername}:${apiPassword}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
};

// API URL
const paymentUrl = 'https://backend.payhero.co.ke/api/v2/payments';

// Express setup
app.use(express.json());

// Main menu and inline keyboard setup for payment options
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
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
  bot.sendMessage(chatId, 'Welcome! Please choose a payment option to proceed:', paymentOptions);
});

// Callback query handler to handle payment requests
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const selectedData = query.data.split(',');
  const amount = parseInt(selectedData[0]);
  const duration = parseInt(selectedData[1]);

  if (selectedData[0] === 'cancel') {
    return bot.sendMessage(chatId, 'You have canceled the action. Type /start to begin again.');
  }

  // Request for the user to enter their mobile number
  bot.sendMessage(chatId, 'Please enter your mobile number to proceed with payment');
  bot.once('message', async (message) => {
    const userPhoneNumber = message.text;

    // Initiate payment request
    const basicAuthToken = generateBasicAuthToken();
    const externalReference = `INV-${new Date().getTime()}`; // Unique invoice reference
    const requestBody = {
      amount: amount,
      phone_number: userPhoneNumber,
      channel_id: 1045,
      provider: 'm-pesa',
      external_reference: externalReference,
      callback_url: 'https://telegram-30sm.onrender.com/payment-callback',
    };

    try {
      const response = await axios.post(paymentUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': basicAuthToken
        }
      });

      const reference = response.data.externalReference;
      console.log(`Payment initiated. Reference: ${reference}, ExternalReference: ${externalReference}`);

      if (externalReference) {
        // Save the reference and status as pending
        pendingPayments[externalReference] = { status: 'pending', chatId, amount, duration };
        console.log(`Pending payment saved: ${reference}`);
        bot.sendMessage(chatId, `Payment request has been sent. Please Enter M-pesa pin to complete the payment.`);
      } else {
        bot.sendMessage(chatId, 'Payment request failed. Please try again later.');
      }
    } catch (error) {
      console.error('Error initiating payment:', error.response ? error.response.data : error.message);
      bot.sendMessage(chatId, 'Payment STK push failed');
    }
  });
});

// Payment callback endpoint to update payment status
app.post('/payment-callback', async (req, res) => {
  const callbackData = req.body;
  console.log('Received callback data:', callbackData);

  // Extract necessary fields from callback
  const { MpesaReceiptNumber, Status, ExternalReference } = callbackData.response;
  console.log(`Callback received for ExternalReference: ${ExternalReference}`);

  if (MpesaReceiptNumber && ExternalReference) {
    // Check if the payment is in the pending payments object
    if (pendingPayments[ExternalReference]) {
      const paymentData = pendingPayments[ExternalReference];
      console.log(`Found pending payment for reference: ${ExternalReference}`);
      
      if (Status === 'Success') {
        // Payment was successful
        bot.sendMessage(paymentData.chatId, 'Payment successful! You now have access to the channel.');
        paymentData.status = 'completed'; 
        const channelId = '-2262212076'; // Replace with your private channel ID
        const privateChannel = await client.getEntity(channelId);

        // Add the user directly to the channel after successful payment
        await client.invoke(
          new Api.channels.InviteToChannel({
            channel: privateChannel,
            users: [userId],
          })
        );
        // Calculate the expiration time
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + duration);
        
        // Display expiration time to the user
        const expirationMessage = `You have been added to the channel for ${duration} minutes. Your subscription will expire on ${expirationTime.toLocaleString()}.`;
        bot.sendMessage(paymentData.chatId, expirationMessage);

        // Start the timer to kick the user after the paid time ends
        setTimeout(async () => {
          await client.invoke(
            new Api.channels.EditBanned({
              channel: privateChannel,
              participant: userId,
              bannedRights: new Api.ChatBannedRights({
                untilDate: 0, // Ban forever after time expires
                viewMessages: true, // Ban them from viewing messages
              }),
            })
          );

          // Send a message with an inline button to restart the process
          const startButton = {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Start Again', callback_data: 'start' }
                ]
              ]
            }
          };

          bot.sendMessage(paymentData.chatId, `Your access to the channel has expired. You have been banned from viewing messages.`, startButton);
        }, duration * 60 * 1000); // Convert minutes to milliseconds
      } else {
        // Payment failed
        bot.sendMessage(paymentData.chatId, 'Payment failed. Please try again.');
        paymentData.status = 'failed'; // Update status to failed
      }
    } else {
      console.log(`No pending payment found for reference: ${ExternalReference}`);
    }
  } else {
    bot.sendMessage(paymentData.chatId, 'Payment failed. Please try again. /start');
  }

  res.send({ status: 'received' });
});

// Start the server to handle callbacks
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
