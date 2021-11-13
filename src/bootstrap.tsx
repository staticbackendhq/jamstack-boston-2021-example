import React from "react";
import ReactDOM from "react-dom";

import { Backend } from "@staticbackend/js";

bkn = new Backend("618fb5662b3aede13a81e993", "dev");

import { App } from "./app";

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById("app")
);