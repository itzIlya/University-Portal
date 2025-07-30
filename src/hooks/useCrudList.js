import { useState, useEffect } from "react";
import api from "../api/axios";

const useCrudList = (endpoint, initialItem, basePath = "/") => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState(initialItem);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const fullEndpoint = `${basePath}${endpoint}`;
        const response = await api.get(fullEndpoint);
        setItems(response.data);
        setLoading(false);
      } catch (err) {
        console.error(`Failed to fetch ${basePath}${endpoint}:`, err);
        setError(
          err.response?.status === 403
            ? "Unauthorized: Please sign in as an admin"
            : err.response?.status === 404
            ? `Endpoint ${basePath}${endpoint} not found. Please check the backend URL configuration.`
            : "Failed to load data. Please try again later."
        );
        setLoading(false);
      }
    };

    fetchItems();
  }, [endpoint, basePath]);

  const create = async () => {
    try {
      const fullEndpoint = `${basePath}${endpoint}`;
      const response = await api.post(fullEndpoint, newItem);
      setItems([...items, response.data]);
      setNewItem(initialItem);
      alert("Item created successfully!");
    } catch (err) {
      console.error(`Failed to create ${basePath}${endpoint}:`, err);
      setError(
        err.response?.data
          ? Object.values(err.response.data).flat().join("\n") ||
              "Failed to create item"
          : err.response?.status === 403
          ? "CSRF token missing or invalid. Please refresh and try again."
          : err.response?.status === 404
          ? `Endpoint ${basePath}${endpoint} not found. Please check the backend URL configuration.`
          : err.response?.status === 400
          ? "Invalid data provided. Please check the form."
          : "Server error: Please try again later"
      );
    }
  };

  return { items, loading, error, setError, newItem, setNewItem, create };
};

export default useCrudList;