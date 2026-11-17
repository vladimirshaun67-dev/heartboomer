
"use strict";

/* =========================================
   BEYOND THE HEART
   Canvas Particle & Energy Engine
========================================= */

const canvas = document.getElementById("universe");
const ctx = canvas.getContext("2d");

const intro = document.getElementById("intro");
const finalMessage = document.getElementById("finalMessage");

const startButton = document.getElementById("startButton");
const replayButton = document.getElementById("replayButton");

const envelopeButton = document.getElementById("envelopeButton");
const letterOverlay = document.getElementById("letterOverlay");
const closeLetter = document.getElementById("closeLetter");
const letterContent = document.getElementById("letterContent");

let W, H, CX, CY;
let animationFrame;

let particles = [];
let stars = [];
let lasers = [];
let shockwaves = [];
let miniHearts = [];
let electricArcs = [];
let rings = [];

let phase = "idle";
let startTime = 0;
let lastTime = 0;
let elapsed = 0;

let letterTimer = null;

const CONFIG = {
    particleCount: 900,
    starCount: 180,
    miniHeartCount: 260,
    colors: [
        "#ff174f",
        "#ff3e79",
        "#ff75a3",
        "#ffb4d0",
        "#ffffff"
    ]
};

/* =========================================
   CANVAS SETUP
========================================= */

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    CX = W / 2;
    CY = H / 2;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (phase === "idle") {
        createStars();
    }
}

window.addEventListener("resize", resize);

/* =========================================
   UTILITIES
========================================= */

const random = (min, max) =>
    Math.random() * (max - min) + min;

const clamp = (v, min, max) =>
    Math.max(min, Math.min(max, v));

const lerp = (a, b, t) =>
    a + (b - a) * t;

const easeOut = t =>
    1 - Math.pow(1 - clamp(t, 0, 1), 3);

const easeInOut = t =>
    t < .5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* =========================================
   STAR FIELD
========================================= */

function createStars() {
    stars = [];

    for (let i = 0; i < CONFIG.starCount; i++) {
        stars.push({
            x: random(0, W),
            y: random(0, H),
            radius: random(.3, 1.7),
            alpha: random(.15, .8),
            speed: random(.3, 1.5),
            offset: random(0, 6)
        });
    }
}

