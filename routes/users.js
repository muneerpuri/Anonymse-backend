const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const Post = require("../models/Post");
//update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

//delete user
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc;
    let PostCount = await Post.find({userId:user._id})
    let resultObj = {
      ...other,
      count:PostCount.length
    }
    res.status(200).json(resultObj);
  } catch (err) {
    res.status(500).json(err);
  }
});
// get User Name
router.get("/chat/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId)
    const { username, updatedAt, ...other } = user._doc;
    res.status(200).json(username);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/test", async (req, res) => {
  res.status(200).json("working");
});

//get followings
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture } = friend;
      friendList.push({ _id, username, profilePicture });
    });
    res.status(200).json(friendList)
  } catch (err) {
    res.status(500).json(err);
  }
});
//get followers
router.get("/followers/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followers.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture } = friend;
      friendList.push({ _id, username, profilePicture });
    });
    res.status(200).json(friendList)
  } catch (err) {
    res.status(500).json(err);
  }
});
//follow a user

router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you allready follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
});

//unfollow a user

router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
});

router.get('/search',async(req,res)=>{
  if(!req.query.name){
    res.status(404).json([])
  }else{
    
    User.aggregate([
     {
       $match: {
         username: { $regex:  req.query.name,'$options' : 'i' },
       },
     },
   ]).exec()
   .then(result=>{
     console.log(result)
     res.status(200).json(result)})
     .catch(e=>console.log(e))
  
   
  }
})

router.get('/messengerchat/:userId',async(req,res)=>{

console.log("data is",req.query)
  if(!req.query.name){
    res.status(404).json([])
  }else{

    try {
      const user = await User.findById(req.params.userId);

    const friends = await Promise.all(
      user.followings.map((friendId) => {
        

        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      friends.find(element => {
        if (element.username.includes(req.query.name)) {
          const { _id, username, profilePicture } = friend;
          friendList.push({ _id, username, profilePicture });
        }
      });
    });
    res.status(200).json(friendList)
  } catch (err) {
    res.status(500).json(err);
  }
  
  
}







})
module.exports = router;
