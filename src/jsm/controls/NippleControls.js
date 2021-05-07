import {
    EventDispatcher,
    MathUtils,
    Spherical,
    Vector3,
    Quaternion,
    Euler
} from 'three';

/* const _lookDirection = new Vector3();
const _spherical = new Spherical(); */
const _target = new Vector3();

const _zee = new Vector3(0, 0, 1);
const _euler = new Euler();
const _q0 = new Quaternion();
const _q1 = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

const _changeEvent = { type: 'change' };

class NippleControls extends EventDispatcher {

    constructor(object, nipple) {

        super();

        if (nipple === undefined) {

            console.warn('THREE.FirstPersonControls: The second parameter "nipple" is now mandatory.');
            nipple = document;

        }

        const scope = this;

        const EPS = 0.000001;
        const lastQuaternion = new Quaternion();

        this.object = object;
        this.object.rotation.reorder('YXZ');
        this.nipple = nipple;

        // API

        this.enabled = true;

        this.movementSpeed = 1.0;
        this.lookSpeed = 0.005;

        this.lookVertical = true;
        this.autoForward = false;

        this.activeLook = true;

        this.heightSpeed = false;
        this.heightCoef = 1.0;
        this.heightMin = 0.0;
        this.heightMax = 1.0;

        this.constrainVertical = false;
        this.verticalMin = 0;
        this.verticalMax = Math.PI;

        this.mouseDragOn = false;

        // internals

        this.autoSpeedFactor = 0.0;

        /* this.mouseX = 0;
        this.mouseY = 0; */

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.viewHalfX = 0;
        this.viewHalfY = 0;

        // private variables

        let lat = 0;
        let lon = 0;

        /////////////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////////////

        this.deviceOrientation = {};
        this.screenOrientation = 0;

        this.alphaOffset = 0; // radians

        const onDeviceOrientationChangeEvent = function (event) {

            scope.deviceOrientation = event;

        };

        const onScreenOrientationChangeEvent = function () {

            scope.screenOrientation = window.orientation || 0;

        };

        // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

        const setObjectQuaternion = function (quaternion, alpha, beta, gamma, orient) {

            _euler.set(beta, alpha, - gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

            quaternion.setFromEuler(_euler); // orient the device

            quaternion.multiply(_q1); // camera looks out the back of the device, not the top

            quaternion.multiply(_q0.setFromAxisAngle(_zee, - orient)); // adjust for screen orientation

        };

        this.connect = function () {

            onScreenOrientationChangeEvent(); // run once on load

            // iOS 13+

            if (window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function') {

                window.DeviceOrientationEvent.requestPermission().then(function (response) {

                    if (response == 'granted') {

                        window.addEventListener('orientationchange', onScreenOrientationChangeEvent);
                        window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent);

                    }

                }).catch(function (error) {

                    console.error('THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error);

                });

            } else {

                window.addEventListener('orientationchange', onScreenOrientationChangeEvent);
                window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent);

            }

            scope.enabled = true;

        };

        this.disconnect = function () {

            window.removeEventListener('orientationchange', onScreenOrientationChangeEvent);
            window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent);

            scope.enabled = false;

        };

        /////////////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////////////

        this.handleResize = function () {

            if (this.nipple === document) {

                this.viewHalfX = window.innerWidth / 2;
                this.viewHalfY = window.innerHeight / 2;

            } else {

                this.viewHalfX = this.nipple.offsetWidth / 2;
                this.viewHalfY = this.nipple.offsetHeight / 2;

            }

        };


        this.onMove = function (event, data) {

            //event.preventDefault();

            if (!data.direction) {
                return;
            }

            switch (data.direction.y) {

                case 'up': this.moveForward = true; break;

                case 'down': this.moveBackward = true; break;

            }

            switch (data.direction.x) {

                case 'right': this.moveRight = true; break;

                case 'left': this.moveLeft = true; break;

            }

        };

        this.onEnd = function (event, data) {

            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;

        };

        this.lookAt = function (x, y, z) {

            if (x.isVector3) {

                _target.copy(x);

            } else {

                _target.set(x, y, z);

            }

            this.object.lookAt(_target);

            setOrientation(this);

            return this;

        };

        this.update = function (delta) {

            const targetPosition = new Vector3();

            const device = scope.deviceOrientation;

            if (device) {

                const alpha = device.alpha ? MathUtils.degToRad(device.alpha) + scope.alphaOffset : 0; // Z

                const beta = device.beta ? MathUtils.degToRad(device.beta) : 0; // X'

                const gamma = device.gamma ? MathUtils.degToRad(device.gamma) : 0; // Y''

                const orient = scope.screenOrientation ? MathUtils.degToRad(scope.screenOrientation) : 0; // O

                setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);

                if (8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

                    lastQuaternion.copy(scope.object.quaternion);
                    scope.dispatchEvent(_changeEvent);

                }



                if (this.heightSpeed) {

                    const y = MathUtils.clamp(this.object.position.y, this.heightMin, this.heightMax);
                    const heightDelta = y - this.heightMin;

                    this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);

                } else {

                    this.autoSpeedFactor = 0.0;

                }

                const actualMoveSpeed = delta * this.movementSpeed;

                if (this.moveForward || (this.autoForward && !this.moveBackward)) this.object.translateZ(- (actualMoveSpeed + this.autoSpeedFactor));
                if (this.moveBackward) this.object.translateZ(actualMoveSpeed);

                if (this.moveLeft) this.object.translateX(- actualMoveSpeed);
                if (this.moveRight) this.object.translateX(actualMoveSpeed);

                if (this.moveUp) this.object.translateY(actualMoveSpeed);
                if (this.moveDown) this.object.translateY(- actualMoveSpeed);

                let actualLookSpeed = delta * this.lookSpeed;

                if (!this.activeLook) {

                    actualLookSpeed = 0;

                }

                let verticalLookRatio = 1;

                if (this.constrainVertical) {

                    verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);

                }

                lon -= alpha * actualLookSpeed;
                if (this.lookVertical) lat -= gamma * actualLookSpeed * verticalLookRatio;

                lat = Math.max(- 85, Math.min(85, lat));

                let phi = MathUtils.degToRad(90 - lat);
                const theta = MathUtils.degToRad(lon);

                if (this.constrainVertical) {

                    phi = MathUtils.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);

                }

                const position = this.object.position;

                // targetPosition.setFromSphericalCoords(1, phi, theta).add(position);

                // this.object.lookAt(targetPosition);
            }

        };

        this.dispose = function () {

            this.nipple.off('move');
            this.nipple.off('end');

            scope.disconnect();

        };

        this.connect();

        const _onMove = this.onMove.bind(this);
        const _onEnd = this.onEnd.bind(this);

        this.nipple.on('move', _onMove);
        this.nipple.on('end', _onEnd);

        this.handleResize();

    }

}

function contextmenu(event) {

    event.preventDefault();

}

export { NippleControls };