const PiCamera = require('pi-camera');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
const fs = require('fs');
const { exit } = require('process');
const OGsourceImage = fs.readFileSync('./test.jpg'); 

// OBJECT DETECTION ---------------------------------------------------
//input parameters
var testImage = fs.readFileSync('./test.jpg');

let BypassCamera = false; // Hardcoded - Flip For Testing 

//CAMERA SETUP
const myCamera = async () => {
  const Photo = new PiCamera({
    mode: 'photo',
    output: `${ __dirname }/test.jpg`,
    width: 640,
    height: 600,
    nopreview: true,
  });

  console.log("Capturing Image ....")
  await Photo.snap()
  .then((result) => {
    console.log("Image successfully captured, response: ", result);
    testImage = fs.readFileSync('./test.jpg');
  })
  .catch((error) => {
    console.log("Couldn't Capture Image, Check Camera's Connection, error code: ", error);
    exit(0);
  });

}

if (!BypassCamera) {
  myCamera();
}
// const myVideoCamera = new PiCamera({
//   mode: 'video',
//   output: `${ __dirname }/video.h264`,
//   width: 1920,
//   height: 1080,
//   timeout: 5000, // Record for 5 seconds
//   nopreview: true,
// });
// myVideoCamera.record()
// .then((result) => {
//   console.log("Video successfully captured, response: ", result);
// })
// .catch((error) => {
//    console.log("Couldn't Capture Video, Check Camera's Connection, error code: ", error);
//    exit(0);
// });

AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // credentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
    }
  });


//Call AWS Rekognition Class
const rekognition  = new AWS.Rekognition();
const SW3 = new AWS.S3();

//SNS
var sns = new AWS.SNS()
var mobile = '+918078230593'
const bucketName = 'testingrekognition1234'

const sourceTargetImages = [  // array to list the images in bucket to be compared
    'bob.JPG'
  ];
let temp = false;

async function Image_Label_Detection(source) {
  if (source == null || source == undefined) 
    source = "1.jpg";

  var params = {
    Image: {
        S3Object: {
            Bucket: "testingrekognition1234",
            Name: source
        }
    },
    MaxLabels: 5,
    MinConfidence: 80
  };
  
  //Detect labels
 await rekognition.detectLabels(params).promise().then(result =>{
  console.log(result);
 }).catch(err =>{
  console.log(err, err.stack);
 });

}

// targetImages.forEach(async (targetImage) => {
    // try {
      // Get the target image(s) from S3
      
      const sourceImage = 'bob.JPG'

      const result = async () => {
        // Image_Label_Detection(); // Call if Image-Label-Detection is Wanted
        const s3Object = await SW3
        .getObject({ Bucket: bucketName, Key: sourceImage })
        .promise();

        await trial(s3Object)
      }
      
        async function trial(SW3Object) {

          // await sleep(4500)
          let x = 500, i = 1;
          
          while(OGsourceImage.equals(testImage) && !BypassCamera) {
            await sleep(x)
            i++
            x = x * i;
          }
          var faceParams = {
            Image: {
              Bytes: testImage,

            },
            Attributes: ['ALL']
          };


          let faceState = await detectingFaces(faceParams)
          // console.log("Face_State: ", faceState)
          if (faceState){

            var comparision = await facialComparision(SW3Object, testImage);
          } else {
            console.log('No Face Was Detected')
          }
          
          if (faceState) {
            if (comparision.FaceMatches.length) {
              if (comparision.FaceMatches[0].Similarity > 90) {
                console.log(`Similarity for ${sourceImage} is greater than \x1b[33m90\x1b[0m% at`, `\x1b[33m${comparision.FaceMatches[0].Similarity}\x1b[0m%`);
                sns.publish({
                  Message: 'Your Safe, it\'s just you',
                  Subject:'Status alert',
                  PhoneNumber: mobile
                })
              } else if(comparision.FaceMatches[0].Similarity < 90){
                  console.log(`Similarity is less than 90% at `, `\x1b[33m${comparision.FaceMatches[0].Similarity}\x1b[0m%`)
                  sns.publish({
                    Message: 'An intruder has probably entered your space!',
                    Subject:'Probable Intruder alert',
                    PhoneNumber: mobile
                  })
              }
            } else if (comparision.UnmatchedFaces.length) {
                console.log('No Similarity Found, Stranger Danger')
                sns.publish({
                  Message: 'An intruder has entered your space!',
                  Subject:'Intruder alert',
                  PhoneNumber: mobile
                })
            }
          } else {
              console.log('No Faces Detected, Home Sweet & Safe')
              sns.publish({
                Message: 'Uhm, Welp',
                Subject:'Status alert',
                PhoneNumber: mobile
              })
          }
        }

result()

async function detectingFaces(paras) {
  console.log("Detecting Faces ....");
  await rekognition.detectFaces(paras).promise().then(response => {

  if (response.FaceDetails.length){
    temp = true
    response.FaceDetails.forEach(data => {
      console.log('Detected Face(s) Confidence:', `\x1b[33m${data.Confidence}\x1b[0m%`)
    })
  } else {
     temp = false
  }
  
// console.log("Face_Current_Check: ", temp)
}).catch(err =>{
     console.log(err, err.stack); // an error occurred
     temp = false
});

return temp;
}

async function facialComparision(source, target) {
  console.log("Comparing Faces ....");
const result = await rekognition.compareFaces({
  SourceImage: { Bytes: source.Body},
  TargetImage: { Bytes: target},
}).promise().then(response => {
        if (response.FaceMatches.length){
            console.log("Face Matche(s) Found, Similarity:", `\x1b[33m${response.FaceMatches[0].Similarity}\x1b[0m%`);
        } else if (response.UnmatchedFaces.length){
             console.log("Face Matche(s) Not Found, Confidence:", `\x1b[33m${response.UnmatchedFaces[0].Confidence}\x1b[0m%`);
        }     
        console.log("Source Image Face Detection Confidence:", `\x1b[33m${response.SourceImageFace.Confidence}\x1b[0m%`)
        return response;

}).catch(err => {
    console.log(err, err.stack); // an error occurred
});
return result;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
  