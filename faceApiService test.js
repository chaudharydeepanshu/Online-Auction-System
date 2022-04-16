// const path = require("path");

// const tf = require("@tensorflow/tfjs-node");

// const faceapi = require("@vladmandic/face-api/dist/face-api.node.js");

// const fetch = require("node-fetch");
// // const Blob = require("node-blob");

// const canvas = require("canvas");
// const { loadImage, Canvas, Image, ImageData } = canvas;

// // @ts-ignore
// // Make face-api.js use that fetch implementation
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

// const modelPathRoot = "./models";

// let optionsSSDMobileNet;

// async function image(file) {
//   const decoded = tf.node.decodeImage(file);
//   const casted = decoded.toFloat();
//   const result = casted.expandDims(0);
//   decoded.dispose();
//   casted.dispose();
//   return result;
// }

// async function detect(tensor) {
//   const result = await faceapi
//     .detectAllFaces(tensor, optionsSSDMobileNet)
//     .withFaceLandmarks()
//     .withFaceDescriptors();
//   return result;
// }

// async function main(file) {
//   console.log("FaceAPI single-process test");

//   await faceapi.tf.setBackend("tensorflow");
//   await faceapi.tf.enableProdMode();
//   await faceapi.tf.ENV.set("DEBUG", false);
//   await faceapi.tf.ready();

//   console.log(
//     `Version: TensorFlow/JS ${faceapi.tf?.version_core} FaceAPI ${
//       faceapi.version.faceapi
//     } Backend: ${faceapi.tf?.getBackend()}`
//   );

//   console.log("Loading FaceAPI models");
//   const modelPath = path.join(__dirname, "/public", modelPathRoot);
//   await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
//   await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
//   await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
//   optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
//     minConfidence: 0.5,
//   });

//   const tensor = await image(file);
//   const result = await detect(tensor);

//   // 0.6 is a good distance threshold value to judge
//   // whether the descriptors match or not
//   const maxDescriptorDistance = 0.6;
//   // create FaceMatcher with automatically assigned labels
//   // from the detection results for the reference image
//   const faceMatcher = new faceapi.FaceMatcher(result, maxDescriptorDistance);

//   const imgUrl = path.join(
//     __dirname,
//     "/public/images/sample-images/fruit.jpeg"
//   );
//   var img = await loadImage(imgUrl);

//   const results = await faceapi
//     .detectAllFaces(img)
//     .withFaceLandmarks()
//     .withFaceDescriptors();

//   results.forEach((fd) => {
//     const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
//     console.log(bestMatch.toString());
//   });

//   // console.log("Detected faces:", results.length);

//   tensor.dispose();

//   return result;
// }

// module.exports = {
//   detect: main,
// };

// // const path = require("path");

// // const tf = require("@tensorflow/tfjs-node");

// // const faceapi = require("@vladmandic/face-api/dist/face-api.node.js");

// // const fetch = require("node-fetch");
// // const Blob = require("node-blob");

// // const canvas = require("canvas");
// // const { loadImage, Canvas, Image, ImageData } = canvas;

// // // @ts-ignore
// // // Make face-api.js use that fetch implementation
// // faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

// // const modelPathRoot = "./models";

// // let optionsSSDMobileNet;

// // async function image(file) {
// //   const decoded = tf.node.decodeImage(file);
// //   const casted = decoded.toFloat();
// //   const result = casted.expandDims(0);
// //   decoded.dispose();
// //   casted.dispose();
// //   return result;
// // }

// // async function detect(tensor) {
// //   const result = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet);
// //   return result;
// // }

// // async function main(file) {
// //   console.log("FaceAPI single-process test");

// //   await faceapi.tf.setBackend("tensorflow");
// //   await faceapi.tf.enableProdMode();
// //   await faceapi.tf.ENV.set("DEBUG", false);
// //   await faceapi.tf.ready();

// //   console.log(
// //     `Version: TensorFlow/JS ${faceapi.tf?.version_core} FaceAPI ${
// //       faceapi.version.faceapi
// //     } Backend: ${faceapi.tf?.getBackend()}`
// //   );

// //   console.log("Loading FaceAPI models");
// //   const modelPath = path.join(__dirname,"/public", modelPathRoot);
// //   await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
// //   optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
// //     minConfidence: 0.5,
// //   });

// //   const tensor = await image(file);
// //   const result = await detect(tensor);
// //   console.log("Detected faces:", result.length);

// //   tensor.dispose();

// //   return result;
// // }

// // module.exports = {
// //   detect: main,
// // };
