"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
	_id: Number,
	name: String,
	currencies: [{
		curName: String
	}]
});

exports.User = mongoose.model("User", userSchema);