    const PiCamera = require('pi-camera');
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');


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
    // const sw3 = new AWS.S3();

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
    const fs = require('fs')

    const sourceImage = fs.readFileSync('./test.jpg');    
    const targetImages = [  //array to list the images in bucket to be compared
        
        'bob.JPG'
      ];
      let temp = false;

    // targetImages.forEach(async (targetImage) => {
        // try {
          // Get the target image(s) from S3
          
          const targetImage = 'bob.JPG'
          const result = async () => {
            const s3Object = await  new AWS.S3()
            .getObject({ Bucket: bucketName, Key: targetImage })
            .promise();
            await trial(s3Object)
          }
          
          // console.log(s3Object, 'hello' )
          
            async function trial(l){
              await sleep(2000)
              var faceParams = {
                Image: {
                  Bytes: sourceImage,

                },
                
            Attributes: ['ALL']
            };
              let p = sourceImage 
              console.log('hi', l.Body)
              // await detectingFaces(faceParams)
              let faceState = await detectingFaces(faceParams)
              console.log(faceState, 'yo')
              if(faceState){
                // await facialComparision(p,l)
              var comparision = await facialComparision(p,l);
              // console.log(comparision)
              }
              else{
                console.log('No face detected')
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
          console.log('test')
          // console.log(comparision)
          // console.log(result)
          // await new Promise(resolve => setTimeout(resolve, 5000));
          
        
          

        //   console.log(`Comparison result for ${targetImage}: ${JSON.stringify(result)}`);
        if(faceState){
        if (comparision.FaceMatches[0].Similarity > 90) {
          console.log(`Similarity for ${'bob.JPG'} is greater than 90%`);
          sns.publish({
            Message: 'An intruder has entered your space!',
            Subject:'Intruder alert',
            PhoneNumber: mobile
          })
        }
      
        else if(comparision.FaceMatches[0].Similarity < 90){
          console.log('Similarity is less than 90%')
          sns.publish({
            Message: 'An intruder has entered your space!',
            Subject:'Intruder alert',
            PhoneNumber: mobile
          })
      }
    }
    else{
      console.log('No faces detected')
      sns.publish({
        Message: 'An intruder has entered your space!',
        Subject:'Intruder alert',
        PhoneNumber: mobile
      })
    }
    }
          result()
        async function detectingFaces(q){
          // var t = rekognition.detectFaces(q, function(err, response){

          // })
          var isFace = await rekognition.detectFaces(q, function(err, response) {

            if (err) {
              console.log(err, err.stack); // an error occurred
              temp = false
            }
            else {
              if(response.FaceDetails != null && response.FaceDetails != undefined && response.FaceDetails != ''){
                tempx = true 
              }
              else{
                tempx = false
              }
            
              
              // console.log(Object.keys(response).length);
              // const y = isEmpty(response)
              // console.log(y, '1912')
              console.log(tempx)
              temp = tempx
              // console.log(response)
              response.FaceDetails.forEach(data => {
              console.log(`  Confidence:     ${data.Confidence}`)
              })
            //  temp = true 
            //   response = null
            } 
          

        })
        .promise();
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
        await sleep(5000)
      if(temp){
        return true
      }
      else{
        return false
      }
      }
        async function facialComparision( x, y){
          console.log(y.Body, 'hello') 
          console.log('sleeping for 15s')
          // var pl = rekognition.compareFaces({
          //   SourceImage: { Bytes: x },
          //   TargetImage: { Bytes: y.Body },
          // })
          const result =  await rekognition.compareFaces({
            SourceImage: { Bytes: x },
            TargetImage: { Bytes: y.Body },
          })
          .promise();
          await sleep(5000)

          

          return result;
        }

        function sleep(ms) {
          return new Promise((resolve) => {
            setTimeout(resolve, ms);
          });
        }
        function isEmpty(obj) {
          return Object.keys(obj).length === 0;
      }
        // } catch (error) {
        //   console.log(s3Object, result, sourceImage)
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
      