import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

const LeafletMap = ({ lat = 28.2096, lng = 83.9856 }) => {
  useEffect(() => {
    const map = L.map("map").setView([lat, lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup("Sensor Location").openPopup();

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return (
    <div
      id="map"
      style={{ width: "100%", height: "300px", borderRadius: "10px" }}
    ></div>
  );
};

export default LeafletMap;
