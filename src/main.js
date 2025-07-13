import gsap from "gsap";

import { Howl } from "howler";

import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import smokeVertexShader from "./shaders/smoke/vertex.glsl";
import smokeFragmentShader from "./shaders/smoke/fragment.glsl";
import themeVertexShader from "./shaders/theme/vertex.glsl";
import themeFragmentShader from "./shaders/theme/fragment.glsl";

/**  -------------------------- Audio setup -------------------------- */
     

let roomScene; // or call it 'model' or anything you want
let baseY = 0;

const raycaster2 = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED;


window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


// Background Music
let pianoDebounceTimer = null;
let isMusicFaded = false;
const MUSIC_FADE_TIME = 500;
const PIANO_TIMEOUT = 2000;
const BACKGROUND_MUSIC_VOLUME = 0;
const FADED_VOLUME = 0;

const backgroundMusic = new Howl({
  src: ["/audio/music/cosmic_candy.ogg"],
  loop: false,
  volume: 0,
});

const fadeOutBackgroundMusic = () => {
  if (!isMuted && !isMusicFaded) {
    backgroundMusic.fade(
      backgroundMusic.volume(),
      FADED_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = true;
  }
};

const fadeInBackgroundMusic = () => {
  if (!isMuted && isMusicFaded) {
    backgroundMusic.fade(
      FADED_VOLUME,
      BACKGROUND_MUSIC_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = false;
  }
};

// Piano
const pianoKeyMap = {
  C1_Key: "Key_24",
  "C#1_Key": "Key_23",
  D1_Key: "Key_22",
  "D#1_Key": "Key_21",
  E1_Key: "Key_20",
  F1_Key: "Key_19",
  "F#1_Key": "Key_18",
  G1_Key: "Key_17",
  "G#1_Key": "Key_16",
  A1_Key: "Key_15",
  "A#1_Key": "Key_14",
  B1_Key: "Key_13",
  C2_Key: "Key_12",
  "C#2_Key": "Key_11",
  D2_Key: "Key_10",
  "D#2_Key": "Key_9",
  E2_Key: "Key_8",
  F2_Key: "Key_7",
  "F#2_Key": "Key_6",
  G2_Key: "Key_5",
  "G#2_Key": "Key_4",
  A2_Key: "Key_3",
  "A#2_Key": "Key_2",
  B2_Key: "Key_1",
};

const pianoSounds = {};

Object.values(pianoKeyMap).forEach((soundKey) => {
  pianoSounds[soundKey] = new Howl({
    src: [`/audio/sfx/piano/${soundKey}.ogg`],
    preload: true,
    volume: 0.5,
  });
});

// Button
const buttonSounds = {
  click: new Howl({
    src: ["/audio/sfx/click/bubble.ogg"],
    preload: true,
    volume: 0.5,
  }),
};

/**  -------------------------- Scene setup -------------------------- */
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#D9CAD1");

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 35;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 2;
controls.maxAzimuthAngle = Math.PI / 4;



controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();

if (window.innerWidth < 768) {
  camera.position.set(33, 12, 20);
  controls.target.set(30, -15, -15);
  controls.update(); // <== REQUIRED
} else {
  camera.position.set(15, 10, 15);
  controls.target.set(8.4624, 1.9720, -0.8301);
  controls.update(); // <== REQUIRED
}


window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**  -------------------------- Modal Stuff -------------------------- */


const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
};

const overlay = document.querySelector(".overlay");
let touchHappened = false;

// Close modal on touch (mobile), except when touching a link or button
// overlay.addEventListener(
//   "touchend",
//   (e) => {
//     const target = e.target;

//     // Allow taps on links, buttons, inputs, etc.
//     if (target.closest("a, button, input, textarea, select, label")) return;

//     touchHappened = true;
//     e.preventDefault();

//     const modal = document.querySelector('.modal[style*="display: block"]');
//     if (modal) hideModal(modal);
//   },
//   { passive: false }
// );

overlay.addEventListener(
  "touchend",
  (e) => {
    const target = e.target;

    // Skip if tapped on a link or button (like WhatsApp or tablet)
    if (target.closest("a, button, input, textarea, select, label, .tablet")) return;

    // Prevent accidental re-opening issues
    if (!overlay || overlay.style.display === "none") return;

    touchHappened = true;
    e.preventDefault();

    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }

  
);

// Close modal on click (desktop), except when clicking a link or button
overlay.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;

    const target = e.target;

    // Allow clicks on links, buttons, inputs, etc.
    if (target.closest("a, button, input, textarea, select, label")) return;

    e.preventDefault();

    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

// Close modal with exit button
document.querySelectorAll(".modal-exit-button").forEach((button) => {
  function handleModalExit(e) {
    e.preventDefault();
    const modal = e.target.closest(".modal");

    gsap.to(button, {
      scale: 15,
      duration: 1.5,
      ease: "back.out(2)",
      onStart: () => {
        gsap.to(button, {
          scale: 15,
          duration: 1.5,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.set(button, {
              clearProps: "all",
            });
          },
        });
      },
    });

    buttonSounds.click.play();
    hideModal(modal);
  }

  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      handleModalExit(e);
    },
    { passive: true }
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      handleModalExit(e);
    },
    { passive: false }
  );
});

