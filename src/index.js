import * as THREE from 'three';

import { GUI } from './jsm/libs/dat.gui.module.js';

import { FirstPersonControls } from './jsm/controls/FirstPersonControls.js';

let camera, controls, scene, renderer, light;

let material1, material2;

let analyser1, analyser2;

const clock = new THREE.Clock();

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {

    const overlay = document.getElementById('overlay');
    overlay.remove();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 25, 0);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0025);

    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0.5, 1).normalize();
    scene.add(light);

    const sphere = new THREE.SphereGeometry(20, 32, 16);
    const cube = new THREE.BoxGeometry (20,20,30);

    material1 = new THREE.MeshPhongMaterial({ color: 0xffaa00, flatShading: true, shininess: 0 });
    material2 = new THREE.MeshPhongMaterial({ color: 0xff2200, flatShading: true, shininess: 0 });
    

    // sound spheres

    const audioLoader = new THREE.AudioLoader();

    const mesh1 = new THREE.Mesh(cube, material1);
    mesh1.position.set(190, 0, 0);
    scene.add(mesh1);

    const sound1 = new THREE.PositionalAudio(listener);
    audioLoader.load('sounds/gruppo.mp3', function (buffer) {

        sound1.setBuffer(buffer);
        sound1.setLoop(true);
        sound1.setRefDistance(20);
        sound1.play();

    });
    mesh1.add(sound1);

    //

    const mesh2 = new THREE.Mesh(sphere, material2);
    mesh2.position.set(240, 20, 0);
    scene.add(mesh2);

    const sound2 = new THREE.PositionalAudio(listener);
    audioLoader.load('sounds/luTip.mp3', function (buffer) {

        sound2.setBuffer(buffer);
        sound2.setRefDistance(20);
        sound2.play();

    });
    mesh2.add(sound2);


    // analysers

    analyser1 = new THREE.AudioAnalyser(sound1, 32);
    analyser2 = new THREE.AudioAnalyser(sound2, 32);

    // global ambient audio

    /* const sound4 = new THREE.Audio(listener);
    audioLoader.load('sounds/gruppo.mp3', function (buffer) {

        sound4.setBuffer(buffer);
        sound4.setLoop(true);
        sound4.setVolume(0.5);
        sound4.play();

    }); */

    // ground

    const helper = new THREE.GridHelper(1000, 10, 0x444444, 0x444444);
    helper.position.y = 0.1;
    scene.add(helper);

    //

    const SoundControls = function () {

        this.master = listener.getMasterVolume();
        this.gruppo = sound1.getVolume();
        this.cecchino = sound2.getVolume();
        // this.Ambient = sound4.getVolume();

    };

    const gui = new GUI();
    const soundControls = new SoundControls();
    const volumeFolder = gui.addFolder('sound volume');

    volumeFolder.add(soundControls, 'master').min(0.0).max(1.0).step(0.01).onChange(function () {

        listener.setMasterVolume(soundControls.master);

    });
    volumeFolder.add(soundControls, 'gruppo').min(0.0).max(1.0).step(0.01).onChange(function () {

        sound1.setVolume(soundControls.gruppo);

    });
    volumeFolder.add(soundControls, 'cecchino').min(0.0).max(1.0).step(0.01).onChange(function () {

        sound2.setVolume(soundControls.cecchino);

    });

    /* volumeFolder.add(soundControls, 'Ambient').min(0.0).max(1.0).step(0.01).onChange(function () {

        sound4.setVolume(soundControls.Ambient);

    }); */
    volumeFolder.open();

    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //

    controls = new FirstPersonControls(camera, renderer.domElement);

    controls.movementSpeed = 70;
    controls.lookSpeed = 0.05;
    controls.noFly = true;
    controls.lookVertical = false;

    //

    window.addEventListener('resize', onWindowResize);

    animate();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();

}

function animate() {

    requestAnimationFrame(animate);
    render();

}


function render() {

    const delta = clock.getDelta();

    controls.update(delta);

    material1.emissive.b = analyser1.getAverageFrequency() / 256;
    material2.emissive.b = analyser2.getAverageFrequency() / 256;

    renderer.render(scene, camera);

}