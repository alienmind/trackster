# How to Add New Devices to Trackster

Trackster is designed to grow with the community! You can easily propose new hardware definitions by submitting a basic JSON data file that describes the device's brand, model, and physical ports.

Once the JSON is added to the root `/devices/` folder, a core developer will craft a custom React UI visualizer for it inside `src/devices/`.

We strongly encourage you to **use an LLM (Large Language Model)** like Claude, ChatGPT, or Gemini to do the heavy lifting for you!

## The Power of Multimodal AI

Modern AI models are excellent at translating images into code. By simply uploading a top-down picture of your synthesizer, groovebox, or mixer to an LLM, it can instantly generate both the port mappings and a beautiful SVG render of the device.

## Sourcing Images (Frictionless Paste)

Trackster has a native clipboard interception feature for easily embedding images without dealing with URLs or CORS errors:
1. In the New Device Modal, click the **"Search Images"** button. This automatically opens a Google Image search perfectly tailored for your device (top view, transparent).
2. Find the perfect image in the search results, and **click it to open it fully on its original site or in the full-size Google preview pane**.
3. **Right-click** the full-size image and select **"Copy Image"**.
4. Switch back to your Trackster tab and simply press **Ctrl + V** (or Cmd + V). The app will intercept the paste, read the image from your clipboard, instantly convert it to Base64, and embed it straight into your JSON configuration!

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
>     // ID should conventionally contain "In" or "Out" (e.g. "audioIn", "midiOut") so they are auto-placed on the left/right.
>     // Type must be one of the standard port types: XLR, TRS, TR, MINIJACK, MIDI_5PIN, USB_A, USB_B, USB_C, POWER.
>     { "id": "audioOut", "type": "TRS" },
>     { "id": "midiIn", "type": "MIDI_5PIN" }
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
2. (Optional) Follow the "Sourcing Images" steps above to paste a real photo instead of using an SVG.
3. Ensure the JSON is valid (the window will tell you if it's not) and the Live Preview looks correct.
4. Click **"Download Device JSON"**.
5. Save the downloaded `.json` file to your computer.
6. Drag and drop the downloaded file directly into the **[Trackster GitHub Upload Page](https://github.com/alienmind/trackster/upload/main/devices)**. GitHub will automatically handle creating a new branch and opening a Pull Request for you!
7. A core developer will then review the data, approve the Pull Request, and implement the custom React-based visual element for the device in `src/devices/`.
