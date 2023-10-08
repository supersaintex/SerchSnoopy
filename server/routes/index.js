var express = require('express');
var router = express.Router();
var multer = require('multer');
var Canvas = require('canvas');
var fs = require('fs');
var path = require('path');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

var storage = multer.diskStorage({
  //ファイルの保存先を指定(ここでは保存先は./public/images) 
  destination: function(req, file, cb){
    cb(null, './public/images/')
  },
  //ファイル名を指定
  filename: function(req, file, cb){
    cb(null, 'image.jpg')
  }
})

var upload = multer({storage: storage})

// GET
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// POST
router.post('/', upload.single('file'), function(req, res) {
  console.log(req.file);
  // res.render('image');
  var img = new Canvas.Image();
  img.src = fs.readFileSync(req.file.path);

  var canvas = Canvas.createCanvas(img.width, img.height);
  ctx = canvas.getContext('2d');
  ctx.drawImage(img,0,0);

  // preprocess
  var tensor = tf.browser.fromPixels(canvas, 3).resizeBilinear([32, 32]).toFloat();
  var offset = tf.scalar(255);
  var tensor_image = tensor.div(offset).expandDims();
  console.log(tensor_image.shape);

  // run model
  let output;
  let result;
  async function prediction() {
    // modelはpublicの下に入れる
    const path_model = 'http://localhost:8080/model/model.json';
    const model = await tf.loadLayersModel(path_model);
    console.log("model loaded");
    output = await model.predict(tensor_image).data();
    console.log(output);
    result = Array.from(output);
    console.log(result[0]);
  }

  prediction();

  let data = {};
  data.resultImg = canvas.toDataURL();
  data.pred = result;
  res.render('image', data);
});


  // Canvas.Image() メソッドでImg要素を作り、
  // srcに受け取ったファイルのパスをセットする

module.exports = router;

