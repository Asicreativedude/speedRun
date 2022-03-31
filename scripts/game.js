class Game {
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(100, 500, 100);
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xccdee });
  THRESHOLD = 5;
  carXpositon = 0;
  constructor(scene, camera) {
    this.running = false;
    this.time = 0;
    this.clock = new THREE.Clock();
    this.score = 0;
    this.highScore = 0;
    this.divScoreDom = document.getElementById("score");
    this.divHighScoreDom = document.getElementById("highScore");
    this.divEndPanel = document.getElementById("endPanel");
    this.divEndScore = document.getElementById("scoreEnd");
    this.divEndHighScore = document.getElementById("highScoreEnd");
    document.getElementById("startGame").onclick = () => {
      this.running = true;
      document.getElementById("introPanel").style.display = "none";
    };
    document.getElementById("replay").onclick = () => {
      this.running = true;
      document.getElementById("endPanel").style.display = "none";
    };
    this.scene = scene;
    this.camera = camera;
    this.reset(false);
  }

  update() {
    if (!this.running) return;
    this.updateRoad();
    this.updateInfoPanel();
    this.checkColissions();
  }

  //

  updateRoad() {
    this.mainClock += 0.1;
    this.time += 0.05;

    this.road.position.z = (this.time * this.mainClock * 10) % 2500;
    this.road2.position.z = ((this.time * this.mainClock * 10) % 2500) - 10000;
    this.objectParents.position.z = this.time * this.mainClock * 10;
    this.objectParents.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZpos = child.position.z + this.objectParents.position.z;
        if (childZpos > 3000) {
          this.setupObstacle(child, 0, -this.objectParents.position.z);
        }
      }
    });
  }

  checkColissions() {
    this.objectParents.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZpos = child.position.z + this.objectParents.position.z;

        const thresholdZ = this.THRESHOLD + child.scale.z / 2 + 1700;
        const thresholdX = this.THRESHOLD + child.scale.x / 2 + 175;

        if (
          (childZpos > thresholdZ &&
            Math.abs(child.position.x - this.carXpositon) < thresholdX) ||
          Math.abs(this.carXpositon) > 500
        ) {
          this.gameOver();
        }
      }
    });
  }

  updateInfoPanel() {
    this.score = Math.round(this.mainClock);
    this.divScoreDom.innerText = this.score;
  }
  gameOver() {
    this.running = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.divHighScoreDom.innerText = this.highScore;
    }
    setTimeout(() => {
      this.divEndPanel.style.display = "grid";
      this.reset(true);
    }, 500);

    this.divEndScore.innerText = this.score;
    this.divEndHighScore.innerText = this.highScore;
  }

  startGame(scene, camera, replay) {
    this.mainClock = 0;
    this.time = 0;
    this.carXpositon = 0;
    if (!replay) {
      this.cameraControl();
      this.lights();
      this.loadRoad();
      this.loadCar();
      let velocity = 30;
      camera.position.set(0, 250, 3000);
      document.onkeydown = (e) => {
        if (e.keyCode === 68) {
          this.car.position.x += velocity;
          this.carXpositon = this.car.position.x;
        } else if (e.keyCode === 65) {
          this.car.position.x -= velocity;
          this.carXpositon = this.car.position.x;
        }
      };
      this.objectParents = new THREE.Group();
      scene.add(this.objectParents);

      for (let i = 0; i < 5; i++) this.spwanObsticle();
    } else {
      this.road.position.set(0, 0, 0);
      this.road2.position.set(0, 0, -10000);
      this.car.position.set(0, 90, 2000);
      this.objectParents.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          this.setupObstacle();
        } else {
          item.position.set(0, 0, 0);
        }
      });
    }
  }

  reset(replay) {
    this.running = false;
    this.score = 0;
    this.divScoreDom.innerText = this.score;
    this.startGame(this.scene, this.camera, replay);
  }
  loadCar() {
    let loader = new THREE.GLTFLoader();
    loader.load(
      "/3dmodel/scene.gltf",
      (gltf) => {
        this.car = gltf.scene.children[0];
        this.car.scale.set(0.25, 0.25, 0.25);
        this.car.castShadow = true;
        this.car.position.set(0, 90, 2000);
        this.car.rotateZ((180 * Math.PI) / 180);
        scene.add(this.car);
        gltf.scene.updateMatrixWorld(true);
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      }
    );
  }

  loadRoad() {
    let tex = new THREE.TextureLoader().load("/images/svgRoad.svg");
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 6);
    tex.anisotropy = 32;
    const planeGeometry = new THREE.PlaneBufferGeometry(1500, 10000, 24, 24);
    const planeMaterial = new THREE.MeshStandardMaterial({ map: tex });
    this.road = new THREE.Mesh(planeGeometry, planeMaterial);
    this.road.rotateX((-90 * Math.PI) / 180);
    this.road.position.set(0, 0, 0);
    this.road.receiveShadow = true;
    this.road.castShadow = false;
    this.road2 = new THREE.Mesh(planeGeometry, planeMaterial);
    this.road2.rotateX((-90 * Math.PI) / 180);
    this.road2.position.set(0, 0, -10000);
    this.road2.receiveShadow = true;
    this.road2.castShadow = false;
    const planeGeometry2 = new THREE.PlaneBufferGeometry(8000, 20000);
    const planeMaterial2 = new THREE.MeshLambertMaterial({ color: 0xf33223 });
    const sidewalk = new THREE.Mesh(planeGeometry2, planeMaterial2);
    const sidewalk2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
    sidewalk.rotateX((-90 * Math.PI) / 180);
    sidewalk.position.set(4750, 0, -6850);
    sidewalk.receiveShadow = true;
    sidewalk.castShadow = false;
    sidewalk2.rotateX((-90 * Math.PI) / 180);
    sidewalk2.position.set(-4750, 0, -6850);
    sidewalk2.receiveShadow = true;
    sidewalk2.castShadow = false;
    scene.add(sidewalk, sidewalk2, this.road, this.road2);
  }

  lights() {
    const sun = new THREE.AmbientLight(0xffffcc, 2);
    sun.position.set(0, 500, 2500);
    scene.add(sun);
    const carLight = new THREE.DirectionalLight(0xffffff, 1);
    carLight.position.set(0, 500, 2500);
    carLight.castShadow = true;
    scene.add(carLight);
  }

  spwanObsticle() {
    this.obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.OBSTACLE_MATERIAL);
    this.setupObstacle(this.obj);
    this.obj.userData = { type: "obstacle" };
    this.objectParents.add(this.obj);
  }

  setupObstacle(obj, refXpos = 0, refZpos = 0) {
    obj.scale.set(
      this.randomFloat(0.8, 2),
      this.randomFloat(0.8, 2),
      this.randomFloat(0.8, 2)
    );

    obj.position.set(
      refXpos + this.randomFloat(-500, 500),
      obj.scale.y * 0.5,
      refZpos - 7000 - this.randomFloat(0, 10000)
    );
  }
  randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }
  randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  cameraControl() {
    let controls = new THREE.OrbitControls(camera);
    controls.enableDamping = true;
  }
}
