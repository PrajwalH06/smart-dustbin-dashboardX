import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBCeQxX6S7-iAAIunvWSFyHCAjmw8xZvb8",
  authDomain: "smart-bin-control-center.firebaseapp.com",
  databaseURL: "https://smart-bin-control-center-default-rtdb.firebaseio.com/",
  projectId: "smart-bin-control-center",
  storageBucket: "smart-bin-control-center.appspot.com",
  messagingSenderId: "794340595281",
  appId: "1:794340595281:web:4ee62f94fb9fcc354f0a70",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