let isModalOpen = false;

gsap.fromTo(
  '#goodtext4 .goodtext-content',
  { opacity: 0, scale: 0.8, y: 50 },
  { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }
);
const showModal = (modal) => {
  modal.style.display = "block";
  overlay.style.display = "block";
  isModalOpen = true;

  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }

  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    opacity: 0,
    scale: 0,
  });
  gsap.set(overlay, {
    opacity: 0,
  });

  gsap.to(overlay, {
    opacity: 1,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: "back.out(2)",
  });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.in(2)",
    onComplete: () => {
      modal.style.display = "none";
      overlay.style.display = "none";
      touchHappened = false; // RESET here
    },
  });
};




// const modals = {
//   work: document.querySelector(".modal.work"),
//   about: document.querySelector(".modal.about"),
//   contact: document.querySelector(".modal.contact"),
// };

// const overlay = document.querySelector(".overlay");

// let touchHappened = false;
// overlay.addEventListener(
//   "touchend",
//   (e) => {
//     touchHappened = true;
//     e.preventDefault();
//     const modal = document.querySelector('.modal[style*="display: block"]');
//     if (modal) hideModal(modal);
//   },
//   { passive: false }
// );

// overlay.addEventListener(
//   "click",
//   (e) => {
//     if (touchHappened) return;
//     e.preventDefault();
//     const modal = document.querySelector('.modal[style*="display: block"]');
//     if (modal) hideModal(modal);
//   },
//   { passive: false }
// );

// document.querySelectorAll(".modal-exit-button").forEach((button) => {
//   function handleModalExit(e) {
//     e.preventDefault();
//     const modal = e.target.closest(".modal");

//     gsap.to(button, {
//       scale: 15,
//       duration: 1.5,
//       ease: "back.out(2)",
//       onStart: () => {
//         gsap.to(button, {
//           scale: 15,
//           duration: 1.5,
//           ease: "back.out(2)",
//           onComplete: () => {
//             gsap.set(button, {
//               clearProps: "all",
//             });
//           },
//         });
//       },
//     });

//     buttonSounds.click.play();
//     hideModal(modal);
//   }

//   button.addEventListener(
//     "touchend",
//     (e) => {
//       touchHappened = true;
//       handleModalExit(e);
//     },
//     { passive: true}
//   );

//   button.addEventListener(
//     "click",
//     (e) => {
//       if (touchHappened) return;
//       handleModalExit(e);
//     },
//     { passive: false }
//   );
// });

// let isModalOpen = true;

