const express = require('express');
const mqtt = require('mqtt');
const path = require('path');
const util = require('util');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
// Create variables for MQTT use here

app.use(bodyParser.json());
function read(filePath = './message.json') {
    return readFile(path.resolve(__dirname, filePath)).then(data => JSON.parse(data));
}
function write(data, filePath = './message.json') {
    return writeFile(path.resolve(__dirname, filePath), JSON.stringify(data));
}

// create an MQTT instance
const client = mqtt.connect('mqtt://localhost:1883');

// Check that you are connected to MQTT and subscribe to a topic (connect event)
client.on('connect', () => {
    console.log('Connected to broker');
    client.subscribe('test/topic', (err) => {
        if (!err) {
            console.log("Successfully connected to broker");
        }
    });
});

// handle instance where MQTT will not connect (error event)
client.on('error', (err) => {
   console.error(`MQTT connection error: ${err}`);
});

// Handle when a subscribed message comes in (message event)
client.on('message', (topic, message) => {
    console.log(`Received message on ${topic}: ${message.toString()}`);
});

// Route to serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// route to serve the JSON array from the file message.json when requested from the home page
app.get('/messages', (req, res) => {
    const filePath = path.join(__dirname, 'message.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
       if (err) {
           console.error('Error reading message.json:', err);
           return res.status(500).json({ error: 'Failed to read messages' });
       }
       res.json(JSON.parse(data));
    });
});

// Route to serve the page to add a message
app.get('/add', (req, res) => {
    return res.sendFile(path.join(__dirname, 'message.html'));
});

//Route to show a selected message. Note, it will only show the message as text. No html needed
app.get('/:id', (req, res) => {
   const messageId = req.params.id;
   const filePath = path.join(__dirname, 'message.json');

   fs.readFile(filePath, 'utf8', (err, data) => {
       if (err) {
           console.error('Error reading message.json:', err);
           return res.status(500).json({ error: 'Failed to read messages' });
       }

       const messages = JSON.parse(data);
       const message = messages.find(msg => msg.id == messageId);

       if (message) {
           res.send(message);
       } else {
           res.status(400).send('Message not found');
       }
   });
});

// Route to CREATE a new message on the server and publish to mqtt broker
app.post('/', (req, res) => {
    const { topic, msg } = req.body;

    client.publish(topic, msg, (err) => {
        if (err) {
            console.error('Error publishing message:', err);
            return res.status(500).send('Error publishing message');
        }
        console.log(`Message published to topic ${topic}: ${msg}`);

        const filePath = path.join(__dirname, 'message.json');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading message.json:', err);
                return res.status(500).send('Error reading messages');
            }

            let messages;
            try {
                messages = JSON.parse(data);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                return res.status(500).send('Error parsing messages');
            }

            let newId;
            if (messages.length > 0) {
                const lastIndex = messages.length - 1;
                const lastId = parseInt(messages[lastIndex].id, 10);
                newId = (lastId + 1).toString();
            } else {
                newId = "1";
            }

            const newMessage = {
                id: newId,
                msg: msg
            };

            messages.push(newMessage);

            fs.writeFile(filePath, JSON.stringify(messages, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to message.json:', err);
                    return res.status(500).send('Error saving message');
                }
                res.status(200).send('Message published and saved successfully');
            });
        });
    });
})

// Route to delete a message by id (Already done for you)

app.delete('/:id', async (req, res) => {
    try {
        const messages = await read();
        write(messages.filter(c => c.id !== req.params.id));
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(200);
    }
});

// listen to the port
app.listen(3000);