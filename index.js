    const PiCamera = require('pi-camera');
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    const fs = require('fs');
    const { exit } = require('process');
    const OGsourceImage = fs.readFileSync('./test.jpg'); 

    // OBJECT DETECTION ---------------------------------------------------
    //input parameters
    //CAMERA SETUP
    const myCamera = async () => {
    const Photo = new PiCamera({
      mode: 'photo',
      output: `${ __dirname }/test.jpg`,
      width: 640,
      height: 600,
      nopreview: true,
    });

   await Photo.snap()
    .then((result) => {
      console.log("Image successfully captured, response: ", result);
    })
    .catch((error) => {
       console.log("Couldn't Capture Image, Check Camera's Connection, error code: ", error);
       exit(0);
    });
  }

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
    const SW3 = new AWS.S3();

    //Detect labels
    rekognition.detectLabels(params, function(err, data){
        if (err) console.log(err, err.stack);  
        else     console.log(data);            
    });



    //SNS
    var sns = new AWS.SNS()
    var mobile = '+918078230593'


    // COMPARE FACES--------------------------------------------------------------
    const bucketName = 'testingrekognition1234'
    

    const testImage = fs.readFileSync('./test.jpg');
    console.log("Whether the original test img was overwritten: ", !OGsourceImage.equals(testImage));
    const sourceTargetImages = [  //array to list the images in bucket to be compared
        
        'bob.JPG'
      ];
    let temp = false;

    // targetImages.forEach(async (targetImage) => {
        // try {
          // Get the target image(s) from S3
          
          const sourceImage = 'bob.JPG'
          console.log(" Entered Here, Before Result Func");
          const result = async () => {
            const s3Object = await SW3
            .getObject({ Bucket: bucketName, Key: sourceImage })
            .promise();
            await trial(s3Object)
          }
          
          // console.log(s3Object, 'hello' )
          
            async function trial(SW3Object) {
              // await sleep(2000)
              var faceParams = {
                Image: {
                  Bytes: testImage,

                },
                
                Attributes: ['ALL']
              };
              // let p = testImage 
              // console.log('hi', SW3Object.Body)
              // await detectingFaces(faceParams)
              let faceState = await detectingFaces(faceParams)
              console.log("Face_State: ", faceState)
              if (faceState){
                // await facialComparision(p,l)
              var comparision = await facialComparision(SW3Object, testImage);
              // console.log(comparision)
              } else {
                console.log('No face was detected')
              }

            
              // s3Object.then(function(data) {
              //   console.log('Success');
              // }).catch(function(err) {
              //   console.log(err);
              // });
      
              // Compare the source image with the target image
          
              // result.then(function(data) {
              //   console.log('ok');
              // }).catch(function(err) {
              //   console.log(err);
              // });
              // console.log('test')
              // console.log(comparision)
              // console.log(result)
              // await new Promise(resolve => setTimeout(resolve, 5000));
          
        
          

              //   console.log(`Comparison result for ${targetImage}: ${JSON.stringify(result)}`);
              if (faceState) {
                if (comparision.FaceMatches.length) {
                  if (comparision.FaceMatches[0].Similarity > 90) {
                    console.log(`Similarity for ${'bob.JPG'} is greater than 90% at ${comparision.FaceMatches[0].Similarity}`);
                    sns.publish({
                      Message: 'Your Safe, it\'s just you',
                      Subject:'Status alert',
                      PhoneNumber: mobile
                    })
                  } else if(comparision.FaceMatches[0].Similarity < 90){
                      console.log(`Similarity is less than 90% at ${comparision.FaceMatches[0].Similarity}`)
                      sns.publish({
                        Message: 'An intruder has probably entered your space!',
                        Subject:'Intruder alert',
                        PhoneNumber: mobile
                      })
                  }
                } else if (response.UnmatchedFaces.length) {
                    console.log('No Similarity Found, Stranger Danger')
                    sns.publish({
                      Message: 'An intruder has entered your space!',
                      Subject:'Intruder alert',
                      PhoneNumber: mobile
                    })
                }
              } else {
                  console.log('No faces detected')
                  sns.publish({
                    Message: 'Uhm, Welp',
                    Subject:'Status alert',
                    PhoneNumber: mobile
                  })
              }
            }

  console.log("Call for Result Func()");
  result()

  async function detectingFaces(paras) {
  await rekognition.detectFaces(paras, function(err, response) {

    if (err) {
       console.log(err, err.stack); // an error occurred
       temp = false
    } else {
       //  if (response.FaceDetails != null && response.FaceDetails != undefined && response.FaceDetails != ''){
      if (response.FaceDetails.length){
        temp = true 
      } else {
         temp = false
      }
            
      console.log("Face_Current_Check: ", temp)
      // console.log(response)
      response.FaceDetails.forEach(data => {
        console.log(`  Confidence:     ${data.Confidence}`)
      })

    } 
  }).promise();
        // isFace.response(
        //   function(data){
        //     data.FaceDetails.forEach(data => {
        //       console.log(`  Confidence:     ${data.Confidence}`)
        //       })
        //      temp = true 
        //   },
        //   function(error){
        //     console.log(error, error.stack); // an error occurred
        //     temp = false
        //   }
        // );
      // await sleep(5000)
    return temp;
  }

  async function facialComparision(source, target) {
    console.log(target, 'hello')
    // console.log('sleeping for 15s')
    const result =  await rekognition.compareFaces({
      SourceImage: { Bytes: source.Body},
      TargetImage: { Bytes: target},
    }, function (err, response) {
        if (err) {
          console.log(err, err.stack); // an error occurred
        } else {
            //  if (response.FaceDetails != null && response.FaceDetails != undefined && response.FaceDetails != ''){
            if (response.FaceMatches.length){
                console.log("Face Matche(s) Found, Similarity: ", response.FaceMatches.Similarity);
            } else if (response.UnmatchedFaces.length){
                 console.log("Face Matche(s) Not Found, Confidence: ", response.FaceMatches.Confidence);
            }     
            console.log("Source Image Face Detection Confidence:  ", response.SourceImageFace.Confidence)
        }
    }).promise();
        // await sleep(5000)

    return result;
  }

        // function sleep(ms) {
        //   return new Promise((resolve) => {
        //     setTimeout(resolve, ms);
        //   });
        // }

        // } catch (error) {
        //   console.log(s3Object, result, testImage)
        //   console.log(error)
          
        //   console.error(`Error comparing faces for ${targetImage}: ${error}`);
        // console.log(error)
        // console.log('Similarity is less than 90%')
        //     sns.publish({
        //       Message: 'An intruder has entered your space!',
        //       Subject:'Intruder alert',
        //       PhoneNumber: mobile
        //     })
        // }
        
      // }
      // );
      