    const PiCamera = require('pi-camera');
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    const fs = require('fs')
    const OGsourceImage = fs.readFileSync('./test.jpg'); 

    // OBJECT DETECTION ---------------------------------------------------
    //input parameters
    //CAMERA SETUP
    const myCamera = new PiCamera({
      mode: 'photo',
      output: `${ __dirname }/test.jpg`,
      width: 640,
      height: 600,
      nopreview: true,
    });

    myCamera.snap()
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
    console.log("Whether the original test img remained", OGsourceImage.equals(testImage));
    const sourceTargetImages = [  //array to list the images in bucket to be compared
        
        'bob.JPG'
      ];
    let temp = false;

    // targetImages.forEach(async (targetImage) => {
        // try {
          // Get the target image(s) from S3
          
          const sourceImage = 'bob.JPG'
          const result = async () => {
            const s3Object = await SW3
            .getObject({ Bucket: bucketName, Key: sourceImage })
            .promise();
            await trial(s3Object)
          }
          
          // console.log(s3Object, 'hello' )
          
            async function trial(SW3Object){
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

        if (comparision.FaceMatches[0].Similarity > 90) {
          console.log(`Similarity for ${'bob.JPG'} is greater than 90%`);
          sns.publish({
            Message: 'An intruder has entered your space!',
            Subject:'Intruder alert',
            PhoneNumber: mobile
          })
        } else if(comparision.FaceMatches[0].Similarity < 90){
          console.log('Similarity is less than 90%')
          sns.publish({
            Message: 'An intruder has entered your space!',
            Subject:'Intruder alert',
            PhoneNumber: mobile
          })
        }
    } else {
      console.log('No faces detected')
      sns.publish({
        Message: 'An intruder has entered your space!',
        Subject:'Intruder alert',
        PhoneNumber: mobile
      })
    }
  }
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
      