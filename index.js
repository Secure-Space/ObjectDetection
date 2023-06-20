const PiCamera = require('pi-camera');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
const fs = require('fs');
const { exit } = require('process');

const OGsourceImage = fs.readFileSync('./test.jpg'); 

// OBJECT DETECTION ---------------------------------------------------
//input parameters
var testImage = fs.readFileSync('./test.jpg');
//CAMERA SETUP
const myCamera = async () => {
console.log('Entering myCAMERA')
const Photo = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/test.jpg`,
  width: 640,
  height: 600,
  nopreview: true,
});

// myCamera.snap()
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
console.log('Calling MYCAMERA --------')
myCamera();

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

const imageBytes = fs.readFileSync('./test.jpg');
var params = {
    Image: {
        // S3Object: {
        //     Bucket: "testingrekognition1234",
        //     Name: "1.jpg"
        // }
        Bytes: imageBytes
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
const SW3 = new AWS.S3();


// COMPARE FACES--------------------------------------------------------------
const bucketName = 'testingrekognition1234'



const sourceTargetImages = [  //array to list the images in bucket to be compared
    
    'bob.JPG'
  ];
let temp = false;

      const sourceImage = 'bob.JPG'
      console.log(" Entered Here, Before Result Func");
      const result = async () => {
        console.log('Entering result function')
        const s3Object = await SW3
        .getObject({ Bucket: bucketName, Key: sourceImage })
        .promise();
        console.log('Going to call trial function')
        await trial(s3Object)
      }
      
      // console.log(s3Object, 'hello' )

//SNS
var params2 = {
  Message: 'An intruder has been detected!', /* required */
  PhoneNumber: '+919744783929',
};
var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params2).promise();


        async function trial(SW3Object) {
          console.log('Entering trial function')
          let x = 500, i = 1;
          
          while(OGsourceImage.equals(testImage)){
           
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
         console.log('Going to call detectfaces')
          let faceState = await detectingFaces(faceParams)
          console.log("Face_State: ", faceState)
          if (faceState){
            // await facialComparision(p,l)
            console.log('Calling facialcomaprision')
          var comparision = await facialComparision(SW3Object, testImage);
          // console.log(comparision)
          } else {
            console.log('No face was detected')
          }

          rekognition.detectLabels(params, function(err, data){
            if (err) console.log(err, err.stack);  
            else     console.log(data);            
        });
      

          if (faceState) {
            if (comparision.FaceMatches.length) {
              if (comparision.FaceMatches[0].Similarity > 90) {
                console.log(`Similarity for ${'bob.JPG'} is greater than 90% at ${comparision.FaceMatches[0].Similarity}`);
                
              } else if(comparision.FaceMatches[0].Similarity < 90){
                  console.log(`Similarity is less than 90% at ${comparision.FaceMatches[0].Similarity}`)
                  // publishTextPromise.then(
                  //   function(data) {
                  //     console.log("MessageID is " + data.MessageId);
                  //   }).catch(
                  //   function(err) {
                  //     console.error(err, err.stack);
                  //   });
              }
            } else if (comparision.UnmatchedFaces.length) {
                console.log('No Similarity Found, Stranger Danger')
                publishTextPromise.then(
                    function(data) {
                      console.log("MessageID is " + data.MessageId);
                    }).catch(
                    function(err) {
                      console.error(err, err.stack);
                    });
            }
          } else {
              console.log('No faces detected')
              // publishTextPromise.then(
              //       function(data) {
              //         console.log("MessageID is " + data.MessageId);
              //         console.log(data)
              //       }).catch(
              //       function(err) {
              //         console.error(err, err.stack);
              //       });
          }
          return 0
        }

console.log("Call for Result Func()");
result()

async function detectingFaces(paras) {
  console.log('Entering detectfaces')
await rekognition.detectFaces(paras, function(err, response) {

if (err) {
   console.log(err, err.stack); // an error occurred
   temp = false
} else {
  if (response.FaceDetails.length){
    temp = true 
  } else {
     temp = false
  }
        
  
} 
console.log("Face_Current_Check: ", temp)
  response.FaceDetails.forEach(data => {
    console.log(`  Confidence:     ${data.Confidence}`)
  })

}).promise();
return temp;
}

async function facialComparision(source, target) {
console.log('Entering compareFaces')
const result =  await rekognition.compareFaces({
  SourceImage: { Bytes: source.Body},
  TargetImage: { Bytes: target},
}, function (err, response) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
        if (response.FaceMatches.length){
            console.log("Face Matche(s) Found, Similarity: ", response.FaceMatches.Similarity);
        } else if (response.UnmatchedFaces.length){
             console.log("Face Matche(s) Not Found, Confidence: ", response.FaceMatches.Confidence);
        }     
        console.log("Source Image Face Detection Confidence:  ", response.SourceImageFace.Confidence)
    }

}).promise();

return result;
}

    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }
