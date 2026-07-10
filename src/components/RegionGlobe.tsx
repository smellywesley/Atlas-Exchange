"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import type { DestinationRegion } from "@/lib/schema";
import { getUniversityCoordinates, type ExchangeCountry } from "@/lib/exchange-map-data";

type RegionGlobeProps = {
  activeRegion: DestinationRegion;
  countries: ExchangeCountry[];
  selectedCountry: ExchangeCountry;
  isDetailOpen: boolean;
  highlightedUniversityName?: string;
  onCountrySelect: (country: ExchangeCountry, universityName?: string) => void;
};

type MarkerRecord = {
  country: ExchangeCountry;
  mesh: THREE.Mesh;
  kind: "country" | "university";
  universityName?: string;
};

const countryTemplateLabels: Record<ExchangeCountry["template"], string> = {
  metropolis: "city campus",
  mountain: "alpine planning",
  coastal: "coastal commute",
  campus: "campus network",
  heritage: "heritage route",
  pacific: "pacific campus"
};

export function RegionGlobe({
  activeRegion,
  countries,
  selectedCountry,
  isDetailOpen,
  highlightedUniversityName,
  onCountrySelect
}: RegionGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedCountry);
  const isDetailOpenRef = useRef(isDetailOpen);
  const highlightedUniversityNameRef = useRef(highlightedUniversityName);
  const countriesRef = useRef(countries);
  const onCountrySelectRef = useRef(onCountrySelect);

  const visibleUniversities = useMemo(
    () => selectedCountry.universities.slice(0, 5),
    [selectedCountry]
  );

  useEffect(() => {
    selectedRef.current = selectedCountry;
  }, [selectedCountry]);

  useEffect(() => {
    isDetailOpenRef.current = isDetailOpen;
  }, [isDetailOpen]);

  useEffect(() => {
    highlightedUniversityNameRef.current = highlightedUniversityName;
  }, [highlightedUniversityName]);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    onCountrySelectRef.current = onCountrySelect;
  }, [onCountrySelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }
    const host = mount;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4.95);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xb7f3ff, 0.9);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3.2, 2.4, 4.8);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x37b7c8, 1.35);
    rimLight.position.set(-3.8, -1.2, 2.4);
    scene.add(rimLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const earthTexture = new THREE.CanvasTexture(createEarthTexture());
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = 4;

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 96, 96),
      new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 0.72,
        metalness: 0.06
      })
    );
    globeGroup.add(globe);

    const cloudTexture = new THREE.CanvasTexture(createCloudTexture());
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.575, 96, 96),
      new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
      })
    );
    globeGroup.add(clouds);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.64, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x37b7c8,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
      })
    );
    globeGroup.add(atmosphere);

    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);
    const markerRecords: MarkerRecord[] = [];

    function syncMarkers() {
      markerRecords.splice(0);
      markerGroup.clear();
      countriesRef.current.forEach((country) => {
        const isSelectedCountry = country.id === selectedRef.current.id;
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 18, 18),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(country.accent),
            emissive: new THREE.Color(country.accent),
            emissiveIntensity: isSelectedCountry ? 1.8 : 0.8,
            roughness: 0.2
          })
        );
        marker.position.copy(latLonToVector3(country.latitude, country.longitude, 1.64));
        marker.userData.countryId = country.id;
        marker.userData.markerKind = "country";
        markerGroup.add(marker);

        const pulse = new THREE.Mesh(
          new THREE.RingGeometry(0.052, 0.07, 28),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(country.accent),
            transparent: true,
            opacity: 0.62,
            side: THREE.DoubleSide
          })
        );
        pulse.position.copy(latLonToVector3(country.latitude, country.longitude, 1.645));
        pulse.lookAt(new THREE.Vector3(0, 0, 0));
        pulse.userData.countryId = country.id;
        pulse.userData.markerKind = "country";
        markerGroup.add(pulse);

        markerRecords.push({ country, mesh: marker, kind: "country" });

        country.universities.forEach((university, index) => {
          const coordinates = getUniversityCoordinates(university, country, index);
          const universityMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.018, 14, 14),
            new THREE.MeshStandardMaterial({
              color: 0xf4f7f5,
              emissive: new THREE.Color(country.accent),
              emissiveIntensity: 0.65,
              roughness: 0.35
            })
          );
          universityMarker.position.copy(
            latLonToVector3(coordinates.latitude, coordinates.longitude, 1.675)
          );
          universityMarker.userData.countryId = country.id;
          universityMarker.userData.universityName = university.name;
          universityMarker.userData.markerKind = "university";
          markerGroup.add(universityMarker);

          const label = createTextSprite(university.name, country.accent);
          label.position.copy(
            latLonToVector3(coordinates.latitude, coordinates.longitude, 1.78)
          );
          label.userData.countryId = country.id;
          label.userData.universityName = university.name;
          label.userData.markerKind = "university";
          markerGroup.add(label);

          markerRecords.push({
            country,
            mesh: universityMarker,
            kind: "university",
            universityName: university.name
          });
        });
      });
    }

    syncMarkers();

    const stars = createStarField();
    scene.add(stars);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragState = {
      active: false,
      moved: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0
    };

    let targetZoom = 4.95;
    let frameId = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    function focusCountry(country: ExchangeCountry) {
      targetRotationX = THREE.MathUtils.clamp(
        THREE.MathUtils.degToRad(country.latitude * 0.55),
        -0.9,
        0.9
      );
      targetRotationY = -THREE.MathUtils.degToRad(country.longitude);
      targetZoom = 3.75;
    }

    focusCountry(selectedRef.current);

    function updateMarkerMaterials() {
      markerRecords.forEach(({ country, mesh, kind, universityName }) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = country.id === selectedRef.current.id;
        const isHighlightedUniversity =
          kind === "university" &&
          isSelected &&
          universityName === highlightedUniversityNameRef.current;
        material.emissiveIntensity =
          kind === "country" ? (isSelected ? 2 : 0.8) : (isHighlightedUniversity ? 1.9 : 0.65);
        mesh.scale.setScalar(
          kind === "country" ? (isSelected ? 1.45 : 1) : (isHighlightedUniversity ? 1.8 : 1)
        );
      });
    }

    function resize() {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    function setPointerFromEvent(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerDown(event: PointerEvent) {
      dragState.active = true;
      dragState.moved = false;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
      if (!dragState.active) {
        return;
      }
      const dx = event.clientX - dragState.lastX;
      const dy = event.clientY - dragState.lastY;
      if (Math.abs(event.clientX - dragState.startX) + Math.abs(event.clientY - dragState.startY) > 6) {
        dragState.moved = true;
      }
      globeGroup.rotation.y += dx * 0.006;
      globeGroup.rotation.x = THREE.MathUtils.clamp(globeGroup.rotation.x + dy * 0.004, -1.05, 1.05);
      targetRotationX = globeGroup.rotation.x;
      targetRotationY = globeGroup.rotation.y;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
    }

    function onPointerUp(event: PointerEvent) {
      if (!dragState.active) {
        return;
      }
      dragState.active = false;
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        // The browser may release capture automatically during fast gestures.
      }
      if (dragState.moved) {
        return;
      }
      setPointerFromEvent(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(markerGroup.children, false);
      const picked = intersections[0]?.object;
      const countryId = picked?.userData.countryId as string | undefined;
      const universityName = picked?.userData.universityName as string | undefined;
      const country = countriesRef.current.find((item) => item.id === countryId);
      if (country) {
        selectedRef.current = country;
        isDetailOpenRef.current = true;
        highlightedUniversityNameRef.current = universityName;
        focusCountry(country);
        updateMarkerMaterials();
        onCountrySelectRef.current(country, universityName);
      }
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.003, 3.35, 5.8);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const focusedCountry = selectedRef.current;
      if (!dragState.active) {
        if (isDetailOpenRef.current) {
          targetRotationX = THREE.MathUtils.clamp(
            THREE.MathUtils.degToRad(focusedCountry.latitude * 0.55),
            -0.9,
            0.9
          );
          targetRotationY = -THREE.MathUtils.degToRad(focusedCountry.longitude);
          globeGroup.rotation.x = THREE.MathUtils.lerp(globeGroup.rotation.x, targetRotationX, 0.045);
          globeGroup.rotation.y = lerpAngle(globeGroup.rotation.y, targetRotationY, 0.045);
          targetZoom = 3.75;
        } else {
          globeGroup.rotation.x = THREE.MathUtils.lerp(globeGroup.rotation.x, 0.08, 0.018);
          globeGroup.rotation.y += 0.0026;
          targetZoom = 4.95;
        }
        clouds.rotation.y += 0.0015;
      }
      stars.rotation.y += 0.0005;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZoom, 0.06);
      updateMarkerMaterials();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      earthTexture.dispose();
      cloudTexture.dispose();
      globe.geometry.dispose();
      clouds.geometry.dispose();
      atmosphere.geometry.dispose();
      stars.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [activeRegion]);

  useEffect(() => {
    selectedRef.current = selectedCountry;
  }, [selectedCountry.id, selectedCountry]);

  return (
    <div
      className={`globe-card globe-template-${selectedCountry.template}`}
      style={{ "--country-accent": selectedCountry.accent } as CSSProperties}
      aria-label={`Interactive exchange globe ${isDetailOpen ? `focused on ${selectedCountry.name}` : "ready for country selection"}`}
    >
      <div ref={mountRef} className="three-globe-mount" />
      <div className="globe-hud">
        <div>
          <span>Drag / zoom / click university labels</span>
          <strong>{selectedCountry.name}</strong>
        </div>
      </div>
      <div className="country-orbit-list" aria-label={`${activeRegion} exchange country options`}>
        {countries.map((country) => (
          <button
            key={country.id}
            type="button"
            className={country.id === selectedCountry.id ? "active" : ""}
            onClick={() => onCountrySelect(country)}
          >
            <span style={{ "--country-accent": country.accent } as CSSProperties} />
            {country.name}
          </button>
        ))}
      </div>
      {isDetailOpen ? (
        <aside className="globe-country-panel">
          <span>{countryTemplateLabels[selectedCountry.template]}</span>
          <h3>{selectedCountry.focusLabel}</h3>
          <p>{selectedCountry.summary}</p>
          <div className="country-logistics-note">{selectedCountry.logisticsAngle}</div>
          <div className="country-university-list">
            {visibleUniversities.map((university) => (
              <button
                key={`${university.name}-${university.city}-${university.partnership}`}
                type="button"
                className={university.name === highlightedUniversityName ? "active" : ""}
                onClick={() => onCountrySelect(selectedCountry, university.name)}
              >
                <strong>{university.name}</strong>
                <span>
                  {university.city} / {university.partnership}
                  {university.faculties ? ` / ${university.faculties.join(", ")}` : ""}
                </span>
              </button>
            ))}
          </div>
        </aside>
      ) : (
        <aside className="globe-idle-panel">
          <span>All partner cities are pinned</span>
          <strong>Click a country marker or search below to open the campus HUD.</strong>
        </aside>
      )}
    </div>
  );
}

