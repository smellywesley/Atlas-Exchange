"use client";
/* eslint-disable @next/next/no-img-element -- cinematic frames use verified local campus assets. */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from "motion/react";
import * as THREE from "three";

export type CinematicCampus = {
  city: string;
  country: string;
  imagePath: string;
  name: string;
};

type CinematicOpeningProps = {
  campuses: readonly CinematicCampus[];
};

const destinations = [
  { latitude: 51.5072, longitude: -0.1276 },
  { latitude: 37.5665, longitude: 126.978 },
  { latitude: 35.6762, longitude: 139.6503 },
  { latitude: 47.3769, longitude: 8.5417 },
  { latitude: 37.4275, longitude: -122.1697 },
  { latitude: -23.5505, longitude: -46.6333 }
];

export function CinematicOpening({ campuses }: CinematicOpeningProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendererUnavailable, setRendererUnavailable] = useState(false);
  const [visibleCampusCount, setVisibleCampusCount] = useState(6);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });
  const openingOpacity = useTransform(scrollYProgress, [0, 0.25, 0.38], [1, 1, 0]);
  const campusOpacity = useTransform(scrollYProgress, [0.18, 0.32, 0.68, 0.82], [0, 1, 1, 0]);
  const campusY = useTransform(scrollYProgress, [0.18, 0.48, 0.82], [90, 0, -70]);
  const welcomeOpacity = useTransform(scrollYProgress, [0.56, 0.7, 0.96, 1], [0, 1, 1, 0]);
  const welcomeScale = useTransform(scrollYProgress, [0.58, 0.76], [0.88, 1]);
  const signalOpacity = useTransform(scrollYProgress, [0, 0.08, 0.9, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const tabletQuery = window.matchMedia("(max-width: 980px)");
    const updateCount = () => setVisibleCampusCount(mobileQuery.matches ? 2 : tabletQuery.matches ? 3 : 6);

    updateCount();
    mobileQuery.addEventListener("change", updateCount);
    tabletQuery.addEventListener("change", updateCount);

    return () => {
      mobileQuery.removeEventListener("change", updateCount);
      tabletQuery.removeEventListener("change", updateCount);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      setRendererUnavailable(false);
    } catch (error) {
      console.warn("The cinematic globe could not start; the campus fallback remains available.", error);
      setRendererUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020607, 0.045);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.08, 5.4);

    const world = new THREE.Group();
    scene.add(world);

    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x8fcbd4,
      metalness: 0.02,
      roughness: 0.72,
      transparent: true
    });
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.42, 96, 96),
      earthMaterial
    );
    earth.rotation.z = THREE.MathUtils.degToRad(-18);
    world.add(earth);

    let disposed = false;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/textures/earth-blue-marble.png",
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
        requestRender();
      }
    );

    const atmosphereMaterial = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        glowColor: { value: new THREE.Color(0x79e6ff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
          gl_FragColor = vec4(glowColor, intensity * 0.72);
        }
      `
    });
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.56, 64, 64),
      atmosphereMaterial
    );
    world.add(atmosphere);

    const routeGroup = new THREE.Group();
    world.add(routeGroup);
    const singapore = toGlobePoint(1.3521, 103.8198, 1.44);
    destinations.forEach((destination, index) => {
      const end = toGlobePoint(destination.latitude, destination.longitude, 1.44);
      const midpoint = singapore.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.05 + index * 0.025);
      const curve = new THREE.QuadraticBezierCurve3(singapore, midpoint, end);
      const route = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 56, 0.008, 8, false),
        new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? 0x7ce7ff : 0xffbd72,
          transparent: true,
          opacity: 0.72
        })
      );
      routeGroup.add(route);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      marker.position.copy(end);
      routeGroup.add(marker);
    });

    const starsGeometry = new THREE.BufferGeometry();
    const stars = new Float32Array(1_350 * 3);
    for (let index = 0; index < stars.length; index += 3) {
      const radius = 10 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      stars[index] = radius * Math.sin(phi) * Math.cos(theta);
      stars[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
      stars[index + 2] = radius * Math.cos(phi);
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
    const starField = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: 0xd8f7ff, size: 0.025, transparent: true, opacity: 0.78 })
    );
    scene.add(starField);

    scene.add(new THREE.HemisphereLight(0x9eeeff, 0x061012, 1.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(-3, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x58d9ff, 3.4);
    rimLight.position.set(4, -1, -2);
    scene.add(rimLight);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let frame = 0;
    let isIntersecting = true;
    let isPageVisible = !document.hidden;
    const clock = new THREE.Clock();
    const renderFrame = () => {
      frame = 0;
      if (disposed || !isIntersecting || !isPageVisible) return;

      const elapsed = reduceMotion ? 0 : clock.getElapsedTime();
      const progress = reduceMotion ? 0.18 : scrollYProgress.get();
      const approach = smoothStep(0, 0.5, progress);
      const departure = smoothStep(0.52, 0.92, progress);

      world.rotation.y = -0.46 + progress * 3.35 + elapsed * 0.035;
      world.rotation.x = -0.1 + Math.sin(elapsed * 0.18) * 0.025;
      world.position.x = THREE.MathUtils.lerp(0.6, -1.85, departure);
      world.position.y = THREE.MathUtils.lerp(0.04, 0.18, departure);
      world.scale.setScalar(THREE.MathUtils.lerp(1, 1.44, approach) * THREE.MathUtils.lerp(1, 0.8, departure));
      routeGroup.rotation.y = elapsed * 0.05;
      starField.rotation.y = elapsed * 0.006;
      camera.position.z = THREE.MathUtils.lerp(5.4, 3.95, approach);
      earthMaterial.opacity = THREE.MathUtils.lerp(1, 0.28, smoothStep(0.8, 1, progress));
      atmosphereMaterial.opacity = THREE.MathUtils.lerp(1, 0.18, smoothStep(0.8, 1, progress));
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      if (!reduceMotion) frame = window.requestAnimationFrame(renderFrame);
    };

    function requestRender() {
      if (!frame && !disposed && isIntersecting && isPageVisible) {
        frame = window.requestAnimationFrame(renderFrame);
      }
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) requestRender();
        else if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "160px" }
    );
    intersectionObserver.observe(section);

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) requestRender();
      else if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setRendererUnavailable(true);
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    const stopScrollRender = scrollYProgress.on("change", () => {
      if (reduceMotion) requestRender();
    });
    requestRender();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      stopScrollRender();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) material.map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
    };
  }, [reduceMotion, scrollYProgress]);

  return (
    <section ref={sectionRef} id="opening" className="cinematic-opening" aria-label="Atlas Exchange world journey">
      <div className="cinematic-stage">
        <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden="true" />
        {rendererUnavailable && campuses[0] && (
          <div className="cinematic-render-fallback" aria-hidden="true">
            <img src={campuses[0].imagePath} alt="" />
          </div>
        )}
        <div className="cinematic-shade" aria-hidden="true" />

        <motion.div className="cinematic-signal" style={{ opacity: signalOpacity }} aria-hidden="true">
          <span>01 / WORLD</span>
          <i />
          <span>02 / CAMPUS</span>
          <i />
          <span>03 / PLAN</span>
        </motion.div>

        <motion.div className="opening-copy" style={{ opacity: openingOpacity }}>
          <p>Departure sequence / Singapore origin</p>
          <h1>From one point on Earth to a semester anywhere.</h1>
          <span>Follow the routes. Meet the campuses. Build the plan.</span>
        </motion.div>

        <motion.div className="campus-flightdeck" style={{ opacity: campusOpacity, y: campusY }}>
          {campuses.slice(0, visibleCampusCount).map((campus, index) => (
            <figure
              key={campus.name}
              className="campus-window"
              style={{ "--campus-index": index } as CSSProperties}
            >
              <img src={campus.imagePath} alt={`${campus.name} campus`} />
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")} / {campus.country}</span>
                <strong>{campus.name}</strong>
                <small>{campus.city}</small>
              </figcaption>
            </figure>
          ))}
        </motion.div>

        <motion.div
          className="welcome-reveal"
          style={{ opacity: welcomeOpacity, scale: welcomeScale, x: "-50%", y: "-50%" }}
        >
          <p>Destination intelligence for the whole exchange</p>
          <h2>Welcome to <strong>Atlas Exchange</strong></h2>
          <span>Choose the campus. See the life around it. Leave with a plan.</span>
        </motion.div>

        <div className="cinematic-scroll-cue" aria-hidden="true">
          <span>Scroll to travel</span>
          <i />
        </div>
        <p className="cinematic-credit">Earth texture: NASA Visible Earth / Blue Marble</p>
      </div>
    </section>
  );
}

function toGlobePoint(latitude: number, longitude: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function smoothStep(min: number, max: number, value: number) {
  const normalized = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}