// const showModal = (modal) => {
//   modal.style.display = "block";
//   overlay.style.display = "block";

//   isModalOpen = true;
//   controls.enabled = false;

//   if (currentHoveredObject) {
//     playHoverAnimation(currentHoveredObject, false);
//     currentHoveredObject = null;
//   }
//   document.body.style.cursor = "default";
//   currentIntersects = [];

//   gsap.set(modal, {
//     opacity: 0,
//     scale: 0,
//   });
//   gsap.set(overlay, {
//     opacity: 0,
//   });

//   gsap.to(overlay, {
//     opacity: 1,
//     duration: 0.5,
//   });

//   gsap.to(modal, {
//     opacity: 1,
//     scale: 1,
//     duration: 0.5,
//     ease: "back.out(2)",
//   });
// };

// const hideModal = (modal) => {
//   isModalOpen = false;
//   controls.enabled = true;

//   gsap.to(overlay, {
//     opacity: 0,
//     duration: 0.5,
//   });

//   gsap.to(modal, {
//     opacity: 0,
//     scale: 0,
//     duration: 0.5,
//     ease: "back.in(2)",
//     onComplete: () => {
//       modal.style.display = "none";
//       overlay.style.display = "none";
//     },
//   });
// };

/**  -------------------------- Loading Screen & Intro Animation -------------------------- */
 

const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-screen-button");
const desktopInstructions = document.querySelector(".desktop-instructions");
const mobileInstructions = document.querySelector(".mobile-instructions");

manager.onLoad = function () {
  // loadingScreenButton.style.border = "8px solidrgb(15, 57, 78)";
  // loadingScreenButton.style.background = "#401d49";
  // loadingScreenButton.style.color = "#e6dede";
  // loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
  loadingScreenButton.textContent = "Войти";
  loadingScreenButton.style.cursor = "pointer";
  // loadingScreenButton.style.transition =
  //   "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  function handleEnter() {
    if (isDisabled) return;

    // loadingScreenButton.style.cursor = "default";
    // loadingScreenButton.style.border = "8px solidrgb(179, 163, 229)";
    // loadingScreenButton.style.background = "#c9dbf2";
    // loadingScreenButton.style.color = "#6e5e9c";
    // loadingScreenButton.style.boxShadow = "none";
    // loadingScreenButton.textContent = "Welcome";
    // loadingScreen.style.background = "#c9dbf2";
    // desktopInstructions.style.color = "#6e5e9c";
    // mobileInstructions.style.color = "#6e5e9c";
    isDisabled = false;

    toggleFavicons();
    backgroundMusic.play();
    playReveal();
  }

//   manager.onLoad = function () {
//   loadingScreen.style.display = "none"; // Hide the loading screen immediately
//   toggleFavicons();
//   backgroundMusic.play();
//   playReveal();
// };


  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter();
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });
};

function playReveal() {
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.9,
    duration: 1.2,
    delay: 0.1,
    // ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      // transform: "perspective(1000px) rotateX(50deg) rotateY(55deg)",
      duration: 1.2,
      // ease: "back.in(2.8)",
      onComplete: () => {
        isModalOpen = false;
        playIntroAnimation();
        loadingScreen.remove();
      },
    },
    // "-=0.1"
  );
}

