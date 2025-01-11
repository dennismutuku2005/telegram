import Payhero from './index.js';
import PayHero from './index.js'



const apiUsername ="" ;
const apiPassword = "";

// Concatenating username and password with colon
const credentials = `${apiUsername}:${apiPassword}`;

// Base64 encode the credentials
const encodedCredentials = Buffer.from(credentials).toString('base64');

// Creating the Basic Auth token
const basicAuthToken = `Basic ${encodedCredentials}`;

//Output the token
 console.log(basicAuthToken);
 const payHero=new PayHero(basicAuthToken)
//Output the token

const paymentDetails={
    "amount": 10,
    "phone_number": "0740161331",
    "channel_id": 333, 
    "provider": "m-pesa", 
    "external_reference": "INV-009",
    "callback_url": "https://example.com/callback.php"
}
const sasapayments={ 
    "amount": 10,
    "phone_number": "0759408403",
    "provider": "sasapay", 
    "network_code":"63902",
    "external_reference": "INV-99992",
    "callback_url": "https://example.com/callback.php"

}

const withdrawal={ 
    "amount": 10,
    "phone_number": "0759408403",
    "channel": "mpesa101",
    "network_code":"63902",
    "external_reference": "INV-99992",
    "callback_url": "https://example.com/callback.php"

}
const topUpDetails={
    amount: 10,
    phone_number: "0740161331"
}

// const whatsappDetails = {
//     "message": "My First Text",
//     "phone_number": "0740161331",
//     "session": "haHybLB7nmx3OPPuhtTF"
// }
// payHero.makeWhatsappPayment(whatsappDetails).then(response=>{
//         console.log(response)}).catch(err=>console.log(err))


//list payment channels
//payHero.paymentChannels().then(response=>console.log(response)).catch(err=>console.log(err))
//create payment channel
// const channelDetails={
    
//         "channel_type": "bank", //short_code
//         "short_code": "247247",
//         "account_number": "Bank Account Number",
//         "description": "Equity Bank"
      
      


// // }
//payHero.createPaymentChannel(channelDetails).then(response=>console.log(response)).catch(err=>console.log(err))
// payHero.getBanks().then(response=>{
//     console.log(response)}).catch(err=>console.log(err))

//withdraw
payHero.withdraw(withdrawal).then(response=>console.log(response));


// payHero.accountTransactions().then(response=>{
//     console.log(response)}).catch(err=>console.log(err))


//payhero sasapay
 //payHero.sasaPayment(sasapayments).then(response=>console.log(response)).catch(err=>console.log(err.message))

// payHero.makeStkPush(paymentDetails)
// .then(response=>console.log(response))
// .catch(err=>console.log(err))
//list payment channels

// payHero.paymentsWalletBalance().then(response=>console.log(response)).catch(err=>console.log(err))
// .catch(err=>console.log(err))


// payHero.serviceWalletBalance().then(response=>console.log(response)).catch(err=>console.log(err))
// .catch(err=>console.log(err))

// payHero.topUpServiceWallet(topUpDetails).then(response=>console.log(response)).catch(err=>console.log(err))
// .catch(err=>console.log(err))

// payHero.accountTransactions(topUpDetails).then(response=>console.log(response)).catch(err=>console.log(err))
// .catch(err=>console.log(err))

// payHero.transactionStatus('ae3bbe21-6e7c-4ec4-a76c-b3f340ec0990').then(response=>console.log(response)).catch(err=>console.log(err))
// .catch(err=>console.log(err))