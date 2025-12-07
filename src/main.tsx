import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {sdds_finai__light} from "@salutejs/sdds-themes";
import {createGlobalStyle} from "styled-components";

console.log(sdds_finai__light);
const Theme = createGlobalStyle(sdds_finai__light);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Theme/>

    <App />
  </React.StrictMode>,
)



