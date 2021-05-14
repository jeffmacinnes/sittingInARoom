let currentSound;
let clipDuration;
let amp;
function preload() {
  soundFormats("mp3", "ogg");
  loadSound("assets/test1", (sound) => {
    clipDuration = sound.duration();
    currentSound = sound;
    console.log("loaded");
  });
}

let recorder;
function loopTrack(nextSound) {
  newSound = new p5.SoundFile();
  recorder = new p5.SoundRecorder();

  // set the current sound to the file provided
  currentSound = nextSound;
  currentSound.setVolume(0.8);

  let comp = new p5.Compressor();
  comp.process(currentSound, 0, 0, 20, -1, 1);
  currentSound.play();
  loopCounter.innerHTML = `iteration: ${loopIdx + 1}`;

  clipDuration = currentSound.duration();

  // record this clip to new file
  recorder.record(newSound, clipDuration, () => {
    // manipulate
    let delay = new p5.Delay();
    // delay.process(newSound, 0.12, .5);
    delay.process(newSound, delayTime, delayFB);

    // increment loop idx
    loopIdx++;

    // start new loop
    loopTrack(newSound);
  });
}

// --- plotting
let fft;
let octaveBands;
let playButton;
let loopCounter;
let plotWidth;

function setup() {
  getAudioContext().suspend();
  playButton = document.getElementById("play-button");
  playButton.addEventListener("click", toggleSound); // button.parent("control-box");
  playButton.addEventListener("touchstart", toggleSound);

  loopCounter = document.getElementById("loop-counter");

  let container = document.getElementById("spectrogram");
  let domRect = container.getBoundingClientRect();
  plotWidth = domRect.width;
  let cnv = createCanvas(plotWidth, 6000);
  cnv.parent("spectrogram");
  background(255);
  fft = new p5.FFT();
  octaveBands = fft.getOctaveBands(3);
  frameRate(30);
}

let frSamples = [];
let meanFrDeviation;
let delayTime;
let delayFB;
function toggleSound() {
  if (currentSound.isPlaying() && recorder.recording) {
    currentSound.stop();
  } else {
    // calculate mean fr deviation
    let deviations = frSamples.map((fr) => Math.abs(fr - 30));
    meanFrDeviation = d3.mean(deviations);

    // set delay params
    let screenArea = window.innerWidth * window.innerHeight;
    delayTime = map(screenArea, 250125, 2304000, 0.05, 0.2, true); // screen area range (750x1334) to (1920x1200)
    delayFB = map(meanFrDeviation, 0, 0.75, 0.2, 0.5, true);
    console.log("delayTime: ", delayTime);
    console.log("delayFB: ", delayFB);

    // start loop
    userStartAudio();
    loopTrack(currentSound);
    playButton.classList.add("inactive");
  }
}

let loopIdx = 0;
spanHeight = 60;

function draw() {
  if (currentSound.isPlaying()) {
    fft.analyze();
    let groupedFreqs = fft.logAverages(octaveBands);
    groupedFreqs = groupedFreqs.slice(0, -1);
    let spanWidth = plotWidth / groupedFreqs.length;
    stroke(0, 150);
    strokeWeight(1);

    groupedFreqs.forEach((freq, i) => {
      if (freq == 0) {
        return;
      }

      let spanStart = i * spanWidth;
      let spanEnd = spanStart + spanWidth;

      // y pos is equal to the energy at this band
      let y = map(freq, 0, 255, spanHeight * 3, 0);
      y += spanHeight * loopIdx;
      let x = random(spanStart, spanEnd + 1);
      point(x, y);
    });
  } else {
    // update the frame rate samples
    let idx = frameCount % 10;
    frSamples[idx] = frameRate();
  }
}
