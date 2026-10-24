import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Three.js needs a real GL backend in headless Chrome on macOS.
Config.setChromiumOpenGlRenderer("angle");
