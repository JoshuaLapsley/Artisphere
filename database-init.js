
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const directoryPath = './gallery';

const uri = 'mongodb://localhost:27017/a5';

let paintings = [];

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }) //Connect to mongo
  .then(async (client) => {
    console.log('Connected to MongoDB');
    const db = client.db('a5');
    

    try {
        await db.collection('users').deleteMany({}); //Delete everything in both databases
        await db.collection('gallery').deleteMany({});
        console.log('Cleared existing data in the "users" collection');
    }   catch (error) {
            console.error('Error clearing data:', error);
        }

    fs.readdir('./gallery', async function (err, files) { //Read the gallery.json file
        if (err) {
            console.error('Error reading directory:', err);
        return;
        }

        for (let i = 0; i < files.length; i++) {
            let filePath = './gallery/' + files[i];
            try {
              let gallery = require(filePath);
              paintings[i] = gallery;
              
            } catch (error) {
              console.error('Error parsing JSON file:', filePath, error);
            }
        }
        for(let i = 0; i<paintings.length; i++) { //Adding all the users/paintings to both databases
            for(artwork of paintings[i]) {
                user = 
                {
                    username: artwork.Artist,
                    password: "Artist",
                    posts: [],
                    account: "Artist"
                };
                artwork.user = user.username;
                
                
                const result = await db.collection('users').findOne({ username: user.username });
                if(!result) {
                    user.posts.push(artwork);
                    db.collection('users').insertOne(user);
                } else {
                    result.posts.push(artwork);
                    await db.collection('users').updateOne({ username: user.username }, { $set: result });
                }
                db.collection('gallery').insertOne(artwork);                  
            }
            
        }
    });
        
});
    

