/* Nova — an interactive 3D scene built with Three.js. */
(function () {
  "use strict";

  var THREE = window.THREE;
  if (!THREE) {
    document.body.insertAdjacentHTML(
      "beforeend",
      "<p style='color:#ff6b6b'>Three.js could not be loaded.</p>"
    );
    return;
  }

  /* ---------------- Renderer / Scene / Camera ---------------- */

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.classList.add("scene");
  document.body.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060f, 0.03);

  var camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 1.2, 8);
  scene.add(camera);

  /* ---------------- Lights ---------------- */

  scene.add(new THREE.AmbientLight(0x5566aa, 0.7));

  var coreLight = new THREE.PointLight(0x8fb0ff, 130, 30, 1.8);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  /* ---------------- Starfield ---------------- */

  var starCount = 2200;
  var starPositions = new Float32Array(starCount * 3);
  fillStarfield(starPositions, 14);
  var starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

  var starMaterial = new THREE.PointsMaterial({
    color: 0x93a7ff,
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  var stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  function fillStarfield(target, radius) {
    for (var i = 0; i < target.length / 3; i++) {
      var point = randomPointInSphere(radius);
      target[i * 3] = point.x;
      target[i * 3 + 1] = point.y;
      target[i * 3 + 2] = point.z;
    }
  }

  function randomPointInSphere(radius) {
    // Random point just inside `radius` via rejection sampling.
    do {
      var raw = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );
      if (raw.lengthSq() > 1e-6) {
        return raw
          .normalize()
          .multiplyScalar(radius * (0.55 + Math.random() * 0.45));
      }
    } while (true);
  }

  /* ---------------- Planet ---------------- */

  var planetGeometry = new THREE.SphereGeometry(1.6, 48, 32);
  var planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x24366b,
    emissive: 0x3148c9,
    emissiveIntensity: 0.55,
    metalness: 0.65,
    roughness: 0.28,
  });
  var planet = new THREE.Mesh(planetGeometry, planetMaterial);
  scene.add(planet);

  // Thin wireframe shell that follows the deform.
  var wireGeometry = new THREE.SphereGeometry(1.64, 24, 16);
  var wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x9db4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  var wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
  scene.add(wireframe);

  // Soft glow behind the planet.
  var glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: 0x6f8dff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(7, 7, 1);
  scene.add(glow);

  function makeGlowTexture() {
    var size = 256;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext("2d");
    var gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(180, 205, 255, 0.95)");
    gradient.addColorStop(0.35, "rgba(120, 150, 255, 0.5)");
    gradient.addColorStop(1, "rgba(60, 80, 200, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  /* ---------------- Interaction ---------------- */

  var pointer = { x: 0, y: 0 };
  var theta = Math.PI * 0.35;
  var phi = Math.PI * 0.5 - 0.15;
  var thetaTarget = theta;
  var phiTarget = phi;

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    thetaTarget = theta + pointer.x * 0.9;
    phiTarget = clampPhi(phi + pointer.y * 0.7);
  }

  function clampPhi(value) {
    return Math.max(0.15, Math.min(Math.PI - 0.15, value));
  }

  window.addEventListener("pointermove", onPointerMove);
  // Any click releases a burst of light.
  window.addEventListener("pointerdown", spawnBurst);

  /* ---------------- Bursts ---------------- */

  var bursts = [];

  function spawnBurst() {
    var count = 160;
    var positions = new Float32Array(count * 3);
    var directions = new Float32Array(count * 3);
    var speeds = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var elevation = Math.acos(2 * Math.random() - 1);
      var dx = Math.sin(elevation) * Math.cos(angle);
      var dy = Math.sin(elevation) * Math.sin(angle);
      var dz = Math.cos(elevation);
      positions[i * 3] = dx * (1 + Math.random() * 2);
      positions[i * 3 + 1] = dy * (1 + Math.random() * 2);
      positions[i * 3 + 2] = dz * (1 + Math.random() * 2);
      directions[i * 3] = dx;
      directions[i * 3 + 1] = dy;
      directions[i * 3 + 2] = dz;
      speeds[i] = (1.2 + Math.random() * 3) * 0.5;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    var material = new THREE.PointsMaterial({
      color: 0x9fd0ff,
      size: 0.12,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    var burst = new THREE.Points(geometry, material);
    scene.add(burst);
    bursts.push({
      points: burst,
      directions: directions,
      speeds: speeds,
      life: 1.4,
    });
  }

  function updateBursts(delta) {
    for (var i = bursts.length - 1; i >= 0; i--) {
      var burst = bursts[i];
      var attribute = burst.points.geometry.attributes.position;
      var array = attribute.array;
      var directions = burst.directions;
      var speeds = burst.speeds;
      for (var j = 0; j < attribute.count; j++) {
        var index = j * 3;
        array[index] += directions[index] * speeds[j] * delta;
        array[index + 1] += directions[index + 1] * speeds[j] * delta;
        array[index + 2] += directions[index + 2] * speeds[j] * delta;
      }
      attribute.needsUpdate = true;
      burst.life -= delta;
      if (burst.life <= 0) {
        scene.remove(burst.points);
        burst.points.geometry.dispose();
        burst.points.material.dispose();
        bursts.splice(i, 1);
      } else {
        burst.points.material.opacity = Math.max(burst.life / 1.4, 0);
      }
    }
  }

  /* ---------------- Animation ---------------- */

  var clock = new THREE.Clock();
  var time = 0;

  function deformPlanet(elapsed) {
    var array = planetGeometry.attributes.position.array;
    for (var i = 0; i < array.length; i += 3) {
      var x = array[i];
      var y = array[i + 1];
      var z = array[i + 2];
      var strength = 1 + noise(x, y, z, elapsed) * 0.28;
      array[i] = x * strength;
      array[i + 1] = y * strength;
      array[i + 2] = z * strength;
    }
    planetGeometry.attributes.position.needsUpdate = true;
    planetGeometry.computeVertexNormals();
  }

  function noise(x, y, z, t) {
    var fx = 0.5 + 0.5 * Math.sin(x * 10 + t * 1.1) * Math.cos(y * 8 - t * 0.7);
    var fy = 0.5 + 0.5 * Math.sin(z * 12 + t * 0.9) * Math.cos(x * 6 + t * 1.7);
    var fz = 0.5 + 0.5 * Math.cos(y * 10 + t * 1.3) * Math.sin(z * 9 - t * 0.5);
    return fx * fy * fz * 2 - 1;
  }

  function updateCamera(delta) {
    var ease = Math.min(1, delta * 8);
    theta += (thetaTarget - theta) * ease;
    phi += (phiTarget - phi) * ease;
    var radius = 8;
    camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(0, 0, 0);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize);

  function animate() {
    requestAnimationFrame(animate);
    var delta = Math.min(clock.getDelta(), 0.05);
    time += delta;

    deformPlanet(time);
    planet.rotation.y += delta * 0.15;
    wireframe.rotation.y -= delta * 0.08;
    wireframe.rotation.x += delta * 0.04;
    coreLight.intensity = 110 + Math.sin(time * 2.2) * 35;
    stars.rotation.y += delta * 0.02;
    stars.rotation.x += delta * 0.008;

    updateCamera(delta);
    updateBursts(delta);

    renderer.render(scene, camera);
  }

  /* ---------------- Start ---------------- */

  requestAnimationFrame(animate);

  // Reveal feature cards as they scroll into view.
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add("visible");
            observer.unobserve(entries[i].target);
          }
        }
      },
      { threshold: 0.2 }
    );
    var cards = document.querySelectorAll(".reveal");
    for (var j = 0; j < cards.length; j++) {
      observer.observe(cards[j]);
    }
  }
})();
