const express = require('express');
const { MongoClient } = require("mongodb");
const app = express();
const { ObjectId } = require('mongodb');
const path = require('path');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({ //These are the cookies we use to see who is online as what user
  uri: 'mongodb://127.0.0.1:27017/a5',
  collection: 'sessiondata',
  });
app.use(session({ 
  secret: 'some secret key here', 
  resave: true,
  saveUninitialized: true,
  store: store
}));

app.use('/images',express)
app.use(express.static("public"));
app.use(express.json());
app.use((req, res, next) => {
  if (!req.session.online) { //These are the default values of our session
    req.session.online = 0; // Set online to 0 by default meaning offline
    req.session.username='';
    req.session.userId = 'invalid';
  }
  next(); 
});

let db; // Variable to hold the database instance

// Connect to MongoDB using MongoClient
MongoClient.connect('mongodb://localhost:27017/a5', { useNewUrlParser: true})
    .then(client => {
        db = client.db("a5"); // Get the database instance
        console.log("Connected to MongoDB");
        app.listen(3000, () => {
            console.log("Server listening on port 3000");
        });
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });
app.use('/styles', express.static(path.join(__dirname, 'views', 'styles'))); //Show are styles


app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'pug');

// Display Home Page
app.get('/', (req, res) => {
  userSession = 
  {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  }
  res.render('index', { userSession });
});
//Dispaly the page you go to that shows that you can't use this feature if your not logged in
app.get('/invalid', async (req, res) => {
  
  res.render('invalid',);
});
//Display the signUp page
app.get('/signUp', async (req, res) => {
  userSession = 
  {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  }
  res.render('signUp', { userSession });
});
//Display the logIn page
app.get('/logIn', async (req, res) => {
  userSession = 
  {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  }
  res.render('logIn', { userSession });
});
//Display the log out page
app.get('/logOut', async (req, res) => {
  userSession = 
  {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  }
  res.render('logOut', { userSession });
});
//Display the search page
app.get('/search', async (req, res) => {
  const userSession = {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  };
  
  if(userSession.online === 0) {
    res.render('invalid');
    return;
  }
  
  res.render('search', { userSession});
});
//Display the search by param page
app.get('/searchByParam', async (req, res) => {
  const userSession = {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  };

  if(userSession.online === 0) {
    res.render('invalid');
    return;
  }
  
  res.render('searchByParam', { userSession});
});
//Display our following page
app.get('/:id/following', async (req, res) => {
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  
  res.render('following', {user});
});
//Display the addWorkshop page
app.get('/:id/addWorkshop', async (req, res) => {
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  
  res.render('addWorkshop', {user});
});
//Display the notifications page (we also check what notifications needs to be sent to the client from the server)
app.get('/:id/notifications', async (req, res) => {
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });

  dataList = [];

  if(!user.notifications) {
    user.notifications = [];
  }

  for(let i = 0; i<user.notifications.length;i++) {

    post = user.notifications[i];

    const postUser = await db.collection('users').findOne({ username: post.user });

    const filterCriteria = {
      Title: post.Title,
      Artist: post.Artist,
      Year: post.Year,
      Category: post.Category,
      Medium: post.Medium,
      Description: post.Description,
      Poster: post.Poster
    };

    const index = postUser.posts.findIndex(artwork => {
      for (let key in filterCriteria) {
        if (artwork[key] !== filterCriteria[key]) {
          return false;
        }
      }
      return true;
    });

    let data = 
      {
        id: postUser._id,
        index: index,
        post: post
      };
    
      dataList.push(data);


  }
  
  res.render('notifications', {dataList,user});
});
//Display our liked posts
app.get('/:id/likedPosts', async (req, res) => {
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  let dataList = [];
  if (user.likedPosts) {
    const likedPosts = user.likedPosts;

    for(let i = 0; i<likedPosts.length; i++) {
      let post = likedPosts[i];
      const username = post.user;
      const likeUser = await db.collection('users').findOne({ username: username });
      
      const filterCriteria = {
        Title: post.Title,
        Artist: post.Artist,
        Year: post.Year,
        Category: post.Category,
        Medium: post.Medium,
        Description: post.Description,
        Poster: post.Poster
      };

      const index = likeUser.posts.findIndex(artwork => {
        for (let key in filterCriteria) {
          if (artwork[key] !== filterCriteria[key]) {
            return false;
          }
        }
        return true;
      });

      let data = 
      {
        id: likeUser._id,
        index: index,
        post: post
      };
      dataList.push(data);
    }
  }

  const userSession = {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  };
  
  
  res.render('likedPosts', {dataList,userSession});
});
//I have no clue what this does, but I have to use it or else things break for some reason
app.get('/favicon.ico', (req, res) => {
  // Do nothing
});
//Display profile
app.get('/:id', async (req, res) => {
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  
  const userSession = await db.collection('users').findOne({ username: req.session.username });
  
  res.render('profile', { userSession, user});
});
//Display our make Post page
app.get('/:id/makePost', async (req, res) => {
  const userSession = {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  };
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  //const post = user.posts[req.params.postIndex]
  res.render('makePost', {userSession,user});
});
//Dispaly a post
app.get('/:id/:postIndex', async (req, res) => {

  const userSession = {
    username: req.session.username, 
    online: req.session.online,
    userId: req.session.userId
  };
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  const post = user.posts[req.params.postIndex]
  if(post) {
    res.render('post', {userSession,post,user});
  } else {
    res.render('deletedPost');
  }
  
});
//Creating a new user from the signup Page
app.post('/signup', async (req, res) => {
    const user = req.body;
    
    try {
      const usersCollection = db.collection('users');
      
      // Check if the username already exists
      const existingUser = await usersCollection.findOne({ username: user.username });
  
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }
  
      // Insert the new user into the database
      const result = await usersCollection.insertOne(user);
      
  
      if (result) {
        req.session.online = 1;
        req.session.username = user.username;
        req.session.userId = user._id.toString();
        return res.status(200).json({ message: 'User signed up successfully!' , user: user});
      } else {
        return res.status(500).json({ error: 'Failed to insert user' });
      }
    } catch (error) {
      console.error('Error inserting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
});
//Logging out from the log out page
app.post('/logOut', async (req, res) => {
  req.session.online = 0;
  req.session.username = 'invalid';
  res.send('Logged out successfully');
});
//Logging in from the log in page(making sure their is a valid log in before we log in)
app.post('/logIn', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.collection('users').findOne({ username, password });

    if (user) {
      req.session.online = 1; 
      req.session.username = username;
      req.session.userId = user._id.toString();
      res.status(200).json({ message: 'Login successful', user: user });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
//Getting peramiters, and sending the matching querry back to the search page
app.post('/search', async (req, res) => {
  const searchTerm = req.body.value;
  const filter = {};
  filter.username = { $regex: new RegExp(searchTerm, 'i') };

  const users = await db.collection('users').find(filter).toArray();
  

  res.status(200).send(users);
});
//Getting peramiters, and sending the matching querry back to the search by param page
app.post('/searchByParam', async (req, res) => {
  const searchTerm = req.body;
  const filter = {};
  filter[searchTerm.param] = { $regex: new RegExp(searchTerm.value, 'i') };

  
  let linkDatas = [];

  const posts = await db.collection('gallery').find(filter).toArray();
  for(let i = 0; i<posts.length; i++) {
    let linkData = {};
    const username = posts[i].user;
    post = posts[i];
    const user = await db.collection('users').findOne({ username: username });
    const filterCriteria = {
      Title: post.Title,
      Artist: post.Artist,
      Year: post.Year,
      Category: post.Category,
      Medium: post.Medium,
      Description: post.Description,
      Poster: post.Poster
    };

    const index = user.posts.findIndex(artwork => {
      for (let key in filterCriteria) {
        if (artwork[key] !== filterCriteria[key]) {
          return false;
        }
      }
      return true;
    });
    linkData.id = user._id;
    linkData.index = index;
    linkData.name = post.Title;
    linkData.value = post[searchTerm.param];
    linkDatas.push(linkData);
    if(i === 9) {
      break;
    }
    

  }
  res.status(200).send(linkDatas);
});
//Creating a new post
app.post('/:id/makePost', async (req, res) => {
  const postData = req.body;
  
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId) });

  for(let i=0;i<user.posts.length;i++) {
    if(user.posts[i].Poster === postData.Poster) {
      res.status(500).send('Data Failed');
      return;
    }
  }
  
  user.posts.push(postData);
  user.account = "Artist";
  await db.collection('users').updateOne({ username: user.username }, { $set: user }); 
  postData.user = user.username;
  db.collection('gallery').insertOne(postData);

  if(user.followers) {
    for(let i = 0; i<user.followers.length; i++) {
      let follower = await db.collection('users').findOne({ username: user.followers[i].username });
      if(!follower.notifications) {
        follower.notifications = [];
      }
      follower.notifications.unshift(postData);
      if(follower.notifications.length === 11) {
        follower.notifications.splice(10,1);
        
      }
      await db.collection('users').updateOne({ username: follower.username }, { $set: follower }); 
    }
  }


  res.status(200).send('Data received and processed successfully');
});
//If user wants to unfollow/refollow from the following page we update the database
app.post('/:id/following', async (req, res) => {
  const postData = req.body;
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  let status = postData.status;
  if(status === "Follow") {
    const following = await db.collection('users').findOne({ username: postData.following });
    user.following.push(following);
  } else{
    user.following.splice(postData.index,1);
  }
  
  await db.collection('users').updateOne({ username: user.username }, { $set: user });

  res.status(200).send('Data received and processed successfully');
});
//Creating a new workshp
app.post('/:id/addWorkshop', async (req, res) => {
  const postData = req.body;

  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });

  if(!user.workshops) {
    user.workshops = [];
  }

  user.workshops.push(postData.value);

  await db.collection('users').updateOne({ username: user.username }, { $set: user });
  
  res.status(200).send('Data received and processed successfully');
});
//If user wants to unlike/relike from the likedPosts page we udpate the database
app.post('/:id/likedPosts', async (req, res) => {
  const postData = req.body;

  if(postData.status === "notLiked"){
    const postedUser = await db.collection('users').findOne({ _id: new ObjectId(postData.id) });
    let i = 0;
    
    for(i;i<postedUser.posts[postData.index].likes.length;i++) {

      if(postedUser.posts[postData.index].likes[i].userId === req.params.id) {
        break;
      }
    
    }
    postedUser.posts[postData.index].likes.splice(i,1);
    await db.collection('users').updateOne({ _id: new ObjectId(postData.id) }, { $set: postedUser });

    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });

    user.likedPosts.splice(postData.deleteIndex,1);

    await db.collection('users').updateOne({ _id: new ObjectId(req.params.id)}, { $set: user });


  } else {
    const postedUser = await db.collection('users').findOne({ _id: new ObjectId(postData.id) });
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });

    let likedUser = 
    {
      username: user.username,
      userId: req.params.id
    };

    postedUser.posts[postData.index].likes.push(likedUser);

    await db.collection('users').updateOne({ _id: new ObjectId(postData.id)}, { $set: postedUser });

    user.likedPosts.push(postedUser.posts[postData.index]);

    await db.collection('users').updateOne({ _id: new ObjectId(req.params.id)}, { $set: user });






  }

  res.status(200).send('Data received and processed successfully');
});
//Any changes to the post, we update here
app.post('/:id/:postId', async (req, res) => {
  const postData = req.body;
  if(!postData.status){
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    user.posts[req.params.postId] = postData
    
    await db.collection('users').updateOne({ username: user.username }, { $set: user });

    res.status(200).send('Data received and processed successfully');
  } else {
    const user = await db.collection('users').findOne({ username: postData.username });
    if(!user.likedPosts) {
      user.likedPosts = [];
    }
    
    if(postData.status === "liked") {
      user.likedPosts.push(postData.post);
      
      
      
      
    } else{
      
      let i = 0;
      for(i; i<user.likedPosts.length; i++) {
        if(user.likedPosts[i].Title === postData.post.Title) {
          break;
        }
      }
      user.likedPosts.splice(i,1);
      
      
      
    }
    await db.collection('users').updateOne({ username: user.username }, { $set: user });

  }
  
});
//Any change sto a profile we update here
app.post('/:id', async (req, res) => {
  const postData = req.body;
  if(postData.workshop) {
    const user = await db.collection('users').findOne({ username: postData.username });
    if(!user.enrolled) {
      user.enrolled = [];
    }
    const newWorkshop = 
    {
      artist: postData.artist,
      workshop: postData.workshop
    };
    for(let i=0; i<user.enrolled.length; i++) {
      if(user.enrolled[i].artist === newWorkshop.artist && user.enrolled[i].workshop === newWorkshop.workshop) {
        res.status(500).send('Data received and processed not successfully');
        return;
      }
    }
    user.enrolled.push(newWorkshop);
    await db.collection('users').updateOne({ username: user.username }, { $set: user });
    res.status(300).send('Data received and processed successfully');
  
    return;
  }
  const user = await db.collection('users').findOne({ username: postData.followerUsername });
  const followedUser = await db.collection('users').findOne({ username: postData.username });
  if(!user.following) {
    user.following = [];
  }
  
  if (postData.status === "following") {
    user.following.push(followedUser)
  } else {
    const index = user.following.indexOf(followedUser);
    user.following.splice(index, 1);
  }
  
  await db.collection('users').updateOne({ username: user.username }, { $set: user });

  if(!followedUser.followers) {
    followedUser.followers = [];
  }

  let follower = 
  {
    username: user.username,
    id: user._id
  };

  if (postData.status === "following") {
    
    await db.collection('users').updateOne({ username: followedUser.username }, { $addToSet: { followers: follower } });

  } else {

    await db.collection('users').updateOne(
      { username: followedUser.username },
      { $pull: { followers: { id: user._id } } }
    );

  }
  





  res.status(200).send('Data received and processed successfully');
});
//If the post gets deleted we deal with it here
app.delete('/:Id/:postId', async (req, res) => {
  const postId = parseInt(req.params.postId);


  // Find the index of the post with the given ID
  let user = req.body;
  let deletedPost = user.posts.splice(postId, 1)[0];
  
  const { _id, ...updatedFields } = user;

  await db.collection('users').updateOne({ username: user.username }, { $set: updatedFields });

  if (deletedPost) {
    const query = {
      Title: deletedPost.Title, 
      Artist: deletedPost.Artist,
      Year: deletedPost.Year,
      Category: deletedPost.Category,
      Medium: deletedPost.Medium,
      Description: deletedPost.Description,
      Poster: deletedPost.Poster 
    };

    // Delete the item from the gallery collection based on the properties from 'post'
    await db.collection('gallery').deleteOne(query);
    if(deletedPost.likes) {
      let likes = deletedPost.likes;

      for(let i = 0; i<likes.length; i++) {
        user = await db.collection('users').findOne({ username: likes[i].username });
        for(let j = 0; j<user.likedPosts.length; j++) {
          if(user.likedPosts[j].Title === deletedPost.Title) {
            user.likedPosts.splice(j,1);
            break;
          }
        }

      }
      await db.collection('users').updateOne({ username: user.username }, { $set: user });
    }
    
  }

  res.status(200).json({ message: 'Login successful' });

  
});