function drawStars(time) {
    for (const star of stars) {
        const twinkle =
            .5 + Math.sin(time * star.speed + star.offset) * .5;

        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

/* =========================================
   ENERGY CORE
========================================= */

function drawCore(time, intensity = 1) {

    const pulse = 1 + Math.sin(time * .006) * .12;

    const radius = 8 * pulse * intensity;

    const glow = ctx.createRadialGradient(
        CX, CY, 0,
        CX, CY, 100 * intensity
    );

    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(.08, "rgba(255,60,110,.9)");
    glow.addColorStop(.35, "rgba(255,20,90,.25)");
    glow.addColorStop(1, "rgba(255,20,90,0)");

    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(CX, CY, 100 * intensity, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ff2768";
    ctx.shadowBlur = 30;

    ctx.beginPath();
    ctx.arc(CX, CY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}

/* =========================================
   ROTATING ENERGY RINGS
========================================= */

function createRings() {
    rings = [];

    for (let i = 0; i < 5; i++) {
        rings.push({
            radius: 25 + i * 18,
            angle: random(0, Math.PI * 2),
            speed: random(-.025, .025),
            opacity: random(.25, .65)
        });
    }
}

function drawRings() {
    for (const ring of rings) {

        ring.angle += ring.speed;

        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(ring.angle);

        ctx.strokeStyle = `rgba(255,70,130,${ring.opacity})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.ellipse(
            0, 0,
            ring.radius,
            ring.radius * .35,
            0, 0, Math.PI * 2
        );
        ctx.stroke();

        ctx.restore();
    }
}

/* =========================================
   LASER SYSTEM
========================================= */

function createLasers() {
    lasers = [];

    for (let i = 0; i < 28; i++) {
        const angle = (Math.PI * 2 / 28) * i;

        lasers.push({
            angle,
            length: random(100, Math.max(W, H) * .8),
            width: random(.5, 2),
            opacity: random(.2, .8),
            speed: random(2, 7),
            progress: 0
        });
    }
}

function drawLasers(time) {

    for (const laser of lasers) {

        const distance = laser.length * laser.progress;

        const x = CX + Math.cos(laser.angle) * distance;
        const y = CY + Math.sin(laser.angle) * distance;

        const gradient = ctx.createLinearGradient(
            CX, CY, x, y
        );

        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(.2, "#ff3b78");
        gradient.addColorStop(1, "rgba(255,40,100,0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = laser.width;
        ctx.globalAlpha = laser.opacity;

        ctx.shadowColor = "#ff286b";
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(x, y);
        ctx.stroke();

        laser.progress = Math.min(
            1,
            laser.progress + .018 * laser.speed
        );
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

/* =========================================
   MATHEMATICAL HEART SHAPE
========================================= */

function heartPoint(t, scale) {

    const x = 16 * Math.pow(Math.sin(t), 3);

    const y =
        13 * Math.cos(t)
        - 5 * Math.cos(2 * t)
        - 2 * Math.cos(3 * t)
        - Math.cos(4 * t);

    return {
        x: CX + x * scale,
        y: CY - y * scale
    };
}

/* =========================================
   PARTICLE HEART CONSTRUCTION
========================================= */

function createHeartParticles() {

    particles = [];

    const maxScale = Math.min(W * .021, H * .022, 17);

    for (let i = 0; i < CONFIG.particleCount; i++) {

        const t = Math.random() * Math.PI * 2;

        const target = heartPoint(
            t,
            maxScale
        );

        const inside = Math.random();

        const centerX = CX + (target.x - CX) * inside;
        const centerY = CY + (target.y - CY) * inside;

        particles.push({

            x: CX + random(-20, 20),
            y: CY + random(-20, 20),

            startX: CX + random(-20, 20),
            startY: CY + random(-20, 20),

            targetX: centerX,
            targetY: centerY,

            size: random(.8, 2.5),

            color: CONFIG.colors[
                Math.floor(Math.random() * CONFIG.colors.length)
            ],

            delay: random(0, 1),
            progress: 0,

            speed: random(.6, 1.4),

            angle: random(0, Math.PI * 2),

            drift: random(2, 10)
        });
    }
}

function drawHeartParticles(globalProgress) {

    for (const p of particles) {

        const localProgress = clamp(
            (globalProgress - p.delay * .35) /
            (1 - p.delay * .35),
            0, 1
        );

        const eased = easeInOut(localProgress);

        p.x = lerp(
            p.startX,
            p.targetX,
            eased
        );

        p.y = lerp(
            p.startY,
            p.targetY,
            eased
        );

        const shimmer =
            .65 + Math.sin(elapsed * .005 + p.angle) * .35;

        ctx.globalAlpha = shimmer;

        ctx.fillStyle = p.color;

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

/* =========================================
   HEART OUTLINE GLOW
========================================= */

function drawHeartOutline() {

    const scale = Math.min(W * .021, H * .022, 17);

    ctx.beginPath();

    for (let i = 0; i <= 300; i++) {

        const t = (i / 300) * Math.PI * 2;

        const p = heartPoint(t, scale);

        if (i === 0) {
            ctx.moveTo(p.x, p.y);
        } else {
            ctx.lineTo(p.x, p.y);
        }
    }

    ctx.closePath();

    ctx.strokeStyle = "#ff4c83";
    ctx.lineWidth = 2;

    ctx.shadowColor = "#ff174f";
    ctx.shadowBlur = 25;

    ctx.stroke();

    ctx.shadowBlur = 0;
}

/* =========================================
   ELECTRIC ARCS
========================================= */

function createElectricArcs() {

    electricArcs = [];

    for (let i = 0; i < 14; i++) {

        electricArcs.push({
            angle: random(0, Math.PI * 2),
            radius: random(40, 130),
            life: random(10, 30),
            maxLife: 30,
            offset: random(0, 100)
        });
    }
}

function drawElectricArcs() {

    for (const arc of electricArcs) {

        arc.life--;

        if (arc.life <= 0) {
            arc.angle = random(0, Math.PI * 2);
            arc.radius = random(40, 130);
            arc.life = arc.maxLife;
        }

        const startX =
            CX + Math.cos(arc.angle) * arc.radius;

        const startY =
            CY + Math.sin(arc.angle) * arc.radius;

        ctx.strokeStyle = "rgba(255,180,220,.85)";
        ctx.lineWidth = 1.5;

        ctx.shadowColor = "#ff3b83";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        let x = startX;
        let y = startY;

        for (let j = 0; j < 5; j++) {

            x += random(-15, 15);
            y += random(-15, 15);

            ctx.lineTo(x, y);
        }

        ctx.stroke();
    }

    ctx.shadowBlur = 0;
}

/* =========================================
   SHOCKWAVE
========================================= */

function createShockwave() {

    shockwaves.push({
        radius: 5,
        opacity: 1,
        speed: 15
    });
}

function drawShockwaves() {

    for (let i = shockwaves.length - 1; i >= 0; i--) {

        const wave = shockwaves[i];

        wave.radius += wave.speed;
        wave.opacity -= .012;

        ctx.beginPath();

        ctx.arc(
            CX,
            CY,
            wave.radius,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            `rgba(255,70,140,${wave.opacity})`;

        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff286b";
        ctx.shadowBlur = 20;

        ctx.stroke();

        if (wave.opacity <= 0) {
            shockwaves.splice(i, 1);
        }
    }

    ctx.shadowBlur = 0;
}

/* =========================================
   MINI HEART EXPLOSION
========================================= */

function createMiniHearts() {

    miniHearts = [];

    for (let i = 0; i < CONFIG.miniHeartCount; i++) {

        const angle = random(0, Math.PI * 2);
        const speed = random(2, 12);

        miniHearts.push({

            x: CX,
            y: CY,

            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,

            size: random(3, 9),

            rotation: random(0, Math.PI * 2),
            rotationSpeed: random(-.08, .08),

            life: 1,

            color: CONFIG.colors[
                Math.floor(Math.random() * CONFIG.colors.length)
            ]
        });
    }
}

function drawMiniHearts() {

    for (let i = miniHearts.length - 1; i >= 0; i--) {

        const p = miniHearts[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= .985;
        p.vy *= .985;

        p.vy += .025;

        p.rotation += p.rotationSpeed;
        p.life -= .006;

        ctx.save();

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        ctx.globalAlpha = Math.max(0, p.life);

        ctx.fillStyle = p.color;

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;

        ctx.font = `${p.size * 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText("♥", 0, 0);

        ctx.restore();

        if (p.life <= 0) {
            miniHearts.splice(i, 1);
        }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

/* =========================================
   PHASE CONTROL
========================================= */

function setPhase(nextPhase) {

    phase = nextPhase;
    startTime = performance.now();
    elapsed = 0;
}

function startSequence() {

    resetSequence();

    intro.classList.add("hidden");

    setPhase("charging");

    createRings();
    createLasers();
    createHeartParticles();
    createElectricArcs();
}

function resetSequence() {

    particles = [];
    lasers = [];
    shockwaves = [];
    miniHearts = [];
    electricArcs = [];
    rings = [];

    finalMessage.classList.remove("show");
    letterOverlay.classList.remove("open");

    clearTimeout(letterTimer);

    letterContent.textContent = "";

    intro.classList.remove("hidden");

    setPhase("idle");

    createStars();
}

/* =========================================
   MAIN ANIMATION ENGINE
========================================= */

function animate(timestamp) {

    animationFrame = requestAnimationFrame(animate);

    const delta = Math.min(timestamp - (lastTime || timestamp), 40);

    lastTime = timestamp;

    elapsed = timestamp - startTime;

    ctx.clearRect(0, 0, W, H);

    drawStars(timestamp * .001);

    switch (phase) {

        case "idle":

            drawCore(timestamp, .5);

            break;

        case "charging":

            drawRings();

            drawCore(timestamp, 1 + Math.min(elapsed / 2000, 1));

            drawElectricArcs();

            if (elapsed > 2500) {
                setPhase("ignition");
            }

            break;

        case "ignition":

            drawCore(timestamp, 2);

            drawLasers(timestamp);

            drawElectricArcs();

            drawRings();

            if (elapsed > 1300) {

                createShockwave();

                setPhase("formation");
            }

            break;

        case "formation":

            drawHeartParticles(
                clamp(elapsed / 4200, 0, 1)
            );

            drawCore(timestamp, .8);

            if (elapsed > 4200) {

                drawHeartOutline();

                setPhase("formed");
            }

            break;

        case "formed":

            drawHeartParticles(1);

            drawHeartOutline();

            drawCore(timestamp, .5);

            drawElectricArcs();

            if (elapsed > 1600) {

                createShockwave();
                createMiniHearts();

                setPhase("explosion");
            }

            break;

        case "explosion":

            drawMiniHearts();

            drawShockwaves();

            drawHeartParticles(1);

            drawHeartOutline();

            if (elapsed > 4500) {

                setPhase("reveal");
            }

            break;

        case "reveal":

            drawMiniHearts();

            drawHeartParticles(1);

            drawHeartOutline();

            drawShockwaves();

            if (elapsed > 700) {

                finalMessage.classList.add("show");
            }

            break;
    }
}

/* =========================================
   INTERACTIVE LETTER
========================================= */

const letter = `
I made another one out of boredom cuz you ain't talking to me:(

Sometimes, the simplest things carry the biggest meaning.

You deserve moments that make you happy,
memories worth keeping,
and people who remind you how special you are.

No matter how ordinary a day may seem,
never forget that you can make it extraordinary.

Keep being yourself.

And remember, there is always something beautiful
waiting beyond the ordinary.

And don't forget what I said last night
you will receive this kind of gifts every year.

♡
`;

function openLetter() {

    letterOverlay.classList.add("open");

    clearTimeout(letterTimer);

    letterContent.textContent = "";

    let index = 0;

    function typeCharacter() {

        if (index < letter.length) {

            letterContent.textContent += letter[index];

            index++;

            letterTimer = setTimeout(typeCharacter, 35);
        }
    }

    typeCharacter();
}

function closeLetterWindow() {

    letterOverlay.classList.remove("open");

    clearTimeout(letterTimer);
}

startButton.addEventListener("click", startSequence);

replayButton.addEventListener("click", startSequence);

envelopeButton.addEventListener("click", openLetter);

closeLetter.addEventListener("click", closeLetterWindow);

letterOverlay.addEventListener("click", (event) => {

    if (event.target === letterOverlay) {
        closeLetterWindow();
    }

});

/* =========================================
   INITIALIZATION
========================================= */

resize();
createStars();

requestAnimationFrame(animate);
