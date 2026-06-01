# How to Add New Devices to Trackster

Trackster is designed to grow with the community! While the app currently does not support dynamic runtime loading of generic devices, you can easily propose new hardware definitions by submitting a JSON file.

We strongly encourage you to **use an LLM (Large Language Model)** like Claude, ChatGPT, or Gemini to do the heavy lifting for you!

## The Power of Multimodal AI

Modern AI models are excellent at translating images into code. By simply uploading a top-down picture of your synthesizer, groovebox, or mixer to an LLM, it can instantly generate both the port mappings and a beautiful SVG render of the device.

## The Prompt

Copy and paste the following prompt into your favorite LLM, and **attach a picture of the top/front face of your hardware device**.

> **Prompt for the LLM:**
>
> I am adding a new hardware device to a web-based studio diagram tool called Trackster. I need you to generate a JSON configuration for this device based on the attached image.
> 
> Please generate a raw JSON object with the following structure:
> 
> ```json
> {
>   "brand": "Manufacturer Name",
>   "model": "Device Name",
>   "tagline": "ONE WORD (e.g., SYNTH, SEQUENCER, MIXER)",
>   "width": 300, // Approximate relative width in pixels (typically 200-400)
>   "theme": {
>     "border": "border-t-neutral-500", // Pick a Tailwind color that matches the device's branding
>     "header": "bg-neutral-900",
>     "title": "text-white",
>     "badge": "bg-neutral-800 text-neutral-400"
>   },
>   "ports": [
>     // Map out the physical ports visible on the device.
>     // Valid sides are: 'left', 'right', 'top', 'bottom'
>     // Offset is a percentage from 0-100 indicating where on that side the port is.
>     { "id": "audioOut", "title": "Audio Out", "color": "#06b6d4", "side": "right", "offset": 50 }
>   ],
>   "svgRender": "<svg viewBox=\"0 0 300 200\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
>   "imageUrl": "" // Optional: URL to an image (PNG/JPG/WEBP/GIF) (used if svgRender is empty)
> }
> ```
> 
> **CRITICAL INSTRUCTIONS FOR THE SVG:**
> 1. Use the attached image to recreate a simplified, flat-design vector representation of the device's faceplate (buttons, knobs, pads, screens).
> 2. Ensure the SVG `viewBox` ratio roughly matches the physical aspect ratio of the device.
> 3. Use inline styles or standard SVG attributes for colors. Do not use external CSS.
> 4. Keep it relatively abstract but recognizable. You don't need to draw every single text label, but the layout of knobs and pads should be accurate.
> 5. Output the final SVG as a single, minified string inside the `svgRender` property in the JSON. Escape double quotes `\"` properly inside the string!
> 
> Return ONLY valid JSON. Do not include markdown formatting or explanations.

## Submitting Your Device

1. Once the LLM generates the JSON, paste it into the "Add Custom Device" window in Trackster.
2. Ensure the JSON is valid (the window will tell you if it's not).
3. Click **"Submit via GitHub PR"**.
4. This will automatically open a Pull Request on the Trackster repository with your JSON. The maintainers will review it, translate the SVG string into the app's React architecture, and release it in the next update!
