"use client";
/* eslint-disable @next/next/no-img-element -- campus imagery is supplied as verified local WebP assets. */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import * as THREE from "three";
import type { DestinationRegion } from "@/lib/schema";
import { getUniversityCoordinates, getUniversityRouteKey, type ExchangeCountry } from "@/lib/exchange-map-data";
import { getUniversityImagePath } from "@/lib/university-assets";

type RegionGlobeProps = {
  activeRegion: DestinationRegion;
  countries: ExchangeCountry[];
  selectedCountry: ExchangeCountry;
  isDetailOpen: boolean;
  highlightedUniversityKey?: string;
  disabled?: boolean;
  onCountrySelect: (
    country: ExchangeCountry,
    universityName?: string,
    shouldScroll?: boolean,
    routeKey?: string
  ) => void;
};

type MarkerRecord = {
  country: ExchangeCountry;
  mesh: THREE.Mesh;
  kind: "country" | "university";
  universityName?: string;
  universityRouteKey?: string;
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
  highlightedUniversityKey,
  disabled = false,
  onCountrySelect
}: RegionGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenTriggerRef = useRef<HTMLButtonElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRendererUnavailable, setIsRendererUnavailable] = useState(false);
  const selectedRef = useRef(selectedCountry);
  const isDetailOpenRef = useRef(isDetailOpen);
  const highlightedUniversityKeyRef = useRef(highlightedUniversityKey);
  const countriesRef = useRef(countries);
  const onCountrySelectRef = useRef(onCountrySelect);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const selectedUniversity = selectedCountry.universities.find(
    (university) => getUniversityRouteKey(university) === highlightedUniversityKey
  ) ?? selectedCountry.universities[0];
  const selectedUniversityImage = getUniversityImagePath(selectedUniversity.name);

  useEffect(() => {
    selectedRef.current = selectedCountry;
  }, [selectedCountry]);

  useEffect(() => {
    isDetailOpenRef.current = isDetailOpen;
  }, [isDetailOpen]);

  useEffect(() => {
    highlightedUniversityKeyRef.current = highlightedUniversityKey;
  }, [highlightedUniversityKey]);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    onCountrySelectRef.current = onCountrySelect;
  }, [onCountrySelect]);

  useEffect(() => {
    if (!isFullscreen) return;

    const dialog = fullscreenRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : fullscreenTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();

    function handleFullscreenKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsFullscreen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsOutside = !(document.activeElement instanceof Node) ||
        !dialog.contains(document.activeElement);
      if (event.shiftKey && (
        document.activeElement === first ||
        document.activeElement === dialog ||
        focusIsOutside
      )) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (
        document.activeElement === last ||
        document.activeElement === dialog ||
        focusIsOutside
      )) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleFullscreenKeydown);
    return () => {
      document.removeEventListener("keydown", handleFullscreenKeydown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isFullscreen]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }
    const host = mount;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4.95);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      setIsRendererUnavailable(false);
    } catch {
      setIsRendererUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setIsRendererUnavailable(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

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

    const loadedTextures: THREE.Texture[] = [];
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

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

    textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        loadedTextures.push(texture);
        const material = globe.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.needsUpdate = true;
      }
    );

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

    textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        loadedTextures.push(texture);
        const material = clouds.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.opacity = 0.34;
        material.needsUpdate = true;
      }
    );

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
      disposeObjectResources(markerGroup);
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
          universityMarker.userData.universityRouteKey = getUniversityRouteKey(university);
          universityMarker.userData.markerKind = "university";
          markerGroup.add(universityMarker);

          const label = createTextSprite(university.name, country.accent);
          label.position.copy(
            latLonToVector3(coordinates.latitude, coordinates.longitude, 1.78)
          );
          label.userData.countryId = country.id;
          label.userData.universityName = university.name;
          label.userData.universityRouteKey = getUniversityRouteKey(university);
          label.userData.markerKind = "university";
          markerGroup.add(label);

          markerRecords.push({
            country,
            mesh: universityMarker,
            kind: "university",
            universityName: university.name,
            universityRouteKey: getUniversityRouteKey(university)
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
      markerRecords.forEach(({ country, mesh, kind, universityRouteKey: markerRouteKey }) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = country.id === selectedRef.current.id;
        const isHighlightedUniversity =
          kind === "university" &&
          isSelected &&
          markerRouteKey === highlightedUniversityKeyRef.current;
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
      if (disabledRef.current) return;
      dragState.active = true;
      dragState.moved = false;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
      if (disabledRef.current) return;
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
      if (disabledRef.current) return;
      if (dragState.moved) {
        return;
      }
      setPointerFromEvent(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(markerGroup.children, true);
      const picked = intersections[0]?.object;
      const countryId = picked?.userData.countryId as string | undefined;
      const universityName = picked?.userData.universityName as string | undefined;
      const pickedUniversityRouteKey = picked?.userData.universityRouteKey as string | undefined;
      const country = countriesRef.current.find((item) => item.id === countryId);
      if (country) {
        selectedRef.current = country;
        isDetailOpenRef.current = true;
        highlightedUniversityKeyRef.current = pickedUniversityRouteKey;
        focusCountry(country);
        updateMarkerMaterials();
        onCountrySelectRef.current(
          country,
          universityName,
          Boolean(universityName),
          pickedUniversityRouteKey
        );
      }
    }

    function onPointerCancel(event: PointerEvent) {
      dragState.active = false;
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }

    function onLostPointerCapture() {
      dragState.active = false;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.003, 3.35, 5.8);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);
    renderer.domElement.addEventListener("lostpointercapture", onLostPointerCapture);
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
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("lostpointercapture", onLostPointerCapture);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      disposeObjectResources(markerGroup);
      earthTexture.dispose();
      cloudTexture.dispose();
      loadedTextures.forEach((texture) => texture.dispose());
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
      ref={fullscreenRef}
      className={`globe-card globe-template-${selectedCountry.template} ${isFullscreen ? "is-fullscreen" : ""}`}
      style={{ "--country-accent": selectedCountry.accent } as CSSProperties}
      role={isFullscreen ? "dialog" : "region"}
      aria-modal={isFullscreen ? "true" : undefined}
      aria-labelledby={isFullscreen ? "exchange-atlas-heading" : undefined}
      aria-label={isFullscreen ? undefined : `Interactive exchange atlas ${isDetailOpen ? `focused on ${selectedCountry.name}` : "ready for country selection"}`}
      aria-busy={disabled || undefined}
      tabIndex={isFullscreen ? -1 : undefined}
    >
      <div ref={mountRef} className="three-globe-mount" aria-hidden="true" />
      {isRendererUnavailable && (
        <div className="globe-render-error" role="status">
          3D view unavailable. Use the country and university controls to continue.
        </div>
      )}
      <div className="globe-hud">
        <div>
          <span>Drag / zoom / click university markers</span>
          <strong id="exchange-atlas-heading">{selectedCountry.name}</strong>
        </div>
        <button
          ref={fullscreenTriggerRef}
          type="button"
          onClick={() => setIsFullscreen((value) => !value)}
        >
          {isFullscreen ? "Exit atlas" : "Full-screen atlas"}
        </button>
      </div>
      <div className="country-orbit-list" aria-label="Global exchange country options">
        {countries.map((country) => (
          <button
            key={country.id}
            type="button"
            className={country.id === selectedCountry.id ? "active" : ""}
            aria-pressed={country.id === selectedCountry.id}
            disabled={disabled}
            onClick={() => onCountrySelect(country)}
          >
            <span style={{ "--country-accent": country.accent } as CSSProperties} />
            {country.name}
          </button>
        ))}
      </div>
      {isDetailOpen ? (
        <aside className="globe-country-panel">
          <div className="globe-campus-identity">
            {selectedUniversityImage && (
              <img src={selectedUniversityImage} alt={`${selectedUniversity.name} campus`} />
            )}
            <div>
              <span>{selectedUniversity.city} / {selectedUniversity.partnership}</span>
              <strong>{selectedUniversity.name}</strong>
            </div>
          </div>
          <span>{countryTemplateLabels[selectedCountry.template]}</span>
          <h3>{selectedCountry.focusLabel}</h3>
          <p>{selectedCountry.summary}</p>
          <div className="country-logistics-note">{selectedCountry.logisticsAngle}</div>
          <div className="country-university-list">
            {selectedCountry.universities.map((university) => (
              <button
                key={`${university.name}-${university.city}-${university.partnership}`}
                type="button"
                className={getUniversityRouteKey(university) === highlightedUniversityKey ? "active" : ""}
                disabled={disabled}
                onClick={() => onCountrySelect(
                  selectedCountry,
                  university.name,
                  true,
                  getUniversityRouteKey(university)
                )}
              >
                <span className="university-hud-thumb" aria-hidden="true">
                  {getUniversityImagePath(university.name) && (
                    <Image
                      src={getUniversityImagePath(university.name) as string}
                      alt=""
                      fill
                      sizes="42px"
                      loading="lazy"
                    />
                  )}
                </span>
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

function disposeObjectResources(root: THREE.Object3D) {
  root.traverse((object) => {
    const renderable = object as THREE.Mesh | THREE.Sprite;
    if ("geometry" in renderable && renderable.geometry) {
      renderable.geometry.dispose();
    }

    const materials = "material" in renderable
      ? (Array.isArray(renderable.material) ? renderable.material : [renderable.material])
      : [];
    materials.forEach((material) => {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    });
  });
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
