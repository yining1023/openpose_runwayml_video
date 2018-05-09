// Copyright (C) 2018 Cristobal Valenzuela
// 
// This file is part of RunwayML.
// 
// RunwayML is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// RunwayML is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with RunwayML.  If not, see <http://www.gnu.org/licenses/>.
// 
// ===============================================================
//
// Runway: OpenPose Single Image Demo
// This example sends one image to Runway and draw all humans detected in the image
// p5.js is used to draw the human data sent from Runway
// You should select HTTP from the Input Panel
// 
// Cristóbal Valenzuela
// cris@runwayml.com
//
// ===============================================================

let w = 400;
let h = 225;
let colors;
let socket;
let videoClip;
let isVideoReady = false;
let humansData = [];
let key = 0;
let stopVideo = false;
// This are all the body connections we want to draw
let bodyConnections = [
  ['Nose', 'Left_Eye'],
  ['Left_Eye', 'Left_Ear'],
  ['Nose', 'Right_Eye'],
  ['Right_Eye', 'Right_Ear'],
  ['Nose', 'Neck'],
  ['Neck', 'Right_Shoulder'],
  ['Right_Shoulder', 'Right_Elbow'],
  ['Right_Elbow', 'Right_Wrist'],
  ['Neck', 'Left_Shoulder'],
  ['Left_Shoulder', 'Left_Elbow'],
  ['Left_Elbow', 'Left_Wrist'],
  ['Neck', 'Right_Hip'],
  ['Right_Hip', 'Right_Knee'],
  ['Right_Knee', 'Right_Ankle'],
  ['Neck', 'Left_Hip'],
  ['Left_Hip', 'Left_Knee'],
  ['Left_Knee', 'Left_Ankle'],
]

// This array will get updated with all the humans detected in the image
let humans = [];

// Wait until the page is loaded
document.addEventListener("DOMContentLoaded", function(event) {
  // A variable to hold the status of the connection
  let status = document.getElementById('status');

  // Create a connection with Runway
  // *You should update this address to match the URL provided by the app
  socket = io.connect('http://127.0.0.1:33200/query');

  // When a connection is established
  socket.on('connect', function() {
    status.innerHTML = 'Connected';
  });
  // Handle connection error (in case something is wrong and we can't connect to Runway)
  socket.on('connect_error', (error) => {
    console.error(error);
  });
  // Handle connection timeout (in case something is wrong and it's taking ages connecting to Runway)
  socket.on('connect_timeout', (timeout) => {
    console.warn(socket.io.uri,"connect_timeout",timeout);
  });

  // When there is new data coming in, update the log element
  socket.on('update_response', (data) => {
    humans = data.results.humans;
    // if (humans.length > 0) {
    //   humans.forEach(human => drawHuman(human));
    // }
    humansData.push(humans);
    console.log('humansData.length: ', humansData.length);
  });


});
function preload() {
  humansDataJson = loadJSON('humandata.json');
}
// p5 setup function
function setup() {
  frameRate(8);
  // Create a canvas
  createCanvas(w, h);
  // Load the image
  videoClip = createVideo('thatwhatIlike10s.mov', videoReady).parent('#videoContainer');
  // Set some style and colors
  strokeWeight(6);
  colors = [color('#00ff00'), color('#ffff00'), color('#ff0000'), color('#00ffff'), color('#ffffff'), color('#f4f'), color('#00ff'), color('#ffaf00'), color('#aff'), color('#aaf'), color('#33a'), color('#55f'), color('#771'), color('#15f'), color('#ff0000'), color('#00ff00'), color('#ffff00'), color('#ff0000')];
  console.log('humansDataJson: ', humansDataJson);
}

function videoReady() {
  videoClip.speed(0.5);
  videoClip.play();
  isVideoReady = true;
}

function draw() {
  if (key >= Object.keys(humansDataJson).length) {
    stopVideo = true;
  }
  if (!stopVideo) {
    let humans = humansDataJson[key+''];
    if (!humans) {
      console.log(key+'');
      console.log(humansDataJson);
    }
  
    humans.forEach(human => drawHuman(human));
    key++;
  }

  // if (isVideoReady && !select('video').elt.ended) {
  //   sendVideoToRunway();
  // }
}

// Once the image has loaded, 
function sendVideoToRunway() {
  console.log('sendVideoToRunway');
  // Send the image to Runway and specify the model to use
  videoClip.loadPixels();
  socket.emit('update_request', {
    data: videoClip.canvas.toDataURL('image/jpeg'),
    model: "mobilenet_thin"
  });
}

// A function that connects joints based on data coming from OpenPose
function drawHuman(human) {
  // background(255);
  image(videoClip, 0, 0, 400, 225);
  bodyConnections.forEach((connection, i) => {
    let start = null;
    let endA = null;
    let endB = null;
    human.forEach(bodyPart => {
      const name = bodyPart[0];
      if (name === connection[0]) {
        start = bodyPart;
      } else if (name === connection[1]) {
        endA = bodyPart;
      } else if (connection[2] && name === connection[2]) {
        endB = bodyPart;
      }
    });
    stroke(colors[i]);
    if (start && endA && !endB) {
      line(start[1] * w, start[2] * h, endA[1] * w, endA[2] * h);
    } else if (start && endA && endB) {
      line(start[1] * w, start[2] * h, (endA[1] + endB[1]) / 2 * w, (endB[2] + endB[2]) / 2 * h);
    }
  });
}
