import { Backend } from "@staticbackend/js";

declare global {
	var bkn: Backend;
}

interface Window {
	bkn: Backend;
}