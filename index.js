// require("dotenv").config
//import required packages
var AWS = require('aws-sdk');
//AWS acess details
// AWS.config.update({
//     // accessKeyId: process.env.ACCESS_KEY_ID,
//     // secretAccessKey: process.env.SECRECT_ACESS_KEY,
//     region: 'ap-northeast-1'
// });
AWS.config.loadFromPath('./config.json');

//input parameters
var params = {
    Image: {
        S3Object: {
            Bucket: "testingrekognition1234",
            Name: "1.jpg"
        }
    },
    MaxLabels: 5,
    MinConfidence: 80
};

AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // credentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
    }
  });


//Call AWS Rekognition Class
const rekognition  = new AWS.Rekognition();

//Detect labels
rekognition.detectLabels(params, function(err, data){
    if (err) console.log(err, err.stack);  // error
    else     console.log(data);            // sucess
});