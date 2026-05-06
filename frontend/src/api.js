import axios from "axios";

const API = axios.create({
  baseURL: "https://otms-backend.onrender.com",
});

export default API;