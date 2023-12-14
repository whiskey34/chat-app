const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const { isInteger } = require("core-js/core/number");

//Create A Schema
const UserSchema = mongoose.Schema({
  phone_num:{
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    // unique: true,
    lowercase: true,
  },
  name:{
    type: String,
    required: true,
  },
  dateCreated:{
    type: Date,
    required: true,
  },
  socket: {
    type: String,
    default: '',
  },
  isOnline: {
    type:Boolean,
    default: false,
  },
});

UserSchema.pre('save', async function(next) {
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Generate a password hash
    const passwordHashed = await bcrypt.hash(this.password, salt);
    // Assign hash to password
    this.password = passwordHashed;
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function(newPassword) {
  try {
     return await bcrypt.compare(newPassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
}

//Create A Model
const UserModel = mongoose.model("user", UserSchema);

//Export The Model
module.exports = UserModel;