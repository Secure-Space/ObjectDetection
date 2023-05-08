const PiCamera = require('pi-camera');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');


// OBJECT DETECTION ---------------------------------------------------
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
    if (err) console.log(err, err.stack);  
    else     console.log(data);            
});


//CAMERA SETUP
const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/test.jpg`,
  width: 640,
  height: 600,
  nopreview: true,
});

//SNS
var sns = new AWS.SNS()
var mobile = '+918078230593'


// COMPARE FACES--------------------------------------------------------------
const bucketName = 'testingrekognition1234'
const fs = require('fs')
myCamera.snap()
const sourceImage = fs.readFileSync('./test.jpg');    
const targetImages = [  //array to list the images in bucket to be compared
    
    'bob.JPG'
  ];

targetImages.forEach(async (targetImage) => {
    try {
      // Get the target image(s) from S3
      const s3Object = await new AWS.S3()
        .getObject({ Bucket: bucketName, Key: targetImage })
        .promise();
  
      // Compare the source image with the target image
      const result = await rekognition.compareFaces({
        SourceImage: { Bytes: sourceImage },
        TargetImage: { Bytes: s3Object.Body },
      }).promise();
  
    //   console.log(`Comparison result for ${targetImage}: ${JSON.stringify(result)}`);
    if (result.FaceMatches[0].Similarity > 90) {
        console.log(`Similarity for ${targetImage} is greater than 90%`);
      }
    // else{
    //     console.log('Similarity is less than 90%')
    //     sns.publish({
    //       Message: 'An intruder has entered your space!',
    //       Subject:'Intruder alert',
    //       PhoneNumber: mobile
    //     })
    // }
    } catch (error) {
    //   console.error(`Error comparing faces for ${targetImage}: ${error}`);
    // console.log(error)
    console.log('Similarity is less than 90%')
        sns.publish({
          Message: 'An intruder has entered your space!',
          Subject:'Intruder alert',
          PhoneNumber: mobile
        })
    }
    
  });
  