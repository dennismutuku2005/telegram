

---

# Unofficial PayHero Node.js SDK

Welcome to the unofficial PayHero Node.js SDK, this SDK provides a convenient way to integrate PayHero payment functionality into your Node.js applications.

## Installation

You can install the PayHero Node.js SDK via npm:

```bash
npm i payhero-wrapper
```

## Usage

First, import the PayHero class:

```javascript
import PayHero from 'payhero-wrapper';
```

Then, initialize PayHero with your API key:

```javascript
const payHero = new PayHero('YOUR_AUTH-TOKEN');
```

### Making STK Push Payments

```javascript
const paymentDetails = {
    amount: 10,
    phone_number: "0740161331",
    channel_id: 333,
    provider: "m-pesa",
    external_reference: "INV-009",
    callback_url: "https://example.com/callback.php"
};

payHero.makeStkPush(paymentDetails)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Retrieving payment channels

```javascript
payHero.paymentChannels()
    .then(response => console.log(response))
    .catch(error => console.error(error));
```


### Creating payment channels

```javascript
const channelDetails={
    
        "channel_type": "bank", //short_code
        "short_code": "247247",
        "account_number": "Bank Account Number",
        "description": "Equity Bank"
      
}

payHero.createPaymentChannel(channelDetails)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Retrieving supported banks

```javascript
payHero.getBanks()
    .then(response => console.log(response))
    .catch(error => console.error(error));
```



### Retrieving Service Wallet Balance

```javascript
payHero.serviceWalletBalance()
    .then(response => console.log(response))
    .catch(error => console.error(error));
```




### Initiating sasapay stk push

```javascript
const sasapayments={ 
    "amount": 10,
    "phone_number": "0740161331",
    "provider": "sasapay", 
    "network_code":"63902",
    "external_reference": "INV-99992",
    "callback_url": "https://example.com/callback.php"

}
 payHero.sasaPayment(sasapayments).then(response=>console.log(response)).catch(err=>console.log(err.message))

```

### Retrieving Payments Wallet Balance

```javascript
payHero.paymentsWalletBalance()
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Topping Up Service Wallet

```javascript
const topUpDetails = {
    amount: 10,
    phone_number: "0740161331"
};

payHero.topUpServiceWallet(topUpDetails)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Retrieving Account Transactions

```javascript
payHero.accountTransactions()
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Retrieving Transaction Status

```javascript
const transactionId = 'ae3bbe21-6e7c-4ec4-a76c-b3f340ec0990';

payHero.transactionStatus(transactionId)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Withdrawing funds
 
```javascript
const withdrawal={ 
    "amount": 10,
    "phone_number": "0759408403",
    "channel": "mpesa101",
    "network_code":"63902",
    "external_reference": "INV-99992",
    "callback_url": "https://example.com/callback.php"

}
payHero.withdraw(withdrawal).then(response=>{
        console.log(response)}).catch(err=>console.log(err))


```
### Sending whatsapp messages
 For more details on getting started, visit the [official documentation](https://pay-hero-kenya-1.gitbook.io/pay-hero-developer-apis/whatsapp-api/send-whats-app-text).
```javascript
const whatsappDetails = {
    "message": "My First Text",
    "phone_number": "0740161331",
    "session": "your api username here"
}
payHero.makeWhatsappPayment(whatsappDetails).then(response=>{
        console.log(response)}).catch(err=>console.log(err))


```

## Configuration

To use the PayHero Node.js SDK, you need to initialize it with your PayHero API key:

```javascript
const payHero = new PayHero('YOUR_AUTH-TOKEN');
```

## Issues and Contributions

If you encounter any issues with the SDK or have suggestions for improvements, feel free to [open an issue](https://github.com/moore100/payhero-wrapper/issues) on GitHub.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---



=======
# payhero-wrapper
>>>>>>> 1a02e7b7e71d0e86364e3a6705dae4ca05e588c3