function latLonToVector3(latitude: number, longitude: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function lerpAngle(current: number, target: number, alpha: number) {
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return current + delta * alpha;
}

function createTextSprite(label: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const shortLabel = label.length > 28 ? `${label.slice(0, 25)}...` : label;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(8, 17, 17, 0.72)";
    roundRect(ctx, 12, 30, 488, 70, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#f4f7f5";
    ctx.font = "700 30px Segoe UI, Arial, sans-serif";
    ctx.fillText(shortLabel, 34, 75);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      opacity: 0.9
    })
  );
  sprite.scale.set(0.56, 0.14, 1);
  return sprite;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  const ocean = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, "#071923");
  ocean.addColorStop(0.45, "#0a5d78");
  ocean.addColorStop(0.72, "#128cb1");
  ocean.addColorStop(1, "#08212c");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawLand(ctx, canvas.width, canvas.height, [
    [-168, 72], [-126, 58], [-112, 34], [-96, 16], [-78, 7], [-59, -20], [-68, -55], [-92, -42], [-105, -8], [-122, 22], [-146, 48]
  ], "#3a6a4e");
  drawLand(ctx, canvas.width, canvas.height, [
    [-82, 12], [-70, -8], [-58, -22], [-47, -52], [-66, -55], [-78, -28]
  ], "#4d7a4b");
  drawLand(ctx, canvas.width, canvas.height, [
    [-10, 72], [38, 70], [58, 50], [104, 58], [150, 48], [142, 18], [112, 4], [78, 23], [48, 6], [35, -34], [12, -35], [3, 8], [-12, 36]
  ], "#5f7651");
  drawLand(ctx, canvas.width, canvas.height, [
    [-18, 34], [30, 33], [50, 10], [42, -35], [18, -35], [2, -5]
  ], "#6f6e45");
  drawLand(ctx, canvas.width, canvas.height, [
    [108, 6], [126, 2], [132, -18], [112, -12]
  ], "#598f58");
  drawLand(ctx, canvas.width, canvas.height, [
    [112, -10], [154, -12], [152, -38], [118, -34]
  ], "#9a7848");
  drawLand(ctx, canvas.width, canvas.height, [
    [-8, 58], [22, 60], [18, 43], [-4, 44]
  ], "#4f7c5d");

  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#bfefff";
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let lon = -150; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return canvas;
}

function createCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.52)";
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 137) % canvas.width);
    const y = 80 + ((i * 71) % (canvas.height - 160));
    const radiusX = 24 + ((i * 17) % 70);
    const radiusY = 8 + ((i * 11) % 26);
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, (i % 9) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

function drawLand(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  points: Array<[number, number]>,
  color: string
) {
  ctx.beginPath();
  points.forEach(([lon, lat], index) => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(244,247,245,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  for (let i = 0; i < 700; i += 1) {
    const radius = 8 + ((i * 13) % 10);
    const theta = (i * 2.399963229728653) % (Math.PI * 2);
    const phi = Math.acos(2 * ((i * 97) % 1000) / 1000 - 1);
    vertices.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xd8f6ff,
      size: 0.018,
      transparent: true,
      opacity: 0.75
    })
  );
}