function playIntroAnimation() {
  const t1 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(0.8)",
    },
  });
  t1.timeScale(0.8);

  t1.to(plank1.scale, {
    x: 1,
    y: 1,
  })
    .to(
      plank2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      workBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      aboutBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      contactBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    );

  const tFrames = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFrames.timeScale(0.8);

  tFrames
    .to(frame1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      frame2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      frame3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const t2 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t2.timeScale(0.8);

  t2.to(boba.scale, {
    z: 1,
    y: 1,
    x: 1,
    delay: 0.4,
  })
    .to(
      github.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      youtube.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      twitter.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    );

  const tFlowers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFlowers.timeScale(0.8);

  tFlowers
    .to(flower5.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      flower4.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower1.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tBoxes = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tBoxes.timeScale(0.8);

  tBoxes
    .to(box1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      box2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      box3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tLamp = gsap.timeline({
    defaults: {
      duration: 0.8,
      delay: 0.2,
      ease: "back.out(1.8)",
    },
  });
  tLamp.timeScale(0.8);

  tLamp.to(lamp.scale, {
    x: 1,
    y: 1,
    z: 1,
  });

  const tSlippers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tSlippers.timeScale(0.8);

  tSlippers
    .to(slippers1.scale, {
      x: 1,
      y: 1,
      z: 1,
      delay: 0.5,
    })
    .to(
      slippers2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tEggs = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tEggs.timeScale(5.8);

  tEggs
    to(
      name.scale,
      {
        x: 5,
        y: 5,
        z: 5,
      },
      "-=5.5"
    );

  const tFish = gsap.timeline({
    defaults: {
      delay: 0.8,
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFish.timeScale(0.8);

  tFish.to(fish.scale, {
    x: 1,
    y: 1,
    z: 1,
  });

  const lettersTl = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.7)",
    },
  });
  lettersTl.timeScale(0.8);

  lettersTl
    .to(letter1.position, {
      y: letter1.userData.initialPosition.y + 0.3,
      duration: 0.4,
      ease: "back.out(1.8)",
      delay: 0.25,
    })
    .to(
      letter1.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter1.position,
      {
        y: letter1.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter2.position,
      {
        y: letter2.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter2.position,
      {
        y: letter2.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter3.position,
      {
        y: letter3.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter3.position,
      {
        y: letter3.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter4.position,
      {
        y: letter4.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter4.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter4.position,
      {
        y: letter4.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter5.position,
      {
        y: letter5.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter5.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter5.position,
      {
        y: letter5.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter6.position,
      {
        y: letter6.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter6.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter6.position,
      {
        y: letter6.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter7.position,
      {
        y: letter7.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter7.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter7.position,
      {
        y: letter7.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter8.position,
      {
        y: letter8.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter8.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter8.position,
      {
        y: letter8.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    );

  const pianoKeysTl = gsap.timeline({
    defaults: {
      duration: 0.4,
      ease: "back.out(1.7)",
    },
  });
  pianoKeysTl.timeScale(1.2);

  const pianoKeys = [
    C1_Key,
    Cs1_Key,
    D1_Key,
    Ds1_Key,
    E1_Key,
    F1_Key,
    Fs1_Key,
    G1_Key,
    Gs1_Key,
    A1_Key,
    As1_Key,
    B1_Key,
    C2_Key,
    Cs2_Key,
    D2_Key,
    Ds2_Key,
    E2_Key,
    F2_Key,
    Fs2_Key,
    G2_Key,
    Gs2_Key,
    A2_Key,
    As2_Key,
    B2_Key,
  ];

  pianoKeys.forEach((key, index) => {
    pianoKeysTl
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y + 0.2,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        index * 0.1
      )
      .to(
        key.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        "<"
      )
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        ">-0.2"
      );
  });
}

/**  -------------------------- Loaders & Texture Preparations -------------------------- */
const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);



const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/skybox/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

const textureMap = {
  First: {
    
    night: "/textures/room/night/first_texture_set_night.webp",
    day: "/textures/room/day/first_texture_set_day.webp",
  },
  Second: {
    
    night: "/textures/room/night/second_texture_set_night.webp",
    day: "/textures/room/day/second_texture_set_day.webp",
  },
  Third: {
    
    night: "/textures/room/night/third_texture_set_night.webp",
    day: "/textures/room/day/third_texture_set_day.webp",
  },
  Fourth: {
    
    night: "/textures/room/night/fourth_texture_set_night.webp",
    day: "/textures/room/day/fourth_texture_set_day.webp",
  },
};

const loadedTextures = {
  
  night: {},
  day: {},
};

Object.entries(textureMap).forEach(([key, paths]) => {
  
  // Load and configure night texture
  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.minFilter = THREE.LinearFilter;
  nightTexture.magFilter = THREE.LinearFilter;
  loadedTextures.night[key] = nightTexture;


  // Load and configure day texture
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;
  loadedTextures.day[key] = nightTexture;
});

// Reuseable Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  color: 0xfbfbfb,
  metalness: 0,
  roughness: 0,
  ior: 3,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
  specularColor: 0xfbfbfb,
});

const whiteMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const createMaterialForTextureSet = (textureSet) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture1: { value: loadedTextures.day.First },
      uNightTexture1: { value: loadedTextures.night.First },
      uDayTexture2: { value: loadedTextures.day.Second },
      uNightTexture2: { value: loadedTextures.night.Second },
      uDayTexture3: { value: loadedTextures.day.Third },
      uNightTexture3: { value: loadedTextures.night.Third },
      uDayTexture4: { value: loadedTextures.day.Fourth },
      uNightTexture4: { value: loadedTextures.night.Fourth },
      uMixRatio: { value: 0 },
      uTextureSet: { value: textureSet },
    },
    vertexShader: themeVertexShader,
    fragmentShader: themeFragmentShader,
  });

  Object.entries(material.uniforms).forEach(([key, uniform]) => {
    if (uniform.value instanceof THREE.Texture) {
      uniform.value.minFilter = THREE.LinearFilter;
      uniform.value.magFilter = THREE.LinearFilter;
    }
  });

  return material;
};

const roomMaterials = {
  First: createMaterialForTextureSet(1),
  Second: createMaterialForTextureSet(2),
  Third: createMaterialForTextureSet(3),
  Fourth: createMaterialForTextureSet(4),
};

// Smoke Shader setup
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(1.33, 2, 1.33);

const perlinTexture = textureLoader.load("/shaders/perlin2.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 2.4;
smoke.position.x = 5.5;
smoke.position.z =  - 1.7;
scene.add(smoke);

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Screen.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false;




const ambientLight = new THREE.AmbientLight(0xffffff, 8.4); // soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 6.8);
directionalLight.position.set(5, 10, 7.5); // x, y, z position
scene.add(directionalLight);


/**  -------------------------- Model and Mesh Setup -------------------------- */

// LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
// let strong
let fish;
let coffeePosition;
let hourHand;
let minuteHand;
let chairTop;
const xAxisFans = [];
const yAxisFans = [];
let plank1,
  plank2,
  workBtn,
  aboutBtn,
  contactBtn,
  boba,
  github,
  youtube,
  twitter;

let letter1, letter2, letter3, letter4, letter5, letter6, letter7, letter8;

let C1_Key,
  Cs1_Key,
  D1_Key,
  Ds1_Key,
  E1_Key,
  F1_Key,
  Fs1_Key,
  G1_Key,
  Gs1_Key,
  A1_Key,
  As1_Key,
  B1_Key;
let C2_Key,
  Cs2_Key,
  D2_Key,
  Ds2_Key,
  E2_Key,
  F2_Key,
  Fs2_Key,
  G2_Key,
  Gs2_Key,
  A2_Key,
  As2_Key,
  B2_Key;

let flower1, flower2, flower3, flower4, flower5;

let box1, box2, box3;

let lamp;

let slippers1, slippers2;

let egg1, egg2, egg3;

let frame1, frame2, frame3 ;



// const model = new THREE.Group();
// model.add(chairTop);
// scene.add(model)



loader.load("/models/Room_Portfolio4.glb", (glb) => {
  roomScene = glb.scene; 
  baseY = roomScene.position.y;
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("Box008")) {
        fish = child;
        child.position.x += 0.0001;
        // child.position.z -= 0.03;
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }
      if (child.name.includes("Master_chair")) {
        chairTop = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Hour_Hand")) {
        hourHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Name")) {
        minuteHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Name")) {
        coffeePosition = child.position.clone();
      }

      if (child.name.includes("Raycaster")) {
        raycasterObjects.push(child);
      }

      if (child.name.includes("Hover") || child.name.includes("Key")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      // LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
      if (child.name.includes("Hanging_Plank_1")) {
        plank1 = child;
        child.scale.set(0, 0, 1);
      } else if (child.name.includes("Hanging_Plank_2")) {
        plank2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("My_Work_Button")) {
        workBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("About_Button")) {
        aboutBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Contact_Button")) {
        contactBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Boba")) {
        boba = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("GitHub")) {
        github = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("YouTube")) {
        youtube = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Twitter")) {
        twitter = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_1")) {
        letter1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_2")) {
        letter2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_3")) {
        letter3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_4")) {
        letter4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_5")) {
        letter5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_6")) {
        letter6 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_7")) {
        letter7 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_8")) {
        letter8 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_1")) {
        flower1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_2")) {
        flower2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_3")) {
        flower3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_4")) {
        flower4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_5")) {
        flower5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_1")) {
        box1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_2")) {
        box2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_3")) {
        box3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lamp")) {
        lamp = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_1")) {
        slippers1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_2")) {
        slippers2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Fish_Fourth")) {
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_1")) {
        egg1 = child;
        child.scale.set(0, 0, 0);
      } 
       else if (child.name.includes("Frame_1")) {
        frame1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_2")) {
        frame2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_3")) {
        frame3 = child;
        child.scale.set(0, 0, 0);
      }
      Object.keys(pianoKeyMap).forEach((keyName) => {
        if (child.name.includes(keyName)) {
          const varName = keyName.replace("#", "s").split("_")[0] + "_Key";
          eval(`${varName} = child`);
          child.scale.set(0, 0, 0);
          child.userData.initialPosition = new THREE.Vector3().copy(
            child.position
          );
        }
      });

      if (child.name.includes("Water")) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x558bc8,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        });
      } else if (child.name.includes("Glass")) {
        child.material = glassMaterial;
      } else if (child.name.includes("Bubble")) {
        child.material = whiteMaterial;
      } else if (child.name.includes("Screen")) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: true,
          opacity: 0.9,
        });
      } else {
        Object.keys(textureMap).forEach((key) => {
          if (child.name.includes(key)) {
            child.material = roomMaterials[key];

            if (child.name.includes("name")) {
              if (
                child.name.includes("nme") ||
                child.name.includes("mane")
              ) {
                xAxisFans.push(child);
              } else {
                yAxisFans.push(child);
              }
            }
          }
        });
      }
    }
     if (child.name === "Object006") {
    // Create a new point light
    const pointLight = new THREE.PointLight(0xffff00, 6, 290);
    
    // Set position using the child’s position relative to its parent
    child.updateWorldMatrix(true, false);
    child.getWorldPosition(pointLight.position);

    scene.add(pointLight);
    pointLight.position.y += 5.0;
    pointLight.position.z += 2.2;
    pointLight.position.x += 5.2;

    // Optional: visualize the light position
    const helper = new THREE.PointLightHelper(pointLight, 0.3);
    // scene.add(helper);
  }
  
  });

  if (coffeePosition) {
    smoke.position.set(
      coffeePosition.x,
      coffeePosition.y + 0.2,
      coffeePosition.z
    ); 
    // glb.scene.position.x += -8.2;
    // 
    // glb.scene.position.z += 20;
  }
  



 
  glb.scene.position.x += 5.2;
  // glb.scene.position.y += -5.2;

  if (window.innerWidth < 768) {
    // glb.scene.position.y += - 2;
  }

  
  scene.add(glb.scene);
  scene.add(roomScene);
});

