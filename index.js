const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const { Vonage } = require('@vonage/server-sdk');
const { verifySignature } = require('@vonage/jwt');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const VONAGE_API_SIGNATURE_SECRET = process.env.VONAGE_API_SIGNATURE_SECRET;

const privateKey = fs.readFileSync(process.env.VONAGE_PRIVATE_KEY);

const vonage = new Vonage({
  applicationId: process.env.VONAGE_APPLICATION_ID,
  privateKey: privateKey
});

app.post('/send-rcs', async (req, res) => {
  const toNumber = req.body.to;

  const message = {
    to: toNumber,
    from: process.env.RCS_SENDER_ID,
    channel: 'rcs',
    message_type: 'custom',
    custom: {
      contentMessage: {
        text: "What time works best for your appointment?",
        suggestions: [
          {
            reply: {
              text: "9am",
              postbackData: "time_9am"
            }
          },
          {
            reply: {
              text: "11am",
              postbackData: "time_11am"
            }
          },
          {
            reply: {
              text: "2pm",
              postbackData: "time_2pm"
            }
          }
        ]
      }
    }
  };

  try {
    const response = await vonage.messages.send(message);
    console.log('Message sent:', response);
    res.status(200).json({ message: 'RCS message sent successfully.' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send RCS message.' });
  }
});

app.post('/inbound_rcs', async (req, res) => {
  const token = request.headers.authorization.split(' ')[1];

  if (!verifySignature(token, VONAGE_API_SIGNATURE_SECRET)) {
    res.status(401).end();
    return;
  }

  const inboundMessage = req.body;

  if (inboundMessage.channel === 'rcs' && inboundMessage.message_type === 'reply') {
    const userSelection = inboundMessage.reply.title;
    const userNumber = inboundMessage.from;

    console.log(`User ${userNumber} selected: ${userSelection}`);

    // Optionally, send a confirmation message back to the user
    const confirmationMessage = {
      to: userNumber,
      from: process.env.RCS_SENDER_ID,
      channel: 'rcs',
      message_type: 'text',
      text: `${userSelection} is a great choice!`
    };

    try {
      const response = await vonage.messages.send(confirmationMessage);
      console.log('Confirmation sent:', response);
    } catch (error) {
        console.error('Error sending confirmation:', error);
    };
  }

  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
