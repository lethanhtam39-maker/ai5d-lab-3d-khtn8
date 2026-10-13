import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ReagentId, TubeContents } from '../../types/lab';
import { soundManager } from '../../services/soundEffects';

export interface TubeStateMap {
  [tubeNum: number]: TubeContents;
}

export class LabSceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  private container: HTMLElement;
  private animationFrameId: number | null = null;

  // Meshes & Objects
  private tubes: { [tubeNum: number]: THREE.Group } = {};
  private liquids: { [tubeNum: number]: THREE.Mesh } = {};
  private znPellets: { [tubeNum: number]: THREE.Group } = {};
  private reagents: { [key in ReagentId]?: THREE.Group } = {};
  private originalReagentPositions: { [key in ReagentId]?: THREE.Vector3 } = {};
  private originalReagentRotations: { [key in ReagentId]?: THREE.Euler } = {};

  // Particles
  private bubbleParticles: { [tubeNum: number]: THREE.Points } = {};
  private bubblePositions: { [tubeNum: number]: Float32Array } = {};
  private bubbleVelocities: { [tubeNum: number]: Float32Array } = {};
  private precipitateParticles: { [tubeNum: number]: THREE.Points } = {};
  private precipitatePositions: { [tubeNum: number]: Float32Array } = {};

  // Pouring stream
  private pourStream: THREE.Line | null = null;

  // Animation Tween queue
  private isAnimatingAction: boolean = false;

  // Raycasting for interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Callbacks
  public onTubeClicked?: (tubeNum: number) => void;
  public onReagentClicked?: (reagentId: ReagentId) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Slate-900 lab atmosphere
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.025);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 3.8, 7.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 14;
    this.controls.target.set(0, 1.2, 0);

    // 5. Lights
    this.setupLighting();

    // 6. Environment & Furniture
    this.setupEnvironment();

    // 7. Test Tube Rack & 3 Test Tubes
    this.setupRackAndTubes();

    // 8. Reagents Shelf & Bottles
    this.setupReagentBottles();

    // 9. Particle Systems
    this.setupParticleSystems();

    // 10. Event Listeners
    this.bindEvents();

    // 11. Render Loop
    this.animate();
  }

  private setupLighting() {
    // Ambient soft blue-tinted laboratory light
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    this.scene.add(ambientLight);

    // Key directional light from above-front-right
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(5, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.0005;
    const d = 6;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Fill soft light from front-left
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-6, 5, 4);
    this.scene.add(fillLight);

    // Rim light from behind for glass highlights
    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.7);
    rimLight.position.set(0, 4, -6);
    this.scene.add(rimLight);
  }

  private setupEnvironment() {
    // Lab bench table top
    const benchGeo = new THREE.BoxGeometry(16, 0.5, 9);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep slate laboratory phenolic resin bench
      roughness: 0.35,
      metalness: 0.1,
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, -0.25, 0);
    bench.receiveShadow = true;
    this.scene.add(bench);

    // Bench front bevel / metal trim
    const trimGeo = new THREE.BoxGeometry(16.05, 0.08, 0.08);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 0.01, 4.45);
    this.scene.add(trim);

    // Bench subtle grid / measurement markings
    const grid = new THREE.GridHelper(12, 24, 0x3b82f6, 0x334155);
    grid.position.set(0, 0.005, 0);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Lab wall backdrop in distance
    const wallGeo = new THREE.PlaneGeometry(30, 18);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 6, -6);
    this.scene.add(wall);
  }

  private createGlassMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.06,
      ior: 1.52,
      thickness: 0.35,
      reflectivity: 0.6,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
    });
  }

  private setupRackAndTubes() {
    // Stainless steel 3-tube test rack
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0, 0, 0.2);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Top plate with 3 holes
    const topPlateGeo = new THREE.BoxGeometry(4.2, 0.08, 1.4);
    const topPlate = new THREE.Mesh(topPlateGeo, metalMat);
    topPlate.position.set(0, 1.6, 0);
    topPlate.castShadow = true;
    topPlate.receiveShadow = true;
    rackGroup.add(topPlate);

    // Bottom plate
    const botPlateGeo = new THREE.BoxGeometry(4.2, 0.08, 1.4);
    const botPlate = new THREE.Mesh(botPlateGeo, metalMat);
    botPlate.position.set(0, 0.04, 0);
    botPlate.castShadow = true;
    botPlate.receiveShadow = true;
    rackGroup.add(botPlate);

    // 4 metal support pillars
    const pillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 16);
    const pillarCoords = [
      [-1.9, 0.8, 0.55],
      [1.9, 0.8, 0.55],
      [-1.9, 0.8, -0.55],
      [1.9, 0.8, -0.55],
    ];
    pillarCoords.forEach(([x, y, z]) => {
      const p = new THREE.Mesh(pillarGeo, metalMat);
      p.position.set(x, y, z);
      p.castShadow = true;
      rackGroup.add(p);
    });

    // Tube labels (1), (2), (3) on rack front plate
    const labelX = [-1.2, 0, 1.2];
    labelX.forEach((x, idx) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Ống (${idx + 1})`, 64, 32);

      const labelTex = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
      const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.35), labelMat);
      labelMesh.position.set(x, 0.8, 0.72);
      rackGroup.add(labelMesh);
    });

    this.scene.add(rackGroup);

    // Build the 3 Test Tubes
    [1, 2, 3].forEach((tubeNum) => {
      const tubeGroup = new THREE.Group();
      tubeGroup.position.set(labelX[tubeNum - 1], 0.15, 0.2);
      tubeGroup.userData = { isTube: true, tubeNum };

      const glassMat = this.createGlassMaterial();

      // Tube cylinder body
      const tubeRadius = 0.32;
      const tubeHeight = 2.4;
      const cylGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32, 1, true);
      const cylMesh = new THREE.Mesh(cylGeo, glassMat);
      cylMesh.position.set(0, tubeHeight / 2 + tubeRadius, 0);
      cylMesh.castShadow = true;
      tubeGroup.add(cylMesh);

      // Tube rounded bottom half-sphere
      const sphereGeo = new THREE.SphereGeometry(tubeRadius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const sphereMesh = new THREE.Mesh(sphereGeo, glassMat);
      sphereMesh.position.set(0, tubeRadius, 0);
      sphereMesh.castShadow = true;
      tubeGroup.add(sphereMesh);

      // Tube top rim (torus)
      const rimGeo = new THREE.TorusGeometry(tubeRadius, 0.035, 16, 32);
      const rimMesh = new THREE.Mesh(rimGeo, glassMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.set(0, tubeHeight + tubeRadius, 0);
      tubeGroup.add(rimMesh);

      // Volume graduation tick marks (thin white lines on glass)
      for (let mark = 1; mark <= 4; mark++) {
        const ringGeo = new THREE.TorusGeometry(tubeRadius + 0.002, 0.005, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.5 + mark * 0.45, 0);
        tubeGroup.add(ring);
      }

      // Liquid inside the test tube
      const liquidMat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transmission: 0.85,
        transparent: true,
        opacity: 0,
        roughness: 0.1,
        ior: 1.33, // water IOR
      });
      const liquidGeo = new THREE.CylinderGeometry(tubeRadius - 0.02, tubeRadius - 0.02, 0.1, 24);
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
      liquidMesh.position.set(0, 0.05, 0);
      liquidMesh.visible = false;
      tubeGroup.add(liquidMesh);
      this.liquids[tubeNum] = liquidMesh;

      // Group for Zn granules in tube 1
      const znGroup = new THREE.Group();
      znGroup.position.set(0, tubeRadius * 0.5, 0);
      znGroup.visible = false;

      // Create 4 distinct shiny metallic zinc pellets
      const pelletMat = new THREE.MeshStandardMaterial({
        color: 0xa1a1aa, // Zinc silver-grey metal
        metalness: 0.9,
        roughness: 0.35,
      });
      const pelletCoords = [
        [0, 0, 0],
        [-0.08, 0.04, 0.06],
        [0.09, 0.02, -0.05],
        [0.02, 0.09, 0.04],
      ];
      pelletCoords.forEach(([px, py, pz], pIdx) => {
        const pGeo = new THREE.DodecahedronGeometry(0.08 - pIdx * 0.01, 1);
        const pMesh = new THREE.Mesh(pGeo, pelletMat);
        pMesh.position.set(px, py, pz);
        pMesh.rotation.set(pIdx * 0.7, pIdx * 1.2, pIdx * 0.5);
        pMesh.castShadow = true;
        znGroup.add(pMesh);
      });

      tubeGroup.add(znGroup);
      this.znPellets[tubeNum] = znGroup;

      this.scene.add(tubeGroup);
      this.tubes[tubeNum] = tubeGroup;
    });
  }

  private createBottleLabelTexture(name: string, formula: string, hazardColor: string = '#ef4444') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // White label background with border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 152);

    // Hazard stripe
    ctx.fillStyle = hazardColor;
    ctx.fillRect(6, 6, 244, 14);

    // Formula (large bold)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(formula, 128, 64);

    // Full name
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(name, 128, 104);

    // Subtitle / Standard KHTN 8
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('Thực hành KHTN 8', 128, 138);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private setupReagentBottles() {
    // Chemical Shelf / Stand at the back of the desk
    const shelfGeo = new THREE.BoxGeometry(7.2, 0.25, 2.0);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 0.125, -2.4);
    shelf.receiveShadow = true;
    shelf.castShadow = true;
    this.scene.add(shelf);

    // Define 5 reagents config
    const reagentConfigs: Array<{
      id: ReagentId;
      name: string;
      formula: string;
      color: number;
      type: 'jar' | 'bottle' | 'dropper';
      x: number;
    }> = [
      { id: 'zn', name: 'Kẽm viên', formula: 'Zn', color: 0xa1a1aa, type: 'jar', x: -2.7 },
      { id: 'hcl', name: 'Axit clohiđric', formula: 'HCl loãng', color: 0xffffff, type: 'bottle', x: -1.35 },
      { id: 'bacl2', name: 'Bari clorua', formula: 'BaCl₂', color: 0xffffff, type: 'bottle', x: 0 },
      { id: 'cuso4', name: 'Đồng(II) sunfat', formula: 'CuSO₄', color: 0x0284c7, type: 'bottle', x: 1.35 },
      { id: 'naoh', name: 'Natri hiđroxit', formula: 'NaOH', color: 0xffffff, type: 'dropper', x: 2.7 },
    ];

    reagentConfigs.forEach((cfg) => {
      const group = new THREE.Group();
      group.position.set(cfg.x, 0.25, -2.4);
      group.userData = { isReagent: true, reagentId: cfg.id };

      const glassMat = this.createGlassMaterial();

      if (cfg.type === 'jar') {
        // Solid Zn Jar (wide cylinder with screw lid and visible Zn pellets inside)
        const jarRadius = 0.45;
        const jarHeight = 0.85;
        const jarGeo = new THREE.CylinderGeometry(jarRadius, jarRadius, jarHeight, 28);
        const jarMesh = new THREE.Mesh(jarGeo, glassMat);
        jarMesh.position.set(0, jarHeight / 2, 0);
        jarMesh.castShadow = true;
        group.add(jarMesh);

        // Black screw lid
        const lidGeo = new THREE.CylinderGeometry(jarRadius + 0.02, jarRadius + 0.02, 0.18, 28);
        const lidMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
        const lidMesh = new THREE.Mesh(lidGeo, lidMat);
        lidMesh.position.set(0, jarHeight + 0.09, 0);
        lidMesh.castShadow = true;
        group.add(lidMesh);

        // Silvery zinc pellets visible inside jar
        const znInJar = new THREE.Group();
        for (let i = 0; i < 9; i++) {
          const pGeo = new THREE.DodecahedronGeometry(0.1, 1);
          const pMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.3 });
          const p = new THREE.Mesh(pGeo, pMat);
          const ang = Math.random() * Math.PI * 2;
          const dist = Math.random() * 0.28;
          p.position.set(Math.cos(ang) * dist, 0.12 + Math.random() * 0.25, Math.sin(ang) * dist);
          znInJar.add(p);
        }
        group.add(znInJar);

        // Label on jar
        const labelTex = this.createBottleLabelTexture(cfg.name, cfg.formula, '#3b82f6');
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
        const labelGeo = new THREE.CylinderGeometry(jarRadius + 0.005, jarRadius + 0.005, 0.45, 28, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, jarHeight * 0.52, 0);
        labelMesh.rotation.y = Math.PI / 2;
        group.add(labelMesh);
      } else if (cfg.type === 'bottle') {
        // Chemical Bottle with neck and stopper
        const bRadius = 0.42;
        const bHeight = 1.25;
        const bGeo = new THREE.CylinderGeometry(bRadius, bRadius, bHeight, 28);
        const bMesh = new THREE.Mesh(bGeo, glassMat);
        bMesh.position.set(0, bHeight / 2, 0);
        bMesh.castShadow = true;
        group.add(bMesh);

        // Bottle neck
        const neckGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.35, 24);
        const neckMesh = new THREE.Mesh(neckGeo, glassMat);
        neckMesh.position.set(0, bHeight + 0.17, 0);
        group.add(neckMesh);

        // Stopper
        const stopGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.25, 24);
        const stopMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
        const stopMesh = new THREE.Mesh(stopGeo, stopMat);
        stopMesh.position.set(0, bHeight + 0.4, 0);
        group.add(stopMesh);

        // Liquid volume inside bottle (e.g. CuSO4 blue or transparent HCl/BaCl2)
        const liqGeo = new THREE.CylinderGeometry(bRadius - 0.02, bRadius - 0.02, bHeight * 0.75, 24);
        const liqMat = new THREE.MeshPhysicalMaterial({
          color: cfg.color,
          transmission: 0.85,
          transparent: true,
          opacity: cfg.color === 0xffffff ? 0.25 : 0.9,
          roughness: 0.1,
          ior: 1.33,
        });
        const liqMesh = new THREE.Mesh(liqGeo, liqMat);
        liqMesh.position.set(0, (bHeight * 0.75) / 2 + 0.02, 0);
        group.add(liqMesh);

        // Label on bottle front
        const labelTex = this.createBottleLabelTexture(cfg.name, cfg.formula, cfg.color === 0x0284c7 ? '#0284c7' : '#ef4444');
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
        const labelGeo = new THREE.CylinderGeometry(bRadius + 0.005, bRadius + 0.005, 0.55, 28, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, bHeight * 0.5, 0);
        labelMesh.rotation.y = Math.PI / 2;
        group.add(labelMesh);
      } else if (cfg.type === 'dropper') {
        // Dropper bottle (chai thuốc nhỏ giọt có pipet cao su)
        const bRadius = 0.38;
        const bHeight = 1.1;
        const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(bRadius, bRadius, bHeight, 28), glassMat);
        bMesh.position.set(0, bHeight / 2, 0);
        bMesh.castShadow = true;
        group.add(bMesh);

        // Liquid inside
        const liqMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(bRadius - 0.02, bRadius - 0.02, bHeight * 0.7, 24),
          new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.85,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
          })
        );
        liqMesh.position.set(0, (bHeight * 0.7) / 2 + 0.02, 0);
        group.add(liqMesh);

        // Rubber bulb pipette cap (red rubber bulb)
        const bulbGeo = new THREE.SphereGeometry(0.24, 24, 16);
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }); // Red rubber
        const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
        bulbMesh.scale.set(1, 1.4, 1);
        bulbMesh.position.set(0, bHeight + 0.5, 0);
        group.add(bulbMesh);

        // Collar ring
        const collarMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.2, 24),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 })
        );
        collarMesh.position.set(0, bHeight + 0.18, 0);
        group.add(collarMesh);

        // Pipette glass stem inside
        const pipGeo = new THREE.CylinderGeometry(0.05, 0.03, 1.1, 16);
        const pipMesh = new THREE.Mesh(pipGeo, glassMat);
        pipMesh.position.set(0, bHeight * 0.6, 0);
        group.add(pipMesh);

        // Label
        const labelTex = this.createBottleLabelTexture(cfg.name, cfg.formula, '#10b981');
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
        const labelGeo = new THREE.CylinderGeometry(bRadius + 0.005, bRadius + 0.005, 0.5, 28, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, bHeight * 0.5, 0);
        labelMesh.rotation.y = Math.PI / 2;
        group.add(labelMesh);
      }

      this.scene.add(group);
      this.reagents[cfg.id] = group;
      this.originalReagentPositions[cfg.id] = group.position.clone();
      this.originalReagentRotations[cfg.id] = group.rotation.clone();
    });
  }

  private setupParticleSystems() {
    // 1. Bubble particles for Tube 1 (Zn + HCl reaction)
    const bubbleCount = 70;
    const bubbleGeo = new THREE.BufferGeometry();
    const bPos = new Float32Array(bubbleCount * 3);
    const bVel = new Float32Array(bubbleCount * 3);

    for (let i = 0; i < bubbleCount; i++) {
      // Nucleate directly from Zn pellet cluster radius
      bPos[i * 3] = (Math.random() - 0.5) * 0.18;
      bPos[i * 3 + 1] = 0.2 + Math.random() * 0.1;
      bPos[i * 3 + 2] = (Math.random() - 0.5) * 0.18;

      bVel[i * 3] = (Math.random() - 0.5) * 0.004; // Gentle wobble
      bVel[i * 3 + 1] = 0.015 + Math.random() * 0.025; // Upward velocity
      bVel[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }

    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));

    // Custom circle sprite texture for clean bubbles
    const bubbleTex = this.createCircleTexture('#ffffff', 0.85);
    const bubbleMat = new THREE.PointsMaterial({
      size: 0.06,
      map: bubbleTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
    bubbles.visible = false;
    this.tubes[1].add(bubbles);
    this.bubbleParticles[1] = bubbles;
    this.bubblePositions[1] = bPos;
    this.bubbleVelocities[1] = bVel;

    // 2. Flocculent precipitate particles for Tube 3 (Cu(OH)2 blue flock)
    const pCount = 180;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      // Cylindrical distribution within tube
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.24;
      pPos[i * 3] = Math.cos(ang) * r;
      pPos[i * 3 + 1] = 0.2 + Math.random() * 1.3;
      pPos[i * 3 + 2] = Math.sin(ang) * r;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pTex = this.createCircleTexture('#38bdf8', 0.9); // Fluffy light cyan-blue
    const pMat = new THREE.PointsMaterial({
      size: 0.1,
      map: pTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const precipitate = new THREE.Points(pGeo, pMat);
    precipitate.visible = false;
    this.tubes[3].add(precipitate);
    this.precipitateParticles[3] = precipitate;
    this.precipitatePositions[3] = pPos;
  }

  private createCircleTexture(color: string, opacity: number = 1): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Animate the physical chemical pouring / transfer
  public async animateTransfer(reagentId: ReagentId, targetTube: number): Promise<void> {
    if (this.isAnimatingAction) return;
    this.isAnimatingAction = true;

    const reagent = this.reagents[reagentId];
    const tube = this.tubes[targetTube];
    if (!reagent || !tube) {
      this.isAnimatingAction = false;
      return;
    }

    const startPos = reagent.position.clone();
    const startRot = reagent.rotation.clone();

    // Target hover position: directly above tube rim
    const targetHoverPos = new THREE.Vector3(
      tube.position.x + (reagentId === 'zn' ? 0 : 0.45),
      tube.position.y + 2.8,
      tube.position.z + 0.1
    );

    // 1. Move bottle to hover position (0.5s)
    await this.tweenPosition(reagent, startPos, targetHoverPos, 450);

    // 2. Pour or Drop Action
    if (reagentId === 'zn') {
      // Solid pellet drop: show pellets falling down inside tube
      soundManager.playDropZn();
      await this.animatePelletFall(targetTube);
    } else {
      // Tilt bottle / pipette
      soundManager.playPour();
      await this.tweenRotation(reagent, 0, 0, Math.PI / 3.2, 350);

      // Create animated liquid pouring stream line
      this.createPourStream(targetHoverPos, tube.position);

      // Hold pouring stream while tube fills
      await new Promise((r) => setTimeout(r, 650));
      this.removePourStream();

      // Tilt back upright
      await this.tweenRotation(reagent, 0, 0, 0, 300);
    }

    // 3. Return bottle to original shelf slot
    await this.tweenPosition(reagent, reagent.position, this.originalReagentPositions[reagentId]!, 450);
    reagent.rotation.copy(this.originalReagentRotations[reagentId]!);

    this.isAnimatingAction = false;
  }

  private createPourStream(from: THREE.Vector3, to: THREE.Vector3) {
    const points = [
      new THREE.Vector3(from.x - 0.25, from.y - 0.1, from.z),
      new THREE.Vector3(to.x, to.y + 2.3, to.z),
      new THREE.Vector3(to.x, to.y + 1.2, to.z),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const streamGeo = new THREE.TubeGeometry(curve, 16, 0.025, 8, false);
    const streamMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.85 });
    this.pourStream = new THREE.Mesh(streamGeo, streamMat) as unknown as THREE.Line;
    this.scene.add(this.pourStream);
  }

  private removePourStream() {
    if (this.pourStream) {
      this.scene.remove(this.pourStream);
      this.pourStream.geometry.dispose();
      this.pourStream = null;
    }
  }

  private async animatePelletFall(tubeNum: number): Promise<void> {
    const zn = this.znPellets[tubeNum];
    if (!zn) return;
    zn.visible = true;
    zn.position.y = 2.4; // start from top rim
    const targetY = 0.18; // bottom of tube

    const startTime = performance.now();
    const duration = 300;

    return new Promise((resolve) => {
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // Quadratic gravity ease-in
        const ease = progress * progress;
        zn.position.y = 2.4 - (2.4 - targetY) * ease;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          zn.position.y = targetY;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  private tweenPosition(obj: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, duration: number): Promise<void> {
    const startTime = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2; // Smooth sine ease in-out
        obj.position.lerpVectors(from, to, ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          obj.position.copy(to);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  private tweenRotation(obj: THREE.Object3D, rx: number, ry: number, rz: number, duration: number): Promise<void> {
    const startRot = obj.rotation.clone();
    const endRot = new THREE.Euler(rx, ry, rz);
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
        obj.rotation.x = THREE.MathUtils.lerp(startRot.x, endRot.x, ease);
        obj.rotation.y = THREE.MathUtils.lerp(startRot.y, endRot.y, ease);
        obj.rotation.z = THREE.MathUtils.lerp(startRot.z, endRot.z, ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          obj.rotation.copy(endRot);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  // Update physical visual state of the 3 test tubes
  public updateTubeVisuals(states: TubeStateMap) {
    [1, 2, 3].forEach((tubeNum) => {
      const state = states[tubeNum];
      if (!state) return;

      const liquid = this.liquids[tubeNum];
      const zn = this.znPellets[tubeNum];
      const bubbles = this.bubbleParticles[tubeNum];
      const precipitate = this.precipitateParticles[tubeNum];

      // Update liquid volume & geometry
      if (state.liquidVolume > 0) {
        liquid.visible = true;
        const targetHeight = (state.liquidVolume / 100) * 1.8 + 0.15;

        // Recreate or scale geometry for accurate liquid volume meniscus
        liquid.geometry.dispose();
        liquid.geometry = new THREE.CylinderGeometry(0.3, 0.3, targetHeight, 28);
        liquid.position.set(0, targetHeight / 2 + 0.15, 0);

        const mat = liquid.material as THREE.MeshPhysicalMaterial;
        mat.color.set(state.liquidColor);
        mat.opacity = state.liquidOpacity;
      } else {
        liquid.visible = false;
      }

      // Update Zn pellets in Tube 1
      if (zn) {
        zn.visible = state.hasZn;
        if (state.hasZn) {
          // Shrink Zn pellets as reaction progresses
          const scale = Math.max(0.35, state.znRemainingPercent / 100);
          zn.scale.set(scale, scale, scale);
        }
      }

      // Bubbles in Tube 1
      if (bubbles) {
        bubbles.visible = state.reactionType === 'effervescence' && state.bubblesCount > 0;
        if (bubbles.visible) {
          soundManager.startBubbling();
        } else if (tubeNum === 1) {
          soundManager.stopBubbling();
        }
      }

      // Precipitate in Tube 3
      if (precipitate) {
        precipitate.visible = state.reactionType === 'precipitate' && state.precipitateAmount > 0;
        if (precipitate.visible) {
          const mat = precipitate.material as THREE.PointsMaterial;
          mat.opacity = Math.min(0.95, state.precipitateAmount * 1.2);
        }
      }
    });
  }

  // Camera preset views
  public setCameraView(preset: 'overview' | 'tube1' | 'tube2' | 'tube3') {
    const targets: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
      overview: { pos: new THREE.Vector3(0, 3.8, 7.5), target: new THREE.Vector3(0, 1.2, 0) },
      tube1: { pos: new THREE.Vector3(-1.2, 1.6, 3.2), target: new THREE.Vector3(-1.2, 1.3, 0.2) },
      tube2: { pos: new THREE.Vector3(0, 1.6, 3.2), target: new THREE.Vector3(0, 1.3, 0.2) },
      tube3: { pos: new THREE.Vector3(1.2, 1.6, 3.2), target: new THREE.Vector3(1.2, 1.3, 0.2) },
    };

    const cfg = targets[preset];
    if (!cfg) return;

    this.tweenPosition(this.camera, this.camera.position, cfg.pos, 700);
    this.tweenPosition(this.controls.target as unknown as THREE.Object3D, this.controls.target, cfg.target, 700);
  }

  private bindEvents() {
    const dom = this.renderer.domElement;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = dom.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== this.scene) {
          if (curr.userData.isTube && this.onTubeClicked) {
            this.onTubeClicked(curr.userData.tubeNum);
            return;
          }
          if (curr.userData.isReagent && this.onReagentClicked) {
            this.onReagentClicked(curr.userData.reagentId);
            return;
          }
          curr = curr.parent;
        }
      }
    };

    dom.addEventListener('click', onPointerDown);
  }

  public resize(width: number, height: number) {
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();

    // 1. Update Bubbles in Tube 1
    const bPos = this.bubblePositions[1];
    const bVel = this.bubbleVelocities[1];
    const bubbles = this.bubbleParticles[1];
    if (bubbles && bubbles.visible && bPos && bVel) {
      const count = bPos.length / 3;
      const liquid = this.liquids[1];
      const maxLiquidY = liquid ? liquid.position.y + 0.65 : 1.4;

      for (let i = 0; i < count; i++) {
        bPos[i * 3 + 1] += bVel[i * 3 + 1];
        bPos[i * 3] += Math.sin(bPos[i * 3 + 1] * 12) * 0.001;

        // Reset bubble when reaching meniscus
        if (bPos[i * 3 + 1] > maxLiquidY) {
          bPos[i * 3] = (Math.random() - 0.5) * 0.16;
          bPos[i * 3 + 1] = 0.2 + Math.random() * 0.1;
          bPos[i * 3 + 2] = (Math.random() - 0.5) * 0.16;
        }
      }
      bubbles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Precipitate particles in Tube 3 (settling gently)
    const pPos = this.precipitatePositions[3];
    const precipitate = this.precipitateParticles[3];
    if (precipitate && precipitate.visible && pPos) {
      const count = pPos.length / 3;
      for (let i = 0; i < count; i++) {
        // Slow sedimentation downward
        pPos[i * 3 + 1] -= 0.0006;
        // Keep inside bottom half
        if (pPos[i * 3 + 1] < 0.2) {
          pPos[i * 3 + 1] = 0.2 + Math.random() * 0.25; // accumulate at bottom
        }
      }
      precipitate.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    soundManager.stopBubbling();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