/**  -------------------------- Raycaster setup -------------------------- */

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const socialLinks = {
  GitHub: "https://github.com/andrewwoan/sooahkimsfolio",
  YouTube: "https://youtu.be/AB6sulUMRGE",
  Twitter: "https://www.twitter.com/",
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    if (object.name.includes("Button")) {
      buttonSounds.click.play();
    }

    Object.entries(pianoKeyMap).forEach(([keyName, soundKey]) => {
      if (object.name.includes(keyName)) {
        if (pianoDebounceTimer) {
          clearTimeout(pianoDebounceTimer);
        }

        fadeOutBackgroundMusic();

        pianoSounds[soundKey].play();

        pianoDebounceTimer = setTimeout(() => {
          fadeInBackgroundMusic();
        }, PIANO_TIMEOUT);

        gsap.to(object.rotation, {
          x: object.userData.initialRotation.x + Math.PI / 42,
          duration: 0.4,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.to(object.rotation, {
              x: object.userData.initialRotation.x,
              duration: 0.25,
              ease: "back.out(2)",
            });
          },
        });
      }
    });

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    if (object.name.includes("Work_Button")) {
      showModal(modals.work);
    } else if (object.name.includes("About_Button")) {
      showModal(modals.about);
    } else if (object.name.includes("Contact_Button")) {
      showModal(modals.contact);
    }
  }
}

