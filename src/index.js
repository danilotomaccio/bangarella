import * as THREE from 'three';

import { GUI } from './jsm/libs/dat.gui.module.js';

import { FirstPersonControls } from './jsm/controls/FirstPersonControls.js';
import { DeviceOrientationControls } from './jsm/controls/DeviceOrientationControls.js';
import { NippleControls } from './jsm/controls/NippleControls.js';

import nipplejs from 'nipplejs';

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
    
    const bangarella = new THREE.BoxGeometry(20, 20, 100);
    const cube = new THREE.BoxGeometry(10, 10, 15);
    
    material1 = new THREE.MeshPhongMaterial({ color: 0xffaa00, flatShading: true, shininess: 0 });
    material2 = new THREE.MeshPhongMaterial({ color: 0xff2200, flatShading: true, shininess: 0 });


    // sound spheres

    const audioLoader = new THREE.AudioLoader();

    const mesh1 = new THREE.Mesh(cube, material1);
    mesh1.position.set(190, 10, 0);
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

    const mesh2 = new THREE.Mesh(bangarella, material2);
    mesh2.position.set(160, 10, 0);
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

    const sound4 = new THREE.Audio(listener);
    audioLoader.load('sounds/folla.mp3', function (buffer) {

        sound4.setBuffer(buffer);
        sound4.setLoop(true);
        sound4.setVolume(0.25);
        sound4.play();

    });

    // ground

    const helper = new THREE.GridHelper(1000, 10, 0x444444, 0x444444);
    helper.position.y = 0.1;
    scene.add(helper);

    //

    const SoundControls = function () {

        this.master = listener.getMasterVolume();
        this.gruppo = sound1.getVolume();
        this.cecchino = sound2.getVolume();
        this.folla = sound4.getVolume();

    };

    const gui = new GUI();
    const soundControls = new SoundControls();
    const volumeFolder = gui.addFolder('Volume');

    volumeFolder.add(soundControls, 'master').min(0.0).max(1.0).step(0.01).onChange(function () {

        listener.setMasterVolume(soundControls.master);

    });
    volumeFolder.add(soundControls, 'gruppo').min(0.0).max(1.0).step(0.01).onChange(function () {

        sound1.setVolume(soundControls.gruppo);

    });
    volumeFolder.add(soundControls, 'cecchino').min(0.0).max(1.0).step(0.01).onChange(function () {

        sound2.setVolume(soundControls.cecchino);

    });

    volumeFolder.add(soundControls, 'folla').min(0.0).max(1.0).step(0.01).onChange(function () {

        sound4.setVolume(soundControls.folla);

    });
    volumeFolder.open();

    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //

    if (isAPC()) {
        controls = new FirstPersonControls(camera, renderer.domElement);
        document.getElementById('dynamic').remove();
    } else {
        // controls = new DeviceOrientationControls(camera, renderer.domElement);
        let dynamic = nipplejs.create({
            zone: document.getElementById('dynamic'),
            color: 'grey'
        });

        controls = new NippleControls(camera, dynamic);
    }

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

function isAPC() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    console.log(check ? 'Is a mobile' : 'Is a pc');
    return !check;
}