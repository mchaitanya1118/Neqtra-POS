const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAnXa0VGT3PsV2KjzagX4I0wmpT_ApFzO0");

async function run() {
  try {
    const result = await genAI.listModels();
    console.log("SUPPORTED MODELS:");
    result.models.forEach(m => console.log(m.name));
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
run();