function playHoverAnimation(object, isHovering) {
  let scale = 1.4;
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (object.name.includes("name")) {
    gsap.killTweensOf(smoke.scale);
    if (isHovering) {
      gsap.to(smoke.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else {
      gsap.to(smoke.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }

  if (object.name.includes("Fish")) {
    scale = 1.2;
  }

  if (isHovering) {
    // Scale animation for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scale,
      y: object.userData.initialScale.y * scale,
      z: object.userData.initialScale.z * scale,
      duration: 0.5,
      ease: "back.out(2)",
    });

    if (object.name.includes("About_Button")) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x - Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else if (
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y + 0.2,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }
  } else {
    // Reset scale for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "back.out(2)",
    });

    if (
      object.name.includes("About_Button") ||
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }
}

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
});

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    handleRaycasterInteraction();
  },
  { passive: false }
);

window.addEventListener("click", handleRaycasterInteraction);

// Other Event Listeners
const themeToggleButton = document.querySelector(".theme-toggle-button");
const muteToggleButton = document.querySelector(".mute-toggle-button");
const sunSvg = document.querySelector(".sun-svg");
const moonSvg = document.querySelector(".moon-svg");
const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

const updateMuteState = (muted) => {
  if (muted) {
    backgroundMusic.volume(0);
  } else {
    backgroundMusic.volume(BACKGROUND_MUSIC_VOLUME);
  }

  buttonSounds.click.mute(muted);
  Object.values(pianoSounds).forEach((sound) => {
    sound.mute(muted);
  });
};

const handleMuteToggle = (e) => {
  e.preventDefault();

  isMuted = !isMuted;
  updateMuteState(isMuted);
  buttonSounds.click.play();

  gsap.to(muteToggleButton, {
    rotate: -45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.style.display = "none";
        soundOnSvg.style.display = "block";
      } else {
        soundOnSvg.style.display = "none";
        soundOffSvg.style.display = "block";
      }

      gsap.to(muteToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(muteToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });
};

let isMuted = false;
muteToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleMuteToggle(e);
  },
  { passive: false }
);

muteToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleMuteToggle(e);
  },
  { passive: false }
);

// Themeing stuff
const toggleFavicons = () => {
  const isDark = document.body.classList.contains("dark-theme");
  const theme = isDark ? "light" : "dark";

  document.querySelector(
    'link[sizes="96x96"]'
  ).href = `media/${theme}-favicon/favicon-96x96.png`;
  document.querySelector(
    'link[type="image/svg+xml"]'
  ).href = `/media/${theme}-favicon/favicon.svg`;
  document.querySelector(
    'link[rel="shortcut icon"]'
  ).href = `media/${theme}-favicon/favicon.ico`;
  document.querySelector(
    'link[rel="apple-touch-icon"]'
  ).href = `media/${theme}-favicon/apple-touch-icon.png`;
  document.querySelector(
    'link[rel="manifest"]'
  ).href = `media/${theme}-favicon/site.webmanifest`;
};

let isNightMode = false;

const handleThemeToggle = (e) => {
  e.preventDefault();
  toggleFavicons();

  const isDark = document.body.classList.contains("dark-theme");
  document.body.classList.remove(isDark ? "dark-theme" : "light-theme");
  document.body.classList.add(isDark ? "light-theme" : "dark-theme");

  isNightMode = !isNightMode;
  buttonSounds.click.play();

  gsap.to(themeToggleButton, {
    rotate: 45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (isNightMode) {
        sunSvg.style.display = "none";
        moonSvg.style.display = "block";
      } else {
        moonSvg.style.display = "none";
        sunSvg.style.display = "block";
      }

      gsap.to(themeToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(themeToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });

  Object.values(roomMaterials).forEach((material) => {
    gsap.to(material.uniforms.uMixRatio, {
      value: isNightMode ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
  });
};

// Click event listener
themeToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleThemeToggle(e);
  },
  { passive: false }
);

themeToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleThemeToggle(e);
  },
  { passive: false }
);

/**  -------------------------- Render and Animations Stuff -------------------------- */
const clock = new THREE.Clock();


function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  if (roomScene) {
    roomScene.position.y = Math.sin(time * 0.5) * 0.2 + baseY;
    roomScene.rotation.y = Math.sin(time * 0.3) * 0.02;
  }



  controls.update();
  renderer.render(scene, camera);
}











const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

  const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

  minuteHand.rotation.x = -minuteAngle;
  hourHand.rotation.x = -hourAngle;
};

const render = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  // Update Shader Univform
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  //Update Orbit Controls
  controls.update();

  // Update Clock hand rotation
  updateClockHands();

  // Fan rotate animation
  xAxisFans.forEach((fan) => {
    fan.rotation.x -= 0.04;
  });

  yAxisFans.forEach((fan) => {
    fan.rotation.y -= 0.04;
  });

  // Chair rotate animation
  if (chairTop) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;

    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 0.5) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);

    chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
  }

  // Fish up and down animation
  if (fish) {
    const time = timestamp * 0.0015;
    const amplitude = 0.12;
    const position =
      amplitude * Math.sin(time) * (1 - Math.abs(Math.sin(time)) * 0.1);
    fish.position.y = fish.userData.initialPosition.y + position;
  }

  // function animate() {
  //   requestAnimationFrame(animate);
  //   renderer.render(scene, camera);
  // }
  // animate();



// model.rotation.y += 0.01;


// document.getElementById('tablet2').addEventListener('click', () => {
//     // Simple animation: rotate Y by 45 degrees over 0.5s
//     const targetRotation = strong.rotation.y + Math.PI * 1.2;
//     const duration = 500;
//     const start = performance.now();
  
//     function rotate(time) {
//       const elapsed = time - start;
//       const progress = Math.min(elapsed / duration, 10);
//       strong.rotation.y = THREE.MathUtils.lerp(strong.rotation.y, targetRotation, progress);
//       if (progress < 1) requestAnimationFrame(rotate);
//     }
  
//     requestAnimationFrame(rotate);
// });





  // Raycaster
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera);

    // Get all the objects the raycaster is currently shooting through / intersecting with
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    for (let i = 0; i < currentIntersects.length; i++) {}

    if (currentIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;

      if (currentIntersectObject.name.includes("Hover")) {
        if (currentIntersectObject !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }

          playHoverAnimation(currentIntersectObject, true);
          currentHoveredObject = currentIntersectObject;
        }
      }

      if (currentIntersectObject.name.includes("Pointer")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

render();